// グローバルなトースト関数定義
window.app = {
    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';
        
        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

let nextRowId = 1; // 一括入力時の動的行管理用ID

/**
 * 表記揺れ（全角・半角、大文字・小文字、スペース）を吸収するための正規化関数
 */
function normalizeText(str) {
    if (!str) return '';
    // 全角英数字を半角に変換
    let normalized = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    // 全角スペースを半角スペースに変換し、前後の余白削除、小文字統一
    return normalized.replace(/　/g, ' ').trim().toLowerCase();
}

/**
 * 携帯用日報アプリのメイン初期化
 */
async function syncSitesFromCloud() {
    if (!window.CloudSync || !window.CloudSync.isEnabled()) return;
    try {
        const collection = window.CloudSync.collection('sites');
        const snapshot = await collection.get();
        const cloudSites = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.encrypted) {
                const decrypted = window.CryptoUtil.decrypt(data.encrypted);
                if (decrypted) {
                    cloudSites.push(decrypted);
                }
            }
        });
        
        if (cloudSites.length > 0) {
            const localSites = window.SiteDB.getAll();
            const cloudIds = cloudSites.map(cs => cs.id);
            
            // 1. クラウド側のデータをローカルに追加・更新
            cloudSites.forEach(cs => {
                const exist = localSites.find(ls => ls.id === cs.id || ls.code === cs.code);
                if (exist) {
                    window.SiteDB.update(exist.id, cs);
                } else {
                    window.SiteDB.add(cs);
                }
            });
            
            // 2. クラウドに存在しない（PC側で削除された）現場をスマホのローカルから一括削除（超高速化）
            const filteredSites = localSites.filter(ls => cloudIds.includes(ls.id));
            if (filteredSites.length !== localSites.length) {
                window.SiteDB.saveAll(filteredSites);
            }
            
            renderDatalists();
        }
    } catch (e) {
        console.error('Failed to sync sites from cloud:', e);
        alert(`【現場データのダウンロードに失敗しました】\n理由: ${e.message}`);
    }
}

// 送信済み日報の本日一時保存ヘルパー (日付が変わったら自動消去)
function getTodaySentReports() {
    const todayStr = new Date().toISOString().split('T')[0];
    let sentList = [];
    try {
        sentList = JSON.parse(safeStorage.getItem('sent_reports_today') || '[]');
    } catch (e) {
        sentList = [];
    }
    // 今日の日付のものだけ残す（日付が変わっていたら自動的に消える）
    const filtered = sentList.filter(item => item.date === todayStr);
    if (filtered.length !== sentList.length) {
        safeStorage.setItem('sent_reports_today', JSON.stringify(filtered));
    }
    return filtered;
}

function addSentReport(siteName) {
    const todayStr = new Date().toISOString().split('T')[0];
    const sentList = getTodaySentReports();
    sentList.push({
        siteName: siteName,
        date: todayStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    safeStorage.setItem('sent_reports_today', JSON.stringify(sentList));
}

function initDailyReportApp() {
    window.initDatabase();
    
    // クラウドから最新の現場候補を非同期で同期
    if (window.CloudSync && window.CloudSync.init()) {
        syncSitesFromCloud();
    }
    
    const container = document.getElementById('view-container');
    if (!container) return;
    
    // 予測補完用データリストの生成・更新
    renderDatalists();
    
    // 氏名が記憶されているかチェック
    const workerName = safeStorage.getItem('current_worker_name');
    if (!workerName) {
        renderNameRegistrationForm(container);
        return;
    }
    
    // 記憶されている場合のヘッダーおよび直接フォーム表示
    const appShell = document.createElement('div');
    appShell.innerHTML = `
        <!-- 作業員氏名表示バッジ -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(59, 130, 246, 0.08); padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.15); margin-bottom: 1.25rem; font-size: 0.9rem;" class="no-print">
            <div>
                <i data-lucide="user" style="width:0.95rem; height:0.95rem; display:inline-block; vertical-align:-2px; color:var(--color-primary); margin-right:0.25rem;"></i>
                <span>作業員: <strong>${workerName}</strong> さん</span>
            </div>
            <button class="btn btn-secondary" id="btn-change-name" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 6px;">氏名変更</button>
        </div>

        <!-- 一括入力フォーム表示領域 -->
        <div id="sub-view-container"></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(appShell);
    
    const subContainer = document.getElementById('sub-view-container');
    const changeNameBtn = document.getElementById('btn-change-name');
    
    // 氏名変更処理
    changeNameBtn.addEventListener('click', () => {
        if (confirm('登録されている氏名を変更しますか？')) {
            safeStorage.removeItem('current_worker_name');
            initDailyReportApp();
        }
    });
    
    // 直接入力フォームを描画
    renderBatchInputForm(subContainer);
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * 予測補完用データリスト (<datalist>) の動的生成 (3項目)
 */
function renderDatalists() {
    const sites = window.SiteDB.getAll();
    
    // 工事番号のサジェストリスト
    let listCodes = document.getElementById('suggest-site-codes');
    if (!listCodes) {
        listCodes = document.createElement('datalist');
        listCodes.id = 'suggest-site-codes';
        document.body.appendChild(listCodes);
    }
    
    // 現場名称のサジェストリスト
    let listNames = document.getElementById('suggest-site-names');
    if (!listNames) {
        listNames = document.createElement('datalist');
        listNames.id = 'suggest-site-names';
        document.body.appendChild(listNames);
    }
    
    // 受注先名称のサジェストリスト
    let listClients = document.getElementById('suggest-site-clients');
    if (!listClients) {
        listClients = document.createElement('datalist');
        listClients.id = 'suggest-site-clients';
        document.body.appendChild(listClients);
    }
    
    // 重複を除外してユニークな値をセット
    const codes = [...new Set(sites.map(s => s.code).filter(Boolean))];
    const names = [...new Set(sites.map(s => s.name).filter(Boolean))];
    const clients = [...new Set(sites.map(s => s.client).filter(Boolean))];
    
    listCodes.innerHTML = codes.map(c => `<option value="${c}">`).join('');
    listNames.innerHTML = names.map(n => `<option value="${n}">`).join('');
    listClients.innerHTML = clients.map(cl => `<option value="${cl}">`).join('');
}

/**
 * 氏名登録画面の描画 (初回のみ)
 */
function renderNameRegistrationForm(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 480px; margin: 2rem auto; padding: 2rem 1.5rem; text-align: center;">
            <div style="width: 3.5rem; height: 3.5rem; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: var(--color-success); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
                <i data-lucide="user-plus" style="width: 1.75rem; height: 1.75rem;"></i>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">作業員氏名の登録</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem;">
                日報の提出者名として使用します。<br>
                一度登録すると、次回から氏名の入力が不要になります。
            </p>
            
            <form id="worker-name-form" style="text-align: left;">
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="reg-worker-name" style="font-size: 0.9rem; font-weight: 600;">氏名 <span style="color: var(--color-danger);">*</span></label>
                    <input type="text" id="reg-worker-name" required placeholder="例: 佐藤 健太" style="padding: 0.85rem; font-size: 1rem; border-radius: 10px; width: 100%;">
                </div>
                <button type="submit" class="btn btn-success" style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 600; border-radius: 10px;">
                    登録して日報入力を始める
                </button>
            </form>
        </div>
    `;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    const form = document.getElementById('worker-name-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-worker-name').value.trim();
        if (name) {
            safeStorage.setItem('current_worker_name', name);
            window.app.showToast(`作業員「${name}」を登録しました`, 'success');
            initDailyReportApp();
        }
    });
}

/**
 * 複数現場の一括入力フォームの描画
 */
function renderBatchInputForm(container) {
    nextRowId = 1;
    
    // スマホのシステム日付を自動で今日にセット (本日の日付を動的取得)
    const todayObj = new Date();
    const today = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    
    const sentReports = getTodaySentReports();
    let sentReportsHtml = '';
    if (sentReports.length > 0) {
        sentReportsHtml = `
            <div class="card no-print" style="padding: 1rem; margin-bottom: 1rem; background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px;">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-success); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
                    <i data-lucide="check-circle" style="width: 1rem; height: 1rem; color: var(--color-success);"></i>
                    <span>本日送信済みの日報 (${sentReports.length} 件)</span>
                </div>
                <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; line-height: 1.6; color: var(--text-main); list-style-type: decimal;">
                    ${sentReports.map(r => `
                        <li style="margin-bottom: 0.25rem;">
                            <strong>${r.siteName}</strong>
                            <span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 0.35rem;">(${r.time} 送信完了)</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    container.innerHTML = `
        ${sentReportsHtml}
        <div class="card" style="padding: 1.25rem 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
                <label for="batch-date" style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary);">作業日を選択 <span style="color: var(--color-danger);">*</span></label>
                <input type="date" id="batch-date" value="${today}" required style="padding: 0.8rem; font-size: 1.05rem; border-radius: 10px; border-color: var(--color-primary);">
            </div>
        </div>
        
        <!-- 動的現場リストコンテナ -->
        <div id="batch-cards-container" style="display:flex; flex-direction:column; gap:1.25rem;"></div>
        
        <!-- 現場追加ボタン -->
        <button type="button" class="btn btn-secondary" id="btn-add-row" style="width: 100%; padding: 0.9rem; font-size: 1rem; font-weight: 600; border-radius: 12px; margin-top: 1.25rem; border: 2px dashed var(--border-light); background: rgba(255,255,255,0.02);">
            <i data-lucide="plus-circle" style="color:var(--color-primary);"></i>
            <span>行った現場を追加する</span>
        </button>
        
        <!-- 一括送信ボタン -->
        <div style="margin-top: 2rem; margin-bottom: 3rem;">
            <button type="button" class="btn btn-success" id="btn-batch-submit" style="width: 100%; padding: 1.1rem; font-size: 1.15rem; font-weight: 700; border-radius: 16px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);">
                <i data-lucide="send"></i>
                <span>本日分の日報を一括提出する</span>
            </button>
        </div>
    `;
    
    const cardsContainer = document.getElementById('batch-cards-container');
    const addRowBtn = document.getElementById('btn-add-row');
    const submitBtn = document.getElementById('btn-batch-submit');
    
    // 行（現場カード）を追加する処理
    const addNewRow = () => {
        const rowId = nextRowId++;
        const card = document.createElement('div');
        card.className = 'card batch-row-card';
        card.setAttribute('data-row-id', rowId);
        card.style.padding = '1.25rem 1rem';
        card.style.position = 'relative';
        card.style.borderLeft = '4px solid var(--color-success)';
        card.style.overflow = 'visible'; // 候補プルダウンがカード枠外にはみ出して表示されるようにする
        
        card.innerHTML = `
            <!-- 行削除ボタン -->
            <button type="button" class="btn-delete-row" style="position: absolute; right: 0.75rem; top: 0.75rem; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem;" title="現場を削除">
                <i data-lucide="trash-2" style="width: 1.1rem; height: 1.1rem;"></i>
            </button>
            
            <div style="font-size: 0.85rem; font-weight: bold; color: var(--color-success); margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <i data-lucide="building"></i>
                    <span>訪問した現場 <span class="row-index-num"></span></span>
                </div>
                <label style="display:inline-flex; align-items:center; gap:0.3rem; cursor:pointer; color:var(--text-main); font-weight:normal;">
                    <input type="checkbox" class="chk-row-office" style="width:1.1rem; height:1.1rem;">
                    <span style="font-size: 0.85rem;">事務仕事</span>
                </label>
            </div>
            
            <!-- 工事番号 ＆ 受注先 (1行目: スマホ2列レイアウト) -->
            <div class="form-row" style="gap: 0.5rem; margin-bottom: 0.75rem;">
                <div class="form-group" style="flex: 3; margin-bottom:0;">
                    <label style="font-size: 0.8rem; font-weight: 600;">工事番号</label>
                    <input type="text" class="txt-row-code" list="suggest-site-codes" placeholder="例: AB123" style="padding: 0.7rem; font-size: 0.9rem; border-radius: 8px;">
                </div>
                <div class="form-group" style="flex: 7; margin-bottom:0;">
                    <label style="font-size: 0.8rem; font-weight: 600;">受注先 (顧客/元請)</label>
                    <input type="text" class="txt-row-client" list="suggest-site-clients" placeholder="例: ○○建設、個人宅" style="padding: 0.7rem; font-size: 0.9rem; border-radius: 8px;">
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem; position: relative;">
                <label style="font-size: 0.85rem; font-weight: 600;">現場名称 <span style="color: var(--color-danger);">*</span></label>
                <input type="text" class="txt-row-name" required placeholder="例: 渋谷ビル新築" style="padding: 0.75rem; font-size: 0.95rem; border-radius: 10px;" autocomplete="off">
                <div class="suggest-dropdown" style="display: none; position: absolute; left: 0; right: 0; top: 100%; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 8px; max-height: 135px; overflow-y: auto; -webkit-overflow-scrolling: touch; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 2px;"></div>
            </div>
            
            <!-- 出発時間 (直行) / 開始時間 -->
            <div class="form-row" style="background: rgba(59,130,246,0.03); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(59,130,246,0.08); margin-bottom: 0.75rem;">
                <div class="form-group" style="margin-bottom:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                        <label style="font-size: 0.8rem; font-weight: 600; margin-bottom:0;">出発時間</label>
                        <label style="display:inline-flex; align-items:center; gap:0.2rem; font-size:0.8rem; margin-bottom:0; cursor:pointer; color:var(--color-warning); font-weight:600;">
                            <input type="checkbox" class="chk-row-go" style="width:0.95rem; height:0.95rem;">
                            <span>直行</span>
                        </label>
                    </div>
                    <input type="time" class="time-row-dep" style="padding: 0.65rem; font-size: 0.95rem; border-radius: 8px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size: 0.8rem; font-weight: 600; margin-bottom:0.25rem; display:block;">作業開始 <span style="color: var(--color-danger);">*</span></label>
                    <input type="time" class="time-row-start" required value="08:00" style="padding: 0.65rem; font-size: 0.95rem; border-radius: 8px;">
                </div>
            </div>
            
            <!-- 終了時間 / 帰社時間 (直帰) -->
            <div class="form-row" style="background: rgba(16,185,129,0.03); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(16,185,129,0.08); margin-bottom: 1rem;">
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size: 0.8rem; font-weight: 600; margin-bottom:0.25rem; display:block;">作業終了 <span style="color: var(--color-danger);">*</span></label>
                    <input type="time" class="time-row-end" required value="17:00" style="padding: 0.65rem; font-size: 0.95rem; border-radius: 8px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                        <label style="font-size: 0.8rem; font-weight: 600; margin-bottom:0;">帰社時間</label>
                        <label style="display:inline-flex; align-items:center; gap:0.2rem; font-size:0.8rem; margin-bottom:0; cursor:pointer; color:var(--color-warning); font-weight:600;">
                            <input type="checkbox" class="chk-row-back" style="width:0.95rem; height:0.95rem;">
                            <span>直帰</span>
                        </label>
                    </div>
                    <input type="time" class="time-row-ret" style="padding: 0.65rem; font-size: 0.95rem; border-radius: 8px;">
                </div>
            </div>
            
            <!-- 作業内容 -->
            <div class="form-group">
                <label style="font-size: 0.85rem; font-weight: 600;">作業内容 <span style="color: var(--color-danger);">*</span></label>
                <textarea class="txt-row-content" rows="3" required placeholder="この現場での作業内容を記入してください" style="padding: 0.7rem; font-size: 0.95rem; border-radius: 10px; font-family:var(--font-sans);"></textarea>
            </div>
            
            <div style="background: rgba(59,130,246,0.03); padding: 0.75rem; border-radius: 10px; border: 1px solid rgba(59,130,246,0.08); margin-bottom: 0;">
                <div style="font-size: 0.75rem; color: var(--color-danger); font-weight: bold; margin-bottom: 0.5rem; line-height: 1.4;">
                    ※ 同行者と協力会社同行者が重複しないようご注意ください。<br>
                    ※ 誰が「協力会社」として入力されるべきか事前にご確認ください。
                </div>
                <!-- 同行者 -->
                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label style="font-size: 0.85rem; font-weight: 600;">同行者 (一般)</label>
                    <input type="text" class="txt-row-companions" placeholder="例: 山田 太郎、鈴木 一郎" style="padding: 0.7rem; font-size: 0.95rem; border-radius: 10px;">
                </div>
                <!-- 協力会社同行者 -->
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem; font-weight: 600;">協力会社同行者</label>
                    <input type="text" class="txt-row-partner-companions" placeholder="例: 〇〇設備、△△工業" style="padding: 0.7rem; font-size: 0.95rem; border-radius: 10px;">
                </div>
            </div>
        `;
        
        cardsContainer.appendChild(card);
        
        const codeInput = card.querySelector('.txt-row-code');
        const nameInput = card.querySelector('.txt-row-name');
        const clientInput = card.querySelector('.txt-row-client');
        const nameSuggestDiv = card.querySelector('.suggest-dropdown');
        
        // 3項目相互サジェスト自動補完処理 (全角半角の表記揺れ吸収)
        const checkAutoCompletion = (sourceField) => {
            const codeVal = codeInput.value.trim();
            const sites = window.SiteDB.getAll();
            
            let match = null;
            const norm = (s) => normalizeText(s);
            
            if (sourceField === 'code' && codeVal) {
                const normVal = norm(codeVal);
                match = sites.find(s => norm(s.code) === normVal);
            }
            
            if (match) {
                // 異なる場合のみ上書き（入力中のタイピングを邪魔しない）
                if (norm(codeInput.value) !== norm(match.code)) codeInput.value = match.code;
                if (norm(nameInput.value) !== norm(match.name)) nameInput.value = match.name;
                if (norm(clientInput.value) !== norm(match.client || '')) clientInput.value = match.client || '';
            }
        };

        // 現場名称のあいまい検索カスタムプルダウンの動作 (携帯・スマホ環境での動作を保証)
        const showSuggestions = () => {
            const query = normalizeText(nameInput.value);
            if (!query) {
                nameSuggestDiv.style.display = 'none';
                return;
            }

            const sites = window.SiteDB.getAll() || [];
            // 表記揺れを考慮した部分一致検索
            const matchedSites = sites.filter(s => 
                normalizeText(s.name).includes(query) ||
                normalizeText(s.code).includes(query) ||
                (s.client && normalizeText(s.client).includes(query))
            );

            if (matchedSites.length === 0) {
                nameSuggestDiv.style.display = 'none';
                return;
            }

            // 候補リストを生成（クリックしやすいように十分なタップ領域を確保）
            nameSuggestDiv.innerHTML = matchedSites.slice(0, 8).map(s => `
                <div class="suggest-item" data-code="${s.code}" data-name="${s.name}" data-client="${s.client || ''}" style="padding: 0.9rem 1rem; border-bottom: 1px solid var(--border-light); cursor: pointer; text-align: left; background: var(--bg-card);">
                    <div style="font-weight: bold; font-size: 0.95rem; color: var(--text-main);">${s.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 0.6rem; margin-top: 0.2rem;">
                        <span>工事番号: ${s.code}</span>
                        ${s.client ? `<span>元請: ${s.client}</span>` : ''}
                    </div>
                </div>
            `).join('');

            nameSuggestDiv.style.display = 'block';

            // 各候補アイテムのクリック/タップ時の自動決定処理 (スマホのタップ遅延や競合を回避するため touchstart/mousedown を使用)
            const items = nameSuggestDiv.querySelectorAll('.suggest-item');
            items.forEach(item => {
                const selectItem = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const code = item.getAttribute('data-code');
                    const name = item.getAttribute('data-name');
                    const client = item.getAttribute('data-client');

                    nameInput.value = name;
                    codeInput.value = code;
                    clientInput.value = client;

                    nameSuggestDiv.style.display = 'none';
                };
                
                // タップ(クリック)した時のみ決定するように click イベントを紐付けます
                item.addEventListener('click', selectItem);
            });
        };

        // 携帯でのフリック入力中や日本語確定イベントに追従
        nameInput.addEventListener('input', showSuggestions);
        nameInput.addEventListener('keyup', showSuggestions);
        nameInput.addEventListener('compositionend', showSuggestions);

        // リストスクロール時にキーボードを自動で閉じて画面を広くする
        nameSuggestDiv.addEventListener('touchmove', () => {
            nameInput.blur(); // キーボードを引っ込めて隠れた候補を見せる
        }, { passive: true });

        nameSuggestDiv.addEventListener('scroll', () => {
            nameInput.blur();
        }, { passive: true });

        // フォーカスが外れた時に候補リストを閉じる (タップ決定できるように200ms遅延させる / メモリリーク防止)
        nameInput.addEventListener('blur', () => {
            setTimeout(() => {
                nameSuggestDiv.style.display = 'none';
            }, 200);
        });
        
        codeInput.addEventListener('input', () => checkAutoCompletion('code'));
        codeInput.addEventListener('change', () => checkAutoCompletion('code'));
        
        // 削除ボタンと連動イベントハンドラ
        const delBtn = card.querySelector('.btn-delete-row');
        delBtn.addEventListener('click', () => {
            const allRows = cardsContainer.querySelectorAll('.batch-row-card');
            if (allRows.length <= 1) {
                window.app.showToast('最低1件の現場入力が必要です', 'error');
                return;
            }
            card.remove();
            updateRowNumbers();
        });
        
        // 直行・直帰チェックボックス時間制御
        const chkGo = card.querySelector('.chk-row-go');
        const timeDep = card.querySelector('.time-row-dep');
        const chkBack = card.querySelector('.chk-row-back');
        const timeRet = card.querySelector('.time-row-ret');
        
        chkGo.addEventListener('change', () => {
            if (chkGo.checked) {
                timeDep.value = '';
                timeDep.disabled = true;
            } else {
                timeDep.disabled = false;
            }
        });
        
        chkBack.addEventListener('change', () => {
            if (chkBack.checked) {
                timeRet.value = '';
                timeRet.disabled = true;
            } else {
                timeRet.disabled = false;
            }
        });
        
        updateRowNumbers();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };
    
    // 番号の振り直し
    const updateRowNumbers = () => {
        const cards = cardsContainer.querySelectorAll('.batch-row-card');
        cards.forEach((card, index) => {
            card.querySelector('.row-index-num').textContent = `${index + 1} 件目`;
            const delBtn = card.querySelector('.btn-delete-row');
            if (cards.length === 1) {
                delBtn.style.display = 'none';
            } else {
                delBtn.style.display = 'block';
            }
        });
    };
    
    // 初期状態で1つ追加
    addNewRow();
    
    // イベント割り当て
    addRowBtn.addEventListener('click', addNewRow);
    
    // 一括提出処理
    submitBtn.addEventListener('click', () => {
        const date = document.getElementById('batch-date').value;
        if (!date) {
            window.app.showToast('作業日を選択してください', 'error');
            return;
        }
        
        const workerName = safeStorage.getItem('current_worker_name');
        const cards = cardsContainer.querySelectorAll('.batch-row-card');
        const reportsToSubmit = [];
        const sites = window.SiteDB.getAll();
        
        // 全カードのバリデーションとデータ化
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const code = card.querySelector('.txt-row-code').value.trim();
            const name = card.querySelector('.txt-row-name').value.trim();
            const client = card.querySelector('.txt-row-client').value.trim();
            const startTime = card.querySelector('.time-row-start').value;
            const endTime = card.querySelector('.time-row-end').value;
            const workContent = card.querySelector('.txt-row-content').value.trim();
            const companions = card.querySelector('.txt-row-companions').value.trim();
            const partnerCompanions = card.querySelector('.txt-row-partner-companions').value.trim();
            const isOfficeWork = card.querySelector('.chk-row-office').checked;
            
            const isDirectGo = card.querySelector('.chk-row-go').checked;
            const departureTime = card.querySelector('.time-row-dep').value;
            const isDirectBack = card.querySelector('.chk-row-back').checked;
            const returnTime = card.querySelector('.time-row-ret').value;
            
            if (!name) {
                window.app.showToast(`${i + 1}件目の現場名称を入力してください`, 'error');
                card.querySelector('.txt-row-name').focus();
                return;
            }
            if (!startTime || !endTime) {
                window.app.showToast(`${i + 1}件目の作業開始・終了時間を入力してください`, 'error');
                return;
            }
            if (!workContent) {
                window.app.showToast(`${i + 1}件目の作業内容を入力してください`, 'error');
                card.querySelector('.txt-row-content').focus();
                return;
            }
            
            // 既存現場との紐付けチェック (工事番号がない場合は事務所作業/その他としてダミー現場 OFFICE に紐付け)
            let site = null;
            if (!code) {
                const finalName = name || '事務所作業';
                site = sites.find(s => s.code === 'OFFICE' && s.name === finalName);
                if (!site) {
                    site = window.SiteDB.add({
                        code: 'OFFICE',
                        name: finalName,
                        client: client || '社内業務',
                        clientManager: '',
                        estimateCode: '',
                        isBilled: false,
                        isPaid: false,
                        status: 'active',
                        memo: '工事番号なしの自動登録現場です。'
                    });
                }
            } else {
                site = sites.find(s => (code && s.code === code) || s.name === name);
            }
            
            // 既存に存在しない新規の現場名が手入力された場合は、裏側で自動的に新規現場登録する
            if (!site) {
                const autoCode = code || ('XX' + String(Date.now()).slice(-3));
                site = window.SiteDB.add({
                    code: autoCode,
                    name: name,
                    client: client || '手入力新規現場',
                    clientManager: '',
                    estimateCode: '',
                    isBilled: false,
                    isPaid: false,
                    status: 'active',
                    memo: '現場日報入力時に自動追加されました。'
                });
            } else {
                // 既存現場がある場合、手入力された受注先(client)が既存と異なっており、かつ空でないなら、
                // 台帳側の情報も親切にアップデートする（ただし、工事番号なしの OFFICE は共有現場マスタのため上書きしない）
                if (site.code !== 'OFFICE' && client && site.client !== client) {
                    site.client = client;
                    window.SiteDB.update(site.id, site);
                }
            }
            
            reportsToSubmit.push({
                siteId: site.id,
                date,
                weather: '晴れ',
                writer: workerName,
                departureTime: isDirectGo ? '' : departureTime,
                isDirectGo,
                startTime,
                endTime,
                returnTime: isDirectBack ? '' : returnTime,
                isDirectBack,
                workContent,
                companions,
                partnerCompanions,
                isOfficeWork, // 事務仕事フラグを保存
                client, // 個別に入力された受注先も保存
                siteName: name, // スマホ側で手入力された現場名称を保存
                siteCode: code || '' // スマホ側で手入力された工事番号を保存
            });
        }
        
        // 保存処理
        const submitPromises = reportsToSubmit.map(async (rep) => {
            if (window.CloudSync && window.CloudSync.isEnabled()) {
                try {
                    const collection = window.CloudSync.collection('reports');
                    const encryptedData = window.CryptoUtil.encrypt(rep);
                    if (encryptedData) {
                        await collection.add({
                            encrypted: encryptedData,
                            createdAt: new Date().toISOString()
                        });
                        return true;
                    }
                } catch (e) {
                    console.error('Cloud submit failed, falling back to local:', e);
                    alert(`【日報のクラウド送信に失敗しました】\n理由: ${e.message}\n\n※この日報データは消えずに、携帯内に一時保存(ローカル保存)されます。`);
                }
            }
            window.ReportDB.add(rep);
            return false;
        });
        
        Promise.all(submitPromises).then((results) => {
            const cloudCount = results.filter(r => r).length;
            const localCount = results.filter(r => !r).length;
            
            // 送信した各日報の現場名を本日送信済みリストに記録
            reportsToSubmit.forEach(rep => {
                const site = window.SiteDB.getById(rep.siteId);
                const sName = site ? site.name : '不明な現場';
                addSentReport(sName);
            });

            let msg = '';
            if (cloudCount > 0) {
                msg += `${cloudCount}件の日報をクラウドへ送信しました！(暗号化済) `;
            }
            if (localCount > 0) {
                msg += `${localCount}件の日報をローカルに保存しました。`;
            }
            
            window.app.showToast(msg, 'success');
            
            // 予測リストを最新の状態に再構築
            renderDatalists();
            // 送信完了後はフォームをクリア（白紙リセット）
            renderBatchInputForm(container);
        });
    });
}

// 他のタブ(PC管理者画面など)での現場追加を検知して、リアルタイムでサジェスト候補を更新する
window.addEventListener('storage', (e) => {
    if (e.key === 'report_ledger_sites') {
        renderDatalists();
    }
});

// ドキュメント読み込み完了時のトリガー
document.addEventListener('DOMContentLoaded', initDailyReportApp);
