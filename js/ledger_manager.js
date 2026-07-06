
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

/**
 * 簡易ルーター
 */
function router() {
    try {
        const hash = window.location.hash || '#ledger';
        const container = document.getElementById('view-container');
        const pageTitle = document.getElementById('page-title');
        const sidebar = document.getElementById('sidebar');

        // モバイル表示時のサイドバーの自動非表示
        if (sidebar) {
            sidebar.classList.remove('open');
        }

        // アクティブなナビゲーション状態の更新
        document.querySelectorAll('.nav-item').forEach(item => {
            const view = item.getAttribute('data-view');
            if (hash.startsWith('#' + view)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (hash === '#dashboard') {
            window.location.hash = '#ledger';
            return;
        }

        if (hash.startsWith('#ledger/detail/')) {
            const siteId = hash.replace('#ledger/detail/', '');
            pageTitle.textContent = '現場詳細台帳 (集計業務)';
            renderLedgerDetail(container, siteId);
            return;
        }

        if (hash === '#ledger') {
            pageTitle.textContent = '現場台帳・集計一覧';
            renderLedgerList(container);
            return;
        }

        if (hash === '#site-list') {
            pageTitle.textContent = '現場一覧表';
            renderSiteListTable(container);
            return;
        }

        if (hash === '#purchase-list') {
            pageTitle.textContent = '仕入れ一覧';
            renderPurchaseListTable(container);
            return;
        }

        if (hash === '#partner-ledger') {
            pageTitle.textContent = '協力業者台帳';
            renderPartnerLedger(container);
            return;
        }
    } catch (e) {
        alert("🚨 ルーター実行中にエラーをキャッチしました！\n\nエラーメッセージ: " + e.message + "\n\nスタック情報:\n" + e.stack);
    }
}

function refreshDashboardChart() {}
function formatDateMD(dateStr) { return dateStr; }

// 仕入れ一覧表の描画
function renderPurchaseListTable(container) {
    container.innerHTML = `
        <div class="toolbar no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div class="search-filter-group" style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
                <div class="input-search-wrapper" style="position: relative; min-width: 250px; flex: 1;">
                    <i data-lucide="search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: var(--text-muted);"></i>
                    <input type="text" id="list-purchase-search" class="input-search" placeholder="商品名、仕入れ先、担当者、工事番号で検索..." style="padding-left: 2.2rem; width: 100%;">
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">期間:</span>
                    <input type="date" id="list-purchase-start-date" class="form-control" style="width: 135px; padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">〜</span>
                    <input type="date" id="list-purchase-end-date" class="form-control" style="width: 135px; padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary" id="btn-list-purchase-print">
                    <i data-lucide="printer"></i>
                    <span>印刷する</span>
                </button>
                <button class="btn btn-primary" id="btn-list-new-purchase">
                    <i data-lucide="plus"></i>
                    <span>新規仕入れ</span>
                </button>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-light);">
            <!-- 印刷時のヘッダー表示用 -->
            <div class="print-only" style="padding: 1.5rem 1rem 0.5rem 1rem; border-bottom: 2px solid #333; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.6rem; font-weight: bold; text-align: center; color: #000; letter-spacing: 0.1em; margin-bottom: 0.5rem;">仕 入 れ 一 覧 表</h2>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #333;">
                    <span id="print-date">出力日: 2026/06/30</span>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="data-table print-fit-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="width: 100px; text-align: left; padding: 0.75rem;">日付</th>
                            <th style="width: 100px; text-align: left; padding: 0.75rem;">工事番号</th>
                            <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                            <th style="width: 90px; text-align: left; padding: 0.75rem;">発注者</th>
                            <th style="width: 110px; text-align: left; padding: 0.75rem;">仕入れ先</th>
                            <th style="text-align: left; padding: 0.75rem;">仕入れ材料 (品名・型式)</th>
                            <th style="text-align: right; width: 70px; padding: 0.75rem;">数量</th>
                            <th style="text-align: right; width: 90px; padding: 0.75rem;">単価</th>
                            <th style="text-align: right; width: 110px; padding: 0.75rem; font-weight: 600;">合計金額</th>
                            <th style="text-align: right; width: 90px; padding: 0.75rem;">定価</th>
                            <th style="text-align: right; width: 60px; padding: 0.75rem;">掛率</th>
                            <th style="width: 80px; text-align: center; padding: 0.75rem;" class="no-print">操作</th>
                        </tr>
                    </thead>
                    <tbody id="purchase-list-table-body">
                        <!-- 動的にデータが挿入されます -->
                    </tbody>
                    <tfoot>
                        <tr style="background: var(--bg-card); font-weight: bold; border-top: 2px solid var(--border-light);">
                            <td colspan="8" style="text-align: right; padding: 0.75rem; color: var(--text-muted);">仕入れ金額 総合計:</td>
                            <td id="purchase-total-price" style="text-align: right; font-family: 'Inter', sans-serif; font-weight: 700; color: var(--color-primary); padding: 0.75rem; white-space: nowrap;">¥0</td>
                            <td colspan="3" class="no-print"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div id="purchase-list-more-container" class="no-print" style="text-align: center; padding: 1rem; border-top: 1px solid var(--border-light); display: none;">
                <!-- もっと見るボタンが動的に挿入されます -->
            </div>
        </div>
    `;

    const searchInput = document.getElementById('list-purchase-search');
    const startDateInput = document.getElementById('list-purchase-start-date');
    const endDateInput = document.getElementById('list-purchase-end-date');
    const newPurchaseBtn = document.getElementById('btn-list-new-purchase');
    const printBtn = document.getElementById('btn-list-purchase-print');
    window.currentPurchaseLimit = 150;
    
    // 印刷日の自動適用
    const printDateEl = document.getElementById('print-date');
    if (printDateEl) {
        const today = new Date();
        printDateEl.textContent = `出力日: ${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;
    }

    const updateTable = () => {
        window.currentPurchaseLimit = 150;
        const filter = {
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        };
        refreshPurchaseListTable(filter);
    };

    searchInput.addEventListener('input', updateTable);
    startDateInput.addEventListener('change', updateTable);
    endDateInput.addEventListener('change', updateTable);
    
    newPurchaseBtn.addEventListener('click', () => {
        openPurchaseModal(null, null, updateTable);
    });

    printBtn.addEventListener('click', () => {
        const oldLimit = window.currentPurchaseLimit;
        window.currentPurchaseLimit = Infinity;
        refreshPurchaseListTable({
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        });
        
        setTimeout(() => {
            window.print();
            
            window.currentPurchaseLimit = oldLimit;
            refreshPurchaseListTable({
                search: searchInput.value,
                startDate: startDateInput.value,
                endDate: endDateInput.value
            });
        }, 300);
    });

    updateTable();
    if (window.lucide) window.lucide.createIcons();
}

// 仕入れ一覧テーブルの更新処理
function refreshPurchaseListTable(filter) {
    const tbody = document.getElementById('purchase-list-table-body');
    const moreContainer = document.getElementById('purchase-list-more-container');
    if (!tbody) return;

    let purchases = window.PurchaseDB.getAll() || [];
    const sites = window.SiteDB.getAll() || [];
    
    // 現場データをIDでハッシュマップ化して高速検索 (O(1))
    const siteMap = new Map(sites.map(s => [s.id, s]));

    // フィルターの適用
    if (filter.startDate) {
        purchases = purchases.filter(p => p.date >= filter.startDate);
    }
    if (filter.endDate) {
        purchases = purchases.filter(p => p.date <= filter.endDate);
    }
    if (filter.search) {
        const query = filter.search.toLowerCase();
        purchases = purchases.filter(p => {
            const site = siteMap.get(p.siteId);
            const siteCode = site ? site.code.toLowerCase() : '';
            const siteName = site ? site.name.toLowerCase() : '';
            return (
                p.itemName.toLowerCase().includes(query) ||
                (p.supplier && p.supplier.toLowerCase().includes(query)) ||
                (p.orderedBy && p.orderedBy.toLowerCase().includes(query)) ||
                siteCode.includes(query) ||
                siteName.includes(query)
            );
        });
    }

    // 仕入れ合計金額の計算 (これは制限前の全件合計)
    let totalPurchaseSum = 0;
    purchases.forEach(pur => {
        const qty = pur.quantity || 0;
        const price = pur.unitPrice || 0;
        totalPurchaseSum += qty * price;
    });

    const totalPriceTd = document.getElementById('purchase-total-price');
    if (totalPriceTd) {
        totalPriceTd.textContent = `¥${Math.round(totalPurchaseSum).toLocaleString()}`;
    }

    if (purchases.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
                    仕入れデータが登録されていません。
                </td>
            </tr>
        `;
        if (moreContainer) moreContainer.style.display = 'none';
        return;
    }

    // 日付の降順でソート
    purchases.sort((a, b) => b.date.localeCompare(a.date));

    // 表示件数制限の適用
    const totalCount = purchases.length;
    const limit = window.currentPurchaseLimit || 150;
    const displayedPurchases = purchases.slice(0, limit);

    tbody.innerHTML = displayedPurchases.map(pur => {
        const site = siteMap.get(pur.siteId);
        const siteCode = site ? site.code : '-';
        const siteName = site ? site.name : '不明な現場';
        const formattedDate = pur.date ? pur.date.replace(/-/g, '/') : '-';
        const displayMultiplier = pur.multiplier ? (pur.multiplier * 100).toFixed(0) + '%' : '-';
        const total = pur.quantity * pur.unitPrice;

        return `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="font-family: 'Inter', sans-serif; font-size: 0.85rem; padding: 0.75rem;">${formattedDate}</td>
                <td style="font-family: 'Inter', sans-serif; font-weight: bold; padding: 0.75rem;">${siteCode}</td>
                <td style="font-size: 0.85rem; padding: 0.75rem;"><strong>${siteName}</strong></td>
                <td style="padding: 0.75rem;">${pur.orderedBy || '-'}</td>
                <td style="padding: 0.75rem;">${pur.supplier || '-'}</td>
                <td style="font-size: 0.85rem; padding: 0.75rem;">${pur.itemName}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right; padding: 0.75rem;">${pur.quantity || 0}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right; padding: 0.75rem;">¥${Math.round(pur.unitPrice).toLocaleString()}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right; padding: 0.75rem; font-weight: 600; color: var(--color-primary);">¥${Math.round(total).toLocaleString()}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right; padding: 0.75rem;">${pur.listPrice ? '¥' + Math.round(pur.listPrice).toLocaleString() : '-'}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right; padding: 0.75rem;">${displayMultiplier}</td>
                <td class="no-print" style="text-align: center; padding: 0.75rem;">
                    <div style="display: flex; gap: 0.35rem; justify-content: center;">
                        <button class="btn btn-secondary btn-icon-only btn-pur-edit" data-id="${pur.id}" data-site-id="${pur.siteId}" title="編集" style="width: 1.8rem; height: 1.8rem; padding:0; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="edit-3" style="width: 0.85rem; height: 0.85rem;"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only btn-pur-delete" data-id="${pur.id}" data-item="${pur.itemName}" title="削除" style="width: 1.8rem; height: 1.8rem; padding:0; display: inline-flex; align-items: center; justify-content: center;">
                            <i data-lucide="trash-2" style="width: 0.85rem; height: 0.85rem;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 「もっと見る」ボタンの表示制御
    if (moreContainer) {
        if (totalCount > limit) {
            const remain = totalCount - limit;
            moreContainer.innerHTML = `
                <button class="btn btn-secondary" id="btn-purchase-load-more" style="padding: 0.5rem 2rem; font-size: 0.85rem; border-radius: 8px;">
                    さらに ${Math.min(remain, 150)} 件を表示する (残り ${remain} 件 / 全 ${totalCount} 件)
                </button>
            `;
            moreContainer.style.display = 'block';

            document.getElementById('btn-purchase-load-more').addEventListener('click', () => {
                window.currentPurchaseLimit += 150;
                refreshPurchaseListTable(filter);
            });
        } else {
            moreContainer.style.display = 'none';
        }
    }

    // 編集ボタンのイベント紐付け
    tbody.querySelectorAll('.btn-pur-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const siteId = btn.getAttribute('data-site-id');
            openPurchaseModal(siteId, id, () => refreshPurchaseListTable(filter));
        });
    });

    // 削除ボタンのイベント紐付け
    tbody.querySelectorAll('.btn-pur-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const itemName = btn.getAttribute('data-item');
            if (confirm(`仕入れ明細「${itemName}」を削除してもよろしいですか？`)) {
                window.PurchaseDB.delete(id);
                window.app.showToast('仕入れデータを削除しました', 'success');
                refreshPurchaseListTable(filter);
            }
        });
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderSiteListTable(container) {
    container.innerHTML = `
        <div class="toolbar no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div class="search-filter-group" style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
                <div class="input-search-wrapper" style="position: relative; min-width: 250px; flex: 1;">
                    <i data-lucide="search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: var(--text-muted);"></i>
                    <input type="text" id="site-search" class="input-search" placeholder="現場名、工事番号、受注先、住所、担当者検索..." style="padding-left: 2.2rem; width: 100%;">
                </div>
                <div style="width: 150px;">
                    <select id="site-rollover-filter" class="form-control" style="padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                        <option value="all">すべての現場</option>
                        <option value="rollover">期またぎ現場のみ</option>
                    </select>
                </div>
                <div style="width: 150px;">
                    <select id="site-manager-filter" class="form-control" style="padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                        <option value="all">すべての自社担当(管理)</option>
                    </select>
                </div>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-secondary" id="btn-print-site-list">
                    <i data-lucide="printer"></i>
                    <span>一覧表の印刷</span>
                </button>
                <button class="btn btn-success" id="btn-import-site-excel">
                    <i data-lucide="upload-cloud"></i>
                    <span>Excel一括登録</span>
                </button>
                <button class="btn btn-primary" id="btn-new-site">
                    <i data-lucide="plus"></i>
                    <span>新規現場登録</span>
                </button>
            </div>
        </div>

        <!-- 画面表示用の事業部アコーディオンコンテナ -->
        <div id="site-departments-container" class="no-print" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
            <!-- ここに事業部ごとのアコーディオンが動的に生成されます -->
        </div>

        <!-- 印刷時のレイアウトを維持するための印刷用エリア -->
        <div class="print-only" id="site-list-print-area" style="width: 100%;">
            <!-- 印刷用テーブルが動的に挿入されます -->
        </div>
    `;

    const searchInput = document.getElementById('site-search');
    const rolloverFilter = document.getElementById('site-rollover-filter');
    const managerFilter = document.getElementById('site-manager-filter');
    const newSiteBtn = document.getElementById('btn-new-site');
    const importExcelBtn = document.getElementById('btn-import-site-excel');
    const printBtn = document.getElementById('btn-print-site-list');

    // 担当者のリストを動的に生成してドロップダウンへセット
    const allSites = window.SiteDB.getAll() || [];
    const uniqueManagers = [...new Set(allSites.map(s => s.manager).filter(m => m && m.trim().length > 0))];
    uniqueManagers.sort().forEach(mgr => {
        const opt = document.createElement('option');
        opt.value = mgr;
        opt.textContent = mgr;
        managerFilter.appendChild(opt);
    });

    window.currentSiteLimit = 100;

    const updateTable = () => {
        window.currentSiteLimit = 100; // 検索などのアクションのたびに制限をリセット
        const filter = {
            search: searchInput.value,
            rollover: rolloverFilter.value,
            manager: managerFilter.value
        };
        refreshSiteTable(filter);
    };

    searchInput.addEventListener('input', updateTable);
    rolloverFilter.addEventListener('change', updateTable);
    managerFilter.addEventListener('change', updateTable);
    newSiteBtn.addEventListener('click', () => openSiteModal(null, updateTable));
    importExcelBtn.addEventListener('click', () => openExcelImportModal(updateTable));
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            // 印刷用の一枚板テーブルを生成して流し込む (画面表示側のアコーディオンに影響を与えない)
            const printArea = document.getElementById('site-list-print-area');
            if (printArea) {
                printArea.innerHTML = generatePrintTableHtml();
            }
            
            setTimeout(() => {
                window.print();
                // 印刷終了後に印刷エリアをクリアしてメモリを解放
                if (printArea) printArea.innerHTML = '';
            }, 300);
        });
    }

    updateTable();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// 代表する請求データを取得する共通ヘルパー (未入金の最古の請求、すべて入金済みの場合は最後の請求)
function getDisplayBilling(site) {
    const billings = site.billings || [];
    if (billings.length === 0) {
        return {
            id: 'legacy',
            billedDate: site.billedDate || '',
            paidDate: site.paidDate || ''
        };
    }
    const unpaid = billings.find(b => !b.paidDate || b.paidDate.trim().length === 0);
    if (unpaid) return unpaid;
    return billings[billings.length - 1];
}

// 印刷用テーブルHTMLの動的生成 (画面の折りたたみに関わらず全現場を網羅した一枚板テーブルを出力)
function generatePrintTableHtml() {
    const searchInput = document.getElementById('site-search');
    const rolloverFilter = document.getElementById('site-rollover-filter');
    const managerFilter = document.getElementById('site-manager-filter');
    
    const filter = {
        search: searchInput ? searchInput.value : '',
        rollover: rolloverFilter ? rolloverFilter.value : 'all',
        manager: managerFilter ? managerFilter.value : 'all'
    };

    let sites = window.SiteDB.getAll() || [];
    
    // 10月期切り替え判定ヘルパー
    const getFiscalYear = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return m >= 10 ? y + 1 : y;
    };
    const targetFY = getFiscalYear(new Date()) || 2026;

    // 前期末アーカイブ判定 (出来高請求の全入金完了をチェック)
    sites = sites.filter(s => {
        const billings = s.billings || [];
        let maxBilledDate = null;
        let hasUnpaid = false;

        if (billings.length > 0) {
            hasUnpaid = billings.some(b => !b.paidDate || b.paidDate.trim().length === 0);
            const billedDates = billings.map(b => b.billedDate).filter(Boolean);
            if (billedDates.length > 0) {
                maxBilledDate = billedDates.sort().pop(); // 最も遅い請求日
            }
        } else {
            // 旧データ互換
            hasUnpaid = !s.paidDate || s.paidDate.trim().length === 0;
            maxBilledDate = s.billedDate || null;
            const hasBilled = s.billedDate && s.billedDate.trim().length > 0;
            const hasPaid = s.paidDate && s.paidDate.trim().length > 0;
            if (s.status === 'completed' && !hasBilled && !hasPaid) return false;
        }

        // 1. 現場の「請求した期」を特定する（最大請求日の期、無ければ現場作成日等）
        const billingFY = maxBilledDate ? getFiscalYear(maxBilledDate) : getFiscalYear(s.startDate || s.createdAt);

        // 2. 請求した期が今期以降である場合は、常に表示
        if (!billingFY || billingFY >= targetFY) return true;

        // 3. 請求した期が前期以前である場合：
        const isCompleted = s.status === 'completed';

        // 工事が完了していない、または未入金の請求が1件でもある場合は表示したままにする（期を跨いだ後に入金待ち状態）
        if (!isCompleted || hasUnpaid) return true;

        // すべての請求に対して入金が完了（入金日がすべて入力）されたら、日付がいつ（今期など）であっても画面から消す（アーカイブ）
        return false;
    });

    if (filter.search) {
        const query = filter.search.toLowerCase();
        sites = sites.filter(s => 
            s.name.toLowerCase().includes(query) ||
            s.code.toLowerCase().includes(query) ||
            (s.client && s.client.toLowerCase().includes(query)) ||
            (s.address && s.address.toLowerCase().includes(query)) ||
            (s.manager && s.manager.toLowerCase().includes(query))
        );
    }
    if (filter.rollover === 'rollover') {
        sites = sites.filter(s => {
            const siteFY = getFiscalYear(s.startDate || s.createdAt);
            return siteFY && siteFY < targetFY;
        });
    }
    if (filter.manager && filter.manager !== 'all') {
        sites = sites.filter(s => s.manager === filter.manager);
    }

    if (sites.length === 0) {
        return '<p style="text-align:center; padding:2rem; color:#000; font-weight:bold;">表示対象の現場がありません。</p>';
    }

    let html = `
        <div style="padding: 1.5rem 1rem 0.5rem 1rem; border-bottom: 2px solid #333; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.6rem; font-weight: bold; text-align: center; color: #000; letter-spacing: 0.1em; margin-bottom: 0.5rem;">現 爆 一 覧 表 (印刷用)</h2>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #333;">
                <span>出力日: ${new Date().toLocaleDateString('ja-JP')}</span>
                <span>該当件数: ${sites.length}件</span>
            </div>
        </div>
        <table class="data-table print-fit-table" style="width: 100%; border-collapse: collapse; border: 1px solid #333; color: #000;">
            <thead>
                <tr style="background: #e5e7eb; border-bottom: 2px solid #333; font-size: 0.8rem;">
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">工事番号</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">見積り番号</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">受注先 (顧客)</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">受注先担当者</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">現場名称</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: center; width: 50px;">状態</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 80px;">現調</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 85px;">自社担当(管理)</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 85px;">自社担当(施工)</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; font-size: 0.75rem;">現場住所</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 85px;">最新請求日</th>
                    <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 85px;">最新入金日</th>
                </tr>
            </thead>
            <tbody>
    `;

    html += sites.map(site => {
        const disp = getDisplayBilling(site);
        return `
        <tr style="border-bottom: 1px solid #333; font-size: 0.8rem;">
            <td style="border: 1px solid #333; padding: 0.4rem; font-family: monospace;">${site.code}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${site.estimateCode || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${site.client || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${site.clientManager || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;"><strong>${site.name}</strong></td>
            <td style="border: 1px solid #333; padding: 0.4rem; text-align: center;">${site.status !== 'completed' ? '継続' : '完了'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${site.survey || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${site.manager || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${site.managerConstruction || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem; font-size: 0.75rem;">${site.address || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${disp.billedDate || '-'}</td>
            <td style="border: 1px solid #333; padding: 0.4rem;">${disp.paidDate || '-'}</td>
        </tr>
        `;
    }).join('');

    html += `
            </tbody>
        </table>
    `;
    return html;
}

function refreshSiteTable(filter = {}) {
    const container = document.getElementById('site-departments-container');
    if (!container) return;

    // 10月期切り替え判定ヘルパー
    const getFiscalYear = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return m >= 10 ? y + 1 : y;
    };

    let sites = window.SiteDB.getAll() || [];
    const reports = window.ReportDB.getAll() || [];
    const reportSiteCodes = new Set(reports.map(r => r.siteCode).filter(Boolean));

    // 自動ステータス更新処理を廃止（localStorageへの過剰な書き込みを防止するため、表示時オンメモリ判定に統合）

    const currentFY = getFiscalYear(new Date());
    
    // 期またぎアーカイブ処理 of 適用 (出来高請求 of 全入金完了をチェック)
    sites = sites.filter(s => {
        const billings = s.billings || [];
        let maxBilledDate = null;
        let hasUnpaid = false;

        if (billings.length > 0) {
            hasUnpaid = billings.some(b => !b.paidDate || b.paidDate.trim().length === 0);
            const billedDates = billings.map(b => b.billedDate).filter(Boolean);
            if (billedDates.length > 0) {
                maxBilledDate = billedDates.sort().pop(); // 最も遅い請求日
            }
        } else {
            // 旧データ互換
            hasUnpaid = !s.paidDate || s.paidDate.trim().length === 0;
            maxBilledDate = s.billedDate || null;
            const hasBilled = s.billedDate && s.billedDate.trim().length > 0;
            const hasPaid = s.paidDate && s.paidDate.trim().length > 0;
            if (s.status === 'completed' && !hasBilled && !hasPaid) return false;
        }

        // 1. 現場の「請求した期」を特定する（最大請求日の期、無ければ現場作成日等）
        const billingFY = maxBilledDate ? getFiscalYear(maxBilledDate) : getFiscalYear(s.startDate || s.createdAt);

        // 2. 請求した期が今期以降である場合は、常に表示
        if (!billingFY || billingFY >= currentFY) return true;

        // 3. 請求した期が前期以前である場合：
        const isCompleted = s.status === 'completed';

        // 工事が完了していない、または未入金の請求が1件でもある場合は表示したままにする（期を跨いだ後に入金待ち状態）
        if (!isCompleted || hasUnpaid) return true;

        // すべての請求に対して入金が完了（入金日がすべて入力）されたら、日付がいつ（今期など）であっても画面から消す（アーカイブ）
        return false;
    });

    // 検索フィルタの適用
    if (filter.search) {
        const query = filter.search.toLowerCase();
        sites = sites.filter(s => 
            s.name.toLowerCase().includes(query) ||
            s.code.toLowerCase().includes(query) ||
            (s.client && s.client.toLowerCase().includes(query)) ||
            (s.address && s.address.toLowerCase().includes(query)) ||
            (s.manager && s.manager.toLowerCase().includes(query))
        );
    }

    // 期またぎフィルタの適用
    if (filter.rollover === 'rollover') {
        sites = sites.filter(s => {
            const siteFY = getFiscalYear(s.startDate || s.createdAt);
            return siteFY && siteFY < currentFY;
        });
    }

    // 自社担当者フィルタの適用
    if (filter.manager && filter.manager !== 'all') {
        sites = sites.filter(s => s.manager === filter.manager);
    }

    // 事業部への振り分けマップ作成
    const getDeptKey = (code) => {
        if (!code) return 'OTHER';
        const prefix = code.slice(0, 2).toUpperCase();
        if (['QK', 'QM', 'QT', 'QS', 'QY'].includes(prefix)) {
            return prefix;
        }
        return 'OTHER';
    };

    const DEPT_INFO = {
        'QK': { name: '仮設事業部', color: 'var(--color-primary)' },
        'QM': { name: '施設住宅事業部', color: 'var(--color-success)' },
        'QT': { name: '設備改修事業部', color: 'var(--color-warning)' },
        'QS': { name: '公共事業部', color: 'var(--color-info)' },
        'QY': { name: '本部', color: '#8b5cf6' },
        'OTHER': { name: 'その他・不明現場', color: '#6b7280' }
    };

    const deptGroups = {
        'QK': [], 'QM': [], 'QT': [], 'QS': [], 'QY': [], 'OTHER': []
    };

    // グルーピング
    sites.forEach(s => {
        const key = getDeptKey(s.code);
        deptGroups[key].push(s);
    });

    let html = '';
    
    // 事業部ごとにアコーディオンを作成
    Object.keys(DEPT_INFO).forEach(key => {
        const list = deptGroups[key];
        const info = DEPT_INFO[key];
        
        // 検索中で、該当する現場が1件もない事業部は非表示にする
        if (filter.search && list.length === 0) {
            return;
        }

        const count = list.length;
        // 検索中なら自動展開(open)、そうでなければ閉じた状態
        const isDefaultOpen = !!filter.search;
        const displayStyle = isDefaultOpen ? 'block' : 'none';
        const rotateStyle = isDefaultOpen ? 'transform: rotate(180deg);' : '';

        // 各事業部ごとの現在表示制限数
        if (!window.currentDeptLimits) {
            window.currentDeptLimits = {};
        }
        if (!window.currentDeptLimits[key]) {
            window.currentDeptLimits[key] = 100;
        }
        const limit = window.currentDeptLimits[key];
        const displayed = list.slice(0, limit);

        html += `
            <div class="dept-accordion" data-dept="${key}" style="border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; background: var(--bg-card); box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div class="dept-header" style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.015); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="display: inline-block; width: 4px; height: 1.35rem; background: ${info.color}; border-radius: 4px;"></span>
                        <strong style="font-size: 1rem; color: var(--text-main);">${info.name} (${key})</strong>
                        <span style="background: rgba(255,255,255,0.06); padding: 0.15rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-family: 'Inter'; color: var(--text-muted); font-weight: 600;">${count} 件</span>
                    </div>
                    <i data-lucide="chevron-down" class="accordion-icon" style="width: 1.2rem; height: 1.2rem; color: var(--text-muted); transition: transform 0.2s; ${rotateStyle}"></i>
                </div>
                <div class="dept-content" style="display: ${displayStyle}; border-top: 1px solid var(--border-light);">
                    <div class="table-responsive" style="margin: 0;">
                        <table class="data-table print-fit-table" style="width: 100%; border-collapse: collapse; margin: 0;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.005);">
                                    <th style="width: 100px; text-align: left; padding: 0.75rem;">工事番号</th>
                                    <th style="width: 100px; text-align: left; padding: 0.75rem;">見積り番号</th>
                                    <th style="text-align: left; padding: 0.75rem;">受注先 (顧客)</th>
                                    <th style="text-align: left; padding: 0.75rem;">受注先担当者</th>
                                    <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                                    <th style="width: 70px; text-align: center; padding: 0.75rem;">継続</th>
                                    <th style="width: 90px; text-align: left; padding: 0.75rem;">現調</th>
                                    <th style="width: 110px; text-align: left; padding: 0.75rem;">自社担当(管理)</th>
                                    <th style="width: 110px; text-align: left; padding: 0.75rem;">自社担当(施工)</th>
                                    <th style="font-size: 0.75rem; text-align: left; padding: 0.75rem;">現場住所</th>
                                    <th style="width: 130px; text-align: left; padding: 0.75rem;">最新請求日</th>
                                    <th style="width: 130px; text-align: left; padding: 0.75rem;">最新入金日</th>
                                    <th style="width: 80px; text-align: center; padding: 0.75rem;" class="no-print">操作</th>
                                </tr>
                            </thead>
                            <tbody class="site-list-table-body" id="site-list-tbody-${key}">
        `;

        if (displayed.length === 0) {
            html += `
                <tr>
                    <td colspan="13" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">
                        該当する現場がありません。
                    </td>
                </tr>
            `;
        } else {
            html += displayed.map(site => {
                const disp = getDisplayBilling(site);
                const billedDateVal = disp.billedDate || '';
                const paidDateVal = disp.paidDate || '';

                let isDelayed = false;
                const billings = site.billings || [];
                if (billings.length > 0) {
                    isDelayed = billings.some(b => {
                        if (b.billedDate && (!b.paidDate || b.paidDate.trim().length === 0)) {
                            const billedTime = new Date(b.billedDate).getTime();
                            const nowTime = new Date().getTime();
                            const diffDays = (nowTime - billedTime) / (1000 * 60 * 60 * 24);
                            return diffDays >= 60;
                        }
                        return false;
                    });
                } else if (billedDateVal && !paidDateVal) {
                    const billedTime = new Date(billedDateVal).getTime();
                    const nowTime = new Date().getTime();
                    const diffDays = (nowTime - billedTime) / (1000 * 60 * 60 * 24);
                    if (diffDays >= 60) {
                        isDelayed = true;
                    }
                }

                return `
                    <tr style="border-bottom: 1px solid var(--border-light);">
                        <td style="font-family: 'Inter'; font-weight: 600; padding: 0.75rem;">
                            <a href="#ledger/detail/${site.id}">${site.code}</a>
                        </td>
                        <td style="padding: 0.75rem;">${site.estimateCode || '-'}</td>
                        <td style="padding: 0.75rem;">${site.client || '-'}</td>
                        <td style="padding: 0.75rem;">${site.clientManager || '-'}</td>
                        <td style="padding: 0.75rem;"><strong>${site.name}</strong></td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <input type="checkbox" class="site-continue-checkbox" data-site-id="${site.id}" ${(site.status !== 'completed' || reportSiteCodes.has(site.code)) ? 'checked' : ''} style="width: 1.1rem; height: 1.1rem; cursor: pointer;">
                        </td>
                        <td style="padding: 0.75rem;">${site.survey || '-'}</td>
                        <td style="padding: 0.75rem;">${site.manager || '-'}</td>
                        <td style="padding: 0.75rem;">${site.managerConstruction || '-'}</td>
                        <td style="font-size: 0.75rem; padding: 0.75rem;">${site.address || '-'}</td>
                        <td style="padding: 0.75rem;">
                            <input type="date" class="form-control site-date-input" data-site-id="${site.id}" data-billing-id="${disp.id || ''}" data-field="billedDate" value="${billedDateVal}" style="padding: 0.25rem; font-size: 0.8rem; width: 120px;">
                        </td>
                        <td style="padding: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; border-bottom: none; min-height: 46px;">
                            ${isDelayed ? `<span style="display: inline-block; width: 8px; height: 8px; background-color: var(--color-danger); border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 6px var(--color-danger);" title="請求日から60日以上経過(未入金)"></span>` : ''}
                            <input type="date" class="form-control site-date-input" data-site-id="${site.id}" data-billing-id="${disp.id || ''}" data-field="paidDate" value="${paidDateVal}" style="padding: 0.25rem; font-size: 0.8rem; width: 120px;">
                        </td>
                        <td class="no-print" style="text-align: center; padding: 0.75rem;">
                            <button class="btn btn-primary btn-edit-site" data-id="${site.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                編集
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        html += `
                            </tbody>
                        </table>
                    </div>
        `;

        if (count > limit) {
            const remain = count - limit;
            html += `
                <div style="text-align: center; padding: 1rem; border-top: 1px solid var(--border-light);">
                    <button class="btn btn-secondary btn-dept-load-more" data-dept="${key}" style="padding: 0.4rem 1.5rem; font-size: 0.8rem; border-radius: 8px;">
                        さらに ${Math.min(remain, 100)} 件を表示する (残り ${remain} 件 / 全 ${count} 件)
                    </button>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    });

    if (html === '') {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
                該当する現場が見つかりませんでした。
            </div>
        `;
        return;
    }

    container.innerHTML = html;

    // アコーディオンの開閉制御
    container.querySelectorAll('.dept-header').forEach(header => {
        header.addEventListener('click', () => {
            const parent = header.closest('.dept-accordion');
            const content = parent.querySelector('.dept-content');
            const icon = header.querySelector('.accordion-icon');
            const isVisible = content.style.display === 'block';

            if (isVisible) {
                content.style.display = 'none';
                icon.style.transform = '';
            } else {
                content.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // 「もっと見る」ボタンのクリック制御
    container.querySelectorAll('.btn-dept-load-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // アコーディオンの開閉を防ぐ
            const key = btn.getAttribute('data-dept');
            window.currentDeptLimits[key] += 100;
            refreshSiteTable(filter);
        });
    });

    // 日付入力の変更イベント紐付け (自動保存)
    container.querySelectorAll('.site-date-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const siteId = e.target.getAttribute('data-site-id');
            const billingId = e.target.getAttribute('data-billing-id');
            const field = e.target.getAttribute('data-field');
            const value = e.target.value;

            const site = window.SiteDB.getById(siteId);
            if (site) {
                if (!site.billings) site.billings = [];

                let targetBilling = site.billings.find(b => b.id === billingId);
                if (!targetBilling && billingId === 'legacy') {
                    // 旧データの移行
                    targetBilling = {
                        id: 'bill_' + Date.now(),
                        billedDate: site.billedDate || '',
                        paidDate: site.paidDate || ''
                    };
                    site.billings.push(targetBilling);
                } else if (!targetBilling && site.billings.length === 0) {
                    targetBilling = {
                        id: 'bill_' + Date.now(),
                        billedDate: '',
                        paidDate: ''
                    };
                    site.billings.push(targetBilling);
                } else if (!targetBilling) {
                    targetBilling = site.billings[site.billings.length - 1];
                }

                if (targetBilling) {
                    targetBilling[field] = value;
                    
                    // 互換性維持のため、直轄の billedDate, paidDate にも最新（未入金最古、または最後）のデータを反映
                    const latest = getDisplayBilling(site);
                    site.billedDate = latest.billedDate || '';
                    site.paidDate = latest.paidDate || '';

                    window.SiteDB.update(siteId, site);
                    window.app.showToast('日付を保存しました', 'success');

                    if (window.CloudSync && window.CloudSync.isEnabled()) {
                        syncSitesToCloud();
                    }
                    
                    // ステータスや警告ランプ表示を最新化するため再描画
                    refreshSiteTable(filter);
                }
            }
        });
    });

    // 工事継続チェックボックスの変更イベント紐付け (自動保存 & 画面の再描画)
    container.querySelectorAll('.site-continue-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const siteId = e.target.getAttribute('data-site-id');
            const isChecked = e.target.checked;
            const site = window.SiteDB.getById(siteId);
            if (site) {
                site.status = isChecked ? 'active' : 'completed';
                window.SiteDB.update(siteId, site);
                window.app.showToast(`現場「${site.name}」を「${isChecked ? '継続中' : '完了'}」に更新しました。`, 'success');
                
                if (window.CloudSync && window.CloudSync.isEnabled()) {
                    syncSitesToCloud();
                }
                
                refreshSiteTable(filter);
            }
        });
    });

    // 現場編集イベントの紐付け (削除処理はモーダル内へ統合)
    container.querySelectorAll('.btn-edit-site').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            openSiteModal(id, () => refreshSiteTable(filter));
        });
    });
}

function renderLedgerList(container) {
    container.innerHTML = `
        <div class="toolbar no-print">
            <div class="search-filter-group" style="display: flex; align-items: center; flex-wrap: nowrap; gap: 0.5rem; flex: 1; min-width: 0;">
                <div class="input-search-wrapper" style="min-width: 180px; flex: 1; position: relative;">
                    <i data-lucide="search" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: var(--text-muted); pointer-events: none;"></i>
                    <input type="text" id="site-search" class="input-search" placeholder="現場名、工事番号、受注先、記入者で検索...">
                </div>
                <div style="width: 140px; flex-shrink: 0;">
                    <select id="ledger-department-filter">
                        <option value="all">すべての事業部</option>
                        <option value="QK">仮設事業部</option>
                        <option value="QM">施設住宅事業部</option>
                        <option value="QT">設備改修事業部</option>
                        <option value="QS">公共事業部</option>
                        <option value="QY">本部</option>
                    </select>
                </div>
                <div style="width: 140px; flex-shrink: 0;">
                    <select id="ledger-writer-filter">
                        <option value="all">すべての作業員</option>
                    </select>
                </div>
                <div style="width: 140px; flex-shrink: 0;">
                    <select id="ledger-month-filter">
                        <option value="all">すべての月</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="ledger-list-container"></div>
    `;

    const searchInput = document.getElementById('site-search');
    const departmentFilter = document.getElementById('ledger-department-filter');
    const writerFilter = document.getElementById('ledger-writer-filter');
    const monthFilter = document.getElementById('ledger-month-filter');

    // 日報日付から締め月 (11日〜翌月10日を翌月締めとする) を計算するヘルパー
    function getClosingMonth(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length < 3) return null;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        
        if (d >= 11) {
            let closingM = m + 1;
            let closingY = y;
            if (closingM > 12) {
                closingM = 1;
                closingY = y + 1;
            }
            return `${closingY}-${String(closingM).padStart(2, '0')}`;
        } else {
            return `${y}-${String(m).padStart(2, '0')}`;
        }
    }

    // 日報データベースから存在するユニークな作業員(記入者)と月を抽出してセット
    const allReports = window.ReportDB.getAll() || [];
    const uniqueWriters = [...new Set(allReports.map(r => r.writer).filter(Boolean))].sort();
    const uniqueMonths = [...new Set(allReports.map(r => getClosingMonth(r.date)).filter(Boolean))].sort().reverse();

    if (writerFilter) {
        writerFilter.innerHTML = '<option value="all">すべての作業員</option>' +
            uniqueWriters.map(w => `<option value="${w}">${w}</option>`).join('');
    }
    if (monthFilter) {
        monthFilter.innerHTML = '<option value="all">すべての締め月</option>' +
            uniqueMonths.map(m => {
                const [y, mm] = m.split('-');
                return `<option value="${m}">${y}年${parseInt(mm, 10)}月締め分</option>`;
            }).join('');
    }

    const updateTable = () => {
        window.ledgerDeptLimits = {}; // 制限をリセット
        const filter = {
            search: searchInput ? searchInput.value : '',
            department: departmentFilter ? departmentFilter.value : 'all',
            writer: writerFilter ? writerFilter.value : 'all',
            month: monthFilter ? monthFilter.value : 'all'
        };
        refreshLedgerTable(filter);
    };

    if (searchInput) searchInput.addEventListener('input', updateTable);
    if (departmentFilter) departmentFilter.addEventListener('change', updateTable);
    if (writerFilter) writerFilter.addEventListener('change', updateTable);
    if (monthFilter) monthFilter.addEventListener('change', updateTable);

    updateTable();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function refreshLedgerTable(filter = {}) {
    const container = document.getElementById('ledger-list-container');
    if (!container) return;

    let reports = window.ReportDB.getAll() || [];
    const sites = window.SiteDB.getAll() || [];

    // 現場データをIDでハッシュマップ化して高速検索 (O(1))
    const siteMap = new Map(sites.map(s => [s.id, s]));

    // 検索フィルタの適用
    if (filter.search) {
        const query = filter.search.toLowerCase();
        reports = reports.filter(r => {
            const site = siteMap.get(r.siteId);
            const siteCode = site ? site.code.toLowerCase() : '';
            const siteName = site ? site.name.toLowerCase() : '';
            const clientName = site && site.client ? site.client.toLowerCase() : '';
            return (
                siteCode.includes(query) ||
                siteName.includes(query) ||
                clientName.includes(query) ||
                r.writer.toLowerCase().includes(query)
            );
        });
    }

    // 作業員 (記入者) フィルタの適用
    const isWorkerMode = filter.writer && filter.writer !== 'all';
    if (isWorkerMode) {
        reports = reports.filter(r => r.writer === filter.writer);
    }

    // 締め月フィルタの適用 (11日〜翌月10日サイクル)
    if (filter.month && filter.month !== 'all') {
        const getClosingMonth = (dateStr) => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length < 3) return null;
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (d >= 11) {
                let closingM = m + 1;
                let closingY = y;
                if (closingM > 12) {
                    closingM = 1;
                    closingY = y + 1;
                }
                return `${closingY}-${String(closingM).padStart(2, '0')}`;
            } else {
                return `${y}-${String(m).padStart(2, '0')}`;
            }
        };
        reports = reports.filter(r => r.date && getClosingMonth(r.date) === filter.month);
    }

    // 時間計算用ヘルパー
    const calculateWorkTime = (startStr, endStr) => {
        if (!startStr || !endStr) return { start: '-', end: '-', breakTime: '-', total: '-' };
        const parseMin = (str) => {
            const [h, m] = str.split(':').map(Number);
            return h * 60 + m;
        };
        const startMin = parseMin(startStr);
        const endMin = parseMin(endStr);
        if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) {
            return { start: startStr, end: endStr, breakTime: '-', total: '-' };
        }
        const breakStart = 12 * 60; // 12:00
        const breakEnd = 13 * 60;   // 13:00
        const hasBreak = (startMin <= breakStart && endMin >= breakEnd);
        const breakMin = hasBreak ? 60 : 0;
        const totalMin = (endMin - startMin) - breakMin;
        const breakHours = hasBreak ? '1時間' : '0時間';
        const totalH = Math.floor(totalMin / 60);
        const totalM = totalMin % 60;
        const totalText = totalM > 0 ? `${totalH}時間${totalM}分` : `${totalH}時間`;
        return { start: startStr, end: endStr, breakTime: breakHours, total: totalText, min: totalMin };
    };

    // 共通の行HTMLジェネレーター
    const generateTableRow = (rep) => {
        const site = siteMap.get(rep.siteId);
        const siteCode = rep.siteCode || (site ? site.code : '-');
        const siteName = rep.siteName || (site ? site.name : '不明な現場');
        const clientName = rep.client || (site ? site.client : '-');

        const isOfficeWork = rep.isOfficeWork || siteCode === 'OFFICE' || !siteCode || siteCode === '-';
        const times = calculateWorkTime(rep.startTime, rep.endTime);
        const totalTimeText = isOfficeWork ? '-' : times.total;
        const formattedDate = rep.date ? rep.date.replace(/-/g, '/') : '-';

        let snippet = rep.workContent || '';
        if (snippet.length > 25) snippet = snippet.substring(0, 25) + '...';
        snippet = snippet.replace(/\n/g, ' ');

        let allWorkers = rep.writer || '';
        let workerSnippet = allWorkers;
        if (workerSnippet.length > 20) workerSnippet = workerSnippet.substring(0, 20) + '...';
        workerSnippet = workerSnippet.replace(/\n/g, ' ');

        const displaySiteName = rep.isOfficeWork ? `<span style="background:var(--color-warning); color:white; padding:0.1rem 0.35rem; border-radius:4px; font-size:0.7rem; margin-right:0.35rem; vertical-align:text-bottom;">事務仕事</span>${siteName}` : siteName;

        return `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="font-family: 'Inter', sans-serif; font-size: 0.85rem; padding: 0.75rem;">${formattedDate}</td>
                <td style="font-family: 'Inter', sans-serif; font-weight: 600; padding: 0.75rem;">
                    <a href="#ledger/detail/${rep.siteId}">${siteCode}</a>
                </td>
                <td style="padding: 0.75rem;"><strong>${displaySiteName}</strong></td>
                <td style="padding: 0.75rem;">${clientName}</td>
                <td style="font-size: 0.85rem; padding: 0.75rem; color: var(--text-muted);" title="${rep.workContent || ''}">${snippet}</td>
                <td style="font-size: 0.85rem; padding: 0.75rem; color: var(--text-muted);" title="${allWorkers}">${workerSnippet}</td>
                <td style="text-align: center; font-family: 'Inter', sans-serif; padding: 0.75rem;">${times.start}</td>
                <td style="text-align: center; font-family: 'Inter', sans-serif; padding: 0.75rem;">${times.end}</td>
                <td style="text-align: center; padding: 0.75rem; color: var(--text-muted);">${times.breakTime}</td>
                <td style="text-align: right; padding-right: 1.5rem; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--color-primary); padding: 0.75rem;">
                    ${totalTimeText}
                </td>
                <td style="text-align: center; padding: 0.75rem;" class="no-print">
                    <button class="btn btn-secondary btn-icon-only btn-view-report-detail" data-repid="${rep.id}" title="詳細表示" style="width: 1.8rem; height: 1.8rem; padding:0; display: inline-flex; align-items: center; justify-content: center;">
                        <i data-lucide="arrow-right" style="width: 0.85rem; height: 0.85rem;"></i>
                    </button>
                </td>
            </tr>
        `;
    };

    let html = '';
    let grandTotalMin = 0;

    if (isWorkerMode) {
        // ========== 作業員別フラット表示モード ==========
        reports.sort((a, b) => b.date.localeCompare(a.date)); // 日付降順

        let workerTotalMin = 0;
        let tableRows = '';

        if (reports.length === 0) {
            tableRows = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">該当する日報がありません。</td></tr>`;
        } else {
            reports.forEach(r => {
                const site = siteMap.get(r.siteId);
                const siteCode = r.siteCode || (site ? site.code : '');
                const isOfficeWork = r.isOfficeWork || siteCode === 'OFFICE' || !siteCode || siteCode === '-';
                if (!isOfficeWork) {
                    const times = calculateWorkTime(r.startTime, r.endTime);
                    if (times.min) workerTotalMin += times.min;
                }
                tableRows += generateTableRow(r);
            });
        }
        grandTotalMin = workerTotalMin;

        const wH = Math.floor(workerTotalMin / 60);
        const wM = workerTotalMin % 60;
        const wManpower = (workerTotalMin / 480).toFixed(2);
        const workerTimeText = `${wM > 0 ? `${wH}時間${wM}分` : `${wH}時間`} (${wManpower}人工)`;

        html += `
            <div id="worker-flat-view-container" style="background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--border-light);">
                <!-- 表示・印刷用ヘッダー -->
                <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); background: rgba(255,255,255,0.015);">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 2.5rem; height: 2.5rem; border-radius: 50%; background: rgba(59, 130, 246, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="user" style="width: 1.25rem; height: 1.25rem;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; font-size: 1.15rem; font-weight: bold; color: var(--text-main);">${filter.writer} さんの日報一覧</h2>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">全 ${reports.length} 件 / 作業時間: ${workerTimeText}</div>
                        </div>
                    </div>
                    <button class="btn btn-primary no-print" id="btn-print-worker-ledger" style="padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 8px;">
                        <i data-lucide="printer" style="width: 1rem; height: 1rem; margin-right: 0.25rem;"></i>
                        <span>一覧表を印刷・PDF保存</span>
                    </button>
                </div>

                <!-- 印刷時のみ表示される追加タイトル -->
                <div class="print-only" style="display: none; text-align: center; margin: 1rem 0;">
                    <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">作業員: ${filter.writer} 業務日報・現場台帳</h2>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">印刷日時: ${new Date().toLocaleString()}</p>
                </div>

                <div class="table-responsive" style="margin: 0;" id="worker-print-area">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 90px; text-align: left; padding: 0.75rem;">日付</th>
                                <th style="width: 100px; text-align: left; padding: 0.75rem;">工事番号</th>
                                <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                                <th style="text-align: left; padding: 0.75rem;">受注先 (元請/顧客)</th>
                                <th style="text-align: left; padding: 0.75rem;">作業内容</th>
                                <th style="text-align: left; padding: 0.75rem;">作業員</th>
                                <th style="width: 90px; text-align: center; padding: 0.75rem;">作業開始</th>
                                <th style="width: 90px; text-align: center; padding: 0.75rem;">作業完了</th>
                                <th style="width: 80px; text-align: center; padding: 0.75rem;">昼休憩</th>
                                <th style="width: 100px; text-align: right; padding: 0.75rem; padding-right: 1.5rem;">合計時間</th>
                                <th style="width: 70px; text-align: center; padding: 0.75rem;" class="no-print">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } else {
        // ========== 従来の事業部別アコーディオンモード ==========
        const departments = {
            'QK': { name: '仮設事業部 (QK)', color: 'var(--color-primary)' },
            'QM': { name: '施設住宅事業部 (QM)', color: 'var(--color-success)' },
            'QT': { name: '設備改修事業部 (QT)', color: 'var(--color-warning)' },
            'QS': { name: '公共事業部 (QS)', color: '#06b6d4' },
            'QY': { name: '本部 (QY)', color: '#a855f7' },
            'OTHER': { name: 'その他・不明現場 (OTHER)', color: '#6b7280' }
        };

        const groups = { QK: [], QM: [], QT: [], QS: [], QY: [], OTHER: [] };
        reports.forEach(r => {
            const site = siteMap.get(r.siteId);
            const siteCode = r.siteCode || (site ? site.code : '');
            if (siteCode) {
                const prefix = siteCode.substring(0, 2).toUpperCase();
                if (groups[prefix]) {
                    groups[prefix].push(r);
                } else {
                    groups['OTHER'].push(r);
                }
            } else {
                groups['OTHER'].push(r);
            }
        });

        Object.entries(departments).forEach(([key, info]) => {
            const list = groups[key] || [];
            if (filter.department && filter.department !== 'all' && filter.department !== key) {
                return;
            }

            const count = list.length;
            const isDefaultOpen = !!filter.search;
            const displayStyle = isDefaultOpen ? 'block' : 'none';
            const rotateStyle = isDefaultOpen ? 'transform: rotate(180deg);' : '';

            if (!window.ledgerDeptLimits) window.ledgerDeptLimits = {};
            if (!window.ledgerDeptLimits[key]) window.ledgerDeptLimits[key] = 100;
            const limit = window.ledgerDeptLimits[key];
            
            list.sort((a, b) => b.date.localeCompare(a.date));
            const displayed = list.slice(0, limit);

            let deptTotalMin = 0;
            list.forEach(r => {
                const site = siteMap.get(r.siteId);
                const siteCode = r.siteCode || (site ? site.code : '');
                const isOfficeWork = r.isOfficeWork || siteCode === 'OFFICE' || !siteCode || siteCode === '-';
                if (!isOfficeWork) {
                    const times = calculateWorkTime(r.startTime, r.endTime);
                    if (times.min) deptTotalMin += times.min;
                }
            });
            grandTotalMin += deptTotalMin;

            const deptH = Math.floor(deptTotalMin / 60);
            const deptM = deptTotalMin % 60;
            const deptManpower = (deptTotalMin / 480).toFixed(2);
            const deptTimeText = `${deptM > 0 ? `${deptH}時間${deptM}分` : `${deptH}時間`} (${deptManpower}人工)`;

            let tableRows = '';
            if (displayed.length === 0) {
                tableRows = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">該当する日報がありません。</td></tr>`;
            } else {
                tableRows = displayed.map(rep => generateTableRow(rep)).join('');
            }

            let loadMoreBtnHtml = '';
            if (count > limit) {
                const remain = count - limit;
                loadMoreBtnHtml = `
                    <div style="text-align: center; padding: 1rem; border-top: 1px solid var(--border-light);">
                        <button class="btn btn-secondary btn-ledger-load-more" data-dept="${key}" style="padding: 0.4rem 1.5rem; font-size: 0.8rem; border-radius: 8px;">
                            さらに ${Math.min(remain, 100)} 件を表示する (残り ${remain} 件 / 全 ${count} 件)
                        </button>
                    </div>
                `;
            }

            html += `
                <div class="dept-accordion" data-dept="${key}" style="border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; background: var(--bg-card); box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                    <div class="dept-header" style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.015); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="display: inline-block; width: 4px; height: 1.35rem; background: ${info.color}; border-radius: 4px;"></span>
                            <strong style="font-size: 1rem; color: var(--text-main);">${info.name}</strong>
                            <span style="background: rgba(255,255,255,0.06); padding: 0.15rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-family: 'Inter'; color: var(--text-muted); font-weight: 600;">${count} 件</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${deptTimeText}</span>
                        </div>
                        <i data-lucide="chevron-down" class="accordion-icon" style="width: 1.2rem; height: 1.2rem; color: var(--text-muted); transition: transform 0.2s; ${rotateStyle}"></i>
                    </div>
                    <div class="dept-content" style="display: ${displayStyle}; border-top: 1px solid var(--border-light);">
                        <div class="table-responsive" style="margin: 0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width: 90px; text-align: left; padding: 0.75rem;">日付</th>
                                        <th style="width: 100px; text-align: left; padding: 0.75rem;">工事番号</th>
                                        <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                                        <th style="text-align: left; padding: 0.75rem;">受注先 (元請/顧客)</th>
                                        <th style="text-align: left; padding: 0.75rem;">作業内容</th>
                                        <th style="text-align: left; padding: 0.75rem;">作業員</th>
                                        <th style="width: 90px; text-align: center; padding: 0.75rem;">作業開始</th>
                                        <th style="width: 90px; text-align: center; padding: 0.75rem;">作業完了</th>
                                        <th style="width: 80px; text-align: center; padding: 0.75rem;">昼休憩</th>
                                        <th style="width: 100px; text-align: right; padding: 0.75rem; padding-right: 1.5rem;">合計時間</th>
                                        <th style="width: 70px; text-align: center; padding: 0.75rem;" class="no-print">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                        ${loadMoreBtnHtml}
                    </div>
                </div>
            `;
        });
    }

    const sumH = Math.floor(grandTotalMin / 60);
    const sumM = grandTotalMin % 60;
    const manpower = (grandTotalMin / 480).toFixed(2);
    const sumText = `${sumM > 0 ? `${sumH}時間${sumM}分` : `${sumH}時間`} (${manpower}人工)`;

    html += `
        <div class="card no-print" style="padding: 1.25rem 1.5rem; display: flex; justify-content: flex-end; align-items: center; font-weight: bold; border: 1px solid var(--border-light); border-radius: 12px; margin-top: 1rem; background: var(--bg-card);">
            <div style="font-size: 1rem; color: var(--text-muted); margin-right: 1rem;">総作業時間合計 (※社内業務を除く):</div>
            <div style="font-family: 'Inter', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--color-primary);">${sumText}</div>
        </div>
    `;

    container.innerHTML = html;

    // イベント割り当て: 印刷ボタン (作業員モード時)
    const printBtn = document.getElementById('btn-print-worker-ledger');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const printContent = document.getElementById('worker-print-area').innerHTML;
            const originalContent = document.body.innerHTML;
            
            // 印刷用の一時的なDOM構築
            document.body.innerHTML = `
                <div style="padding: 1cm; background: white; color: black; font-family: sans-serif;">
                    <style>
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th, td { border: 1px solid #666; padding: 4px 6px; text-align: left; }
                        th { background-color: #eee; font-weight: bold; }
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        @page { size: A4 landscape; margin: 1cm; }
                        body { margin: 0; }
                    </style>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="font-size: 20px; margin: 0 0 10px 0;">作業員: ${filter.writer} 業務日報・現場台帳</h2>
                        <div style="text-align: right; font-size: 12px;">出力日時: ${new Date().toLocaleString()}</div>
                    </div>
                    ${printContent}
                </div>
            `;
            window.print();
            document.body.innerHTML = originalContent;
            location.reload(); // イベントリスナーを再構築するためリロード
        });
    }

    // アコーディオン開閉
    container.querySelectorAll('.dept-header').forEach(header => {
        header.addEventListener('click', () => {
            const parent = header.closest('.dept-accordion');
            const content = parent.querySelector('.dept-content');
            const icon = header.querySelector('.accordion-icon');
            const isVisible = content.style.display === 'block';
            if (isVisible) {
                content.style.display = 'none';
                icon.style.transform = '';
            } else {
                content.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // もっと見る
    container.querySelectorAll('.btn-ledger-load-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-dept');
            if (!window.ledgerDeptLimits) window.ledgerDeptLimits = {};
            window.ledgerDeptLimits[key] += 100;
            refreshLedgerTable(filter);
        });
    });

    // 詳細表示
    container.querySelectorAll('.btn-view-report-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const repId = btn.getAttribute('data-repid');
            if (window.openReportPreviewModal) {
                window.openReportPreviewModal(repId);
            }
        });
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ==========================================================================
// 3. 現場詳細（自動集計＆手入力仕入れ）の制御
// ==========================================================================

function renderLedgerDetail(container, siteId) {
    const site = window.SiteDB.getById(siteId);
    if (!site) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem 0;">
                <p style="color: var(--text-danger); font-weight: 500; margin-bottom: 1rem;">指定された現場情報が見つかりません。</p>
                <button class="btn btn-secondary" onclick="window.location.hash = '#ledger'">現場台帳一覧に戻る</button>
            </div>
        `;
        return;
    }

    const reports = window.ReportDB.getBySiteId(siteId);
    const purchases = window.PurchaseDB.getBySiteId(siteId);

    const countWorkers = (rep) => {
        let count = 1;
        if (rep.companions) {
            const list = rep.companions.split(/[、,，\s\+]+/);
            count += list.filter(name => name.trim().length > 0).length;
        }

    };

    const totalDays = reports.length;
    const totalManpower = reports.reduce((sum, r) => sum + countWorkers(r), 0);
    const totalPurchasesPrice = purchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    let statusBadge = '';
    if (site.status === 'active') {
        statusBadge = '<span class="badge badge-primary">進行中</span>';
    } else if (site.status === 'completed') {
        statusBadge = '<span class="badge badge-success">完了</span>';
    } else {
        statusBadge = '<span class="badge badge-warning">計画中</span>';
    }

    container.innerHTML = `
        <div style="margin-bottom: 1.5rem;" class="no-print">
            <button class="btn btn-secondary" id="btn-detail-back">
                <i data-lucide="arrow-left"></i>
                <span>現場台帳一覧に戻る</span>
            </button>
        </div>

        <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, var(--bg-card) 0%, rgba(59,130,246,0.05) 100%);">
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-family: 'Inter', sans-serif;">工事番号: ${site.code}</span>
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0.25rem 0 0.5rem 0;">${site.name}</h2>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">受注先: <strong>${site.client || '-'}</strong></p>
                </div>
                <div style="display:flex; gap: 1rem;">
                    ${statusBadge}
                    <button class="btn btn-secondary btn-icon-only" id="btn-detail-edit-top" title="現場情報の編集" style="margin-top: -3px;">
                        <i data-lucide="edit-3"></i>
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-top: 1.5rem; margin-bottom: 0;">
                <div class="card stat-card" style="background: rgba(255,255,255,0.02); padding: 1rem 1.25rem; border-radius: 12px; box-shadow:none;">
                    <div class="stat-info">
                        <h3>総稼働日数</h3>
                        <div class="stat-value" style="font-size: 1.4rem;">${totalDays} <span style="font-size: 0.85rem; font-weight:normal; color: var(--text-muted);">日</span></div>
                    </div>
                </div>
                <div class="card stat-card" style="background: rgba(255,255,255,0.02); padding: 1rem 1.25rem; border-radius: 12px; box-shadow:none;">
                    <div class="stat-info">
                        <h3>累計稼働人員</h3>
                        <div class="stat-value" style="font-size: 1.4rem;">${totalManpower} <span style="font-size: 0.85rem; font-weight:normal; color: var(--text-muted);">人工</span></div>
                    </div>
                </div>
                <div class="card stat-card" style="background: rgba(255,255,255,0.02); padding: 1rem 1.25rem; border-radius: 12px; box-shadow:none;">
                    <div class="stat-info">
                        <h3>材料仕入れ総額</h3>
                        <div class="stat-value" style="font-size: 1.4rem; color: var(--color-primary);">¥${totalPurchasesPrice.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;" class="no-print">
            <button class="btn btn-secondary active-tab-btn" id="tab-btn-reports" style="border-radius: 8px 8px 0 0; border: none; background: transparent; padding: 0.75rem 1.25rem; font-weight:600; color: var(--color-primary); border-bottom: 2px solid var(--color-primary);">
                作業日報まとめ (自動入力)
            </button>
            <button class="btn btn-secondary" id="tab-btn-purchases" style="border-radius: 8px 8px 0 0; border: none; background: transparent; padding: 0.75rem 1.25rem; font-weight:500; color: var(--text-muted);">
                材料仕入れ管理 (手入力)
            </button>
            <button class="btn btn-secondary" id="tab-btn-info" style="border-radius: 8px 8px 0 0; border: none; background: transparent; padding: 0.75rem 1.25rem; font-weight:500; color: var(--text-muted);">
                現場基本情報
            </button>
        </div>

        <div id="ledger-tab-content"></div>
    `;

    const switchTab = (tabName) => {
        const tabContent = document.getElementById('ledger-tab-content');
        const btnReports = document.getElementById('tab-btn-reports');

        [btnReports, btnPurchases, btnInfo].forEach(btn => {
            btn.style.color = 'var(--text-muted)';
            btn.style.borderBottom = 'none';
            btn.style.fontWeight = '500';
        });

        if (tabName === 'reports') {
            btnReports.style.color = 'var(--color-primary)';
            btnReports.style.borderBottom = '2px solid var(--color-primary)';
            btnReports.style.fontWeight = '600';
            renderReportsTab(tabContent, reports);
        } else if (tabName === 'purchases') {
            btnPurchases.style.color = 'var(--color-primary)';
            btnPurchases.style.borderBottom = '2px solid var(--color-primary)';
            btnPurchases.style.fontWeight = '600';
            renderPurchasesTab(tabContent, purchases, siteId);
        } else if (tabName === 'info') {
            btnInfo.style.color = 'var(--color-primary)';
            btnInfo.style.borderBottom = '2px solid var(--color-primary)';
            btnInfo.style.fontWeight = '600';
            renderInfoTab(tabContent, site);
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    document.getElementById('tab-btn-reports').addEventListener('click', () => switchTab('reports'));
    document.getElementById('tab-btn-purchases').addEventListener('click', () => switchTab('purchases'));
    document.getElementById('tab-btn-info').addEventListener('click', () => switchTab('info'));

    document.getElementById('btn-detail-back').addEventListener('click', () => {
        window.location.hash = '#ledger';
    });
    document.getElementById('btn-detail-edit-top').addEventListener('click', () => {
        openSiteModal(siteId, () => {
            renderLedgerDetail(container, siteId);
        });
    });

    switchTab('reports');
}

function renderReportsTab(container, reports) {
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 4rem 0;">
                <i data-lucide="file-question" style="width: 3rem; height: 3rem; margin-bottom: 1rem; stroke-width: 1; color: var(--text-muted);"></i>
                <p style="color: var(--text-muted);">提出された作業日報はありません。</p>
            </div>
        `;
        return;
    }

    const countWorkers = (rep) => {
        let count = 1;
        if (rep.companions) {
            const list = rep.companions.split(/[、,，\s\+]+/);
            count += list.filter(name => name.trim().length > 0).length;
        }
        return count;
    };

    container.innerHTML = `
        <div class="card" style="padding: 0; overflow: hidden;">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>日付</th>
                            <th>記入者</th>
                            <th>天気</th>
                            <th>時間（出発〜帰社）</th>
                            <th>現場作業時間</th>
                            <th>本日の作業内容</th>
                            <th>同行者</th>
                            <th>人工数</th>
                            <th style="width: 60px; text-align: center;">プレビュー</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reports.map(rep => {
                            const depText = rep.isDirectGo ? '直行' : (rep.departureTime || '-');
                            const retText = rep.isDirectBack ? '直帰' : (rep.returnTime || '-');
                            const timeRoute = `${depText} 〜 ${retText}`;

                            const workTime = `${rep.startTime || '-'} 〜 ${rep.endTime || '-'}`;
                            let snippet = rep.workContent || '';
                            if (snippet.length > 35) snippet = snippet.substring(0, 35) + '...';
                            snippet = snippet.replace(/\n/g, ' ');

                            return `
                                <tr>
                                    <td style="font-family: 'Inter', sans-serif; font-weight: 500;">${rep.date.replace(/-/g, '/')}</td>
                                    <td><strong>${rep.writer}</strong></td>
                                    <td>${rep.weather || '-'}</td>
                                    <td style="font-family: 'Inter', sans-serif; font-size: 0.85rem; color: var(--text-muted);">${timeRoute}</td>
                                    <td style="font-family: 'Inter', sans-serif; font-size: 0.85rem;">${workTime}</td>
                                    <td>${snippet}</td>
                                    <td style="font-size: 0.85rem; color: var(--text-muted);">${rep.companions || 'なし'}</td>
                                    <td style="font-family: 'Inter', sans-serif; font-weight: 600;">${countWorkers(rep)} 人工</td>
                                    <td style="text-align: center;">
                                        <button class="btn btn-secondary btn-icon-only btn-view-report-detail" data-repid="${rep.id}">
                                            <i data-lucide="arrow-right" style="width: 0.9rem; height: 0.9rem;"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelectorAll('.btn-view-report-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const repId = btn.getAttribute('data-repid');
            openReportPreviewModal(repId);
        });
    });
}

function renderPurchasesTab(container, purchases, siteId) {
    container.innerHTML = `
        <div class="toolbar" style="margin-bottom: 1rem;">
            <div style="font-size: 0.9rem; color: var(--text-muted);">
                材料の入荷、発注者、伝票等の履歴管理。伝票の有無もチェック可能です。
            </div>
            <button class="btn btn-success" id="btn-new-purchase">
                <i data-lucide="plus"></i>
                <span>仕入れ伝票の手入力</span>
            </button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">伝票</th>
                            <th>入荷月日</th>
                            <th>発注者</th>
                            <th>仕入れ先</th>
                            <th>仕入れ材料（メーカー／品名・型式）</th>
                            <th style="text-align: right; padding-right: 1rem;">数量</th>
                            <th>単位</th>
                            <th style="text-align: right; padding-right: 1rem;">仕入れ単価</th>
                            <th style="text-align: right; padding-right: 1.5rem;">合計金額</th>
                            <th style="text-align: right; padding-right: 1rem;">定価</th>
                            <th style="text-align: right; padding-right: 1.5rem;">掛け率</th>
                            <th style="width: 90px; text-align: center;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchases.length === 0
                            ? '<tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">仕入れデータはありません</td></tr>'
                            : purchases.map(pur => `
                                <tr>
                                    <td style="text-align: center;">
                                        <input type="checkbox" class="purchase-slip-check" data-id="${pur.id}" ${pur.slipChecked ? 'checked' : ''} style="width: 1.1rem; height: 1.1rem; cursor: pointer;">
                                    </td>
                                    <td style="font-family: 'Inter', sans-serif;">${pur.date.replace(/-/g, '/')}</td>
                                    <td>${pur.orderedBy || '-'}</td>
                                    <td>${pur.supplier || '-'}</td>
                                    <td>
                                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">${pur.maker || 'メーカー不明'}</span>
                                        <strong>${pur.itemName}</strong>
                                    </td>
                                    <td style="font-family: 'Inter', sans-serif; text-align: right; padding-right: 1rem;">${pur.quantity}</td>
                                    <td>${pur.unit}</td>
                                    <td style="font-family: 'Inter', sans-serif; text-align: right; padding-right: 1rem;">¥${pur.unitPrice.toLocaleString()}</td>
                                    <td style="font-family: 'Inter', sans-serif; text-align: right; padding-right: 1.5rem; font-weight: 600; color: var(--color-primary);">
                                        ¥${pur.totalPrice.toLocaleString()}
                                    </td>
                                    <td style="font-family: 'Inter', sans-serif; text-align: right; padding-right: 1rem; color: var(--text-muted);">
                                        ${pur.listPrice ? '¥' + pur.listPrice.toLocaleString() : '-'}
                                    </td>
                                    <td style="font-family: 'Inter', sans-serif; text-align: right; padding-right: 1.5rem; font-weight: 500;">
                                        ${pur.listPrice ? (pur.multiplier * 100).toFixed(0) + '%' : '-'}
                                    </td>
                                    <td>
                                        <div class="table-actions" style="justify-content: center;">
                                            <button class="btn btn-secondary btn-icon-only btn-edit-purchase" data-id="${pur.id}" title="編集" style="width: 1.8rem; height: 1.8rem; padding:0;">
                                                <i data-lucide="edit-3" style="width: 0.85rem; height: 0.85rem;"></i>
                                            </button>
                                            <button class="btn btn-danger btn-icon-only btn-delete-purchase" data-id="${pur.id}" title="削除" style="width: 1.8rem; height: 1.8rem; padding:0;">
                                                <i data-lucide="trash-2" style="width: 0.85rem; height: 0.85rem;"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelectorAll('.purchase-slip-check').forEach(chk => {
        chk.addEventListener('change', () => {
            const id = chk.getAttribute('data-id');
            const pur = window.PurchaseDB.getById(id);
            if (pur) {
                pur.slipChecked = chk.checked;
                window.PurchaseDB.update(id, pur);
                window.app.showToast('伝票チェックを更新しました', 'success');
            }
        });
    });

    document.getElementById('btn-new-purchase').addEventListener('click', () => {
        openPurchaseModal(siteId, null, () => {
            const updatedPurchases = window.PurchaseDB.getBySiteId(siteId);
            renderPurchasesTab(container, updatedPurchases, siteId);
            renderLedgerDetail(document.getElementById('view-container'), siteId);
            document.getElementById('tab-btn-purchases').click();
        });
    });

    container.querySelectorAll('.btn-edit-purchase').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openPurchaseModal(siteId, id, () => {
                const updatedPurchases = window.PurchaseDB.getBySiteId(siteId);
                renderPurchasesTab(container, updatedPurchases, siteId);
                renderLedgerDetail(document.getElementById('view-container'), siteId);
                document.getElementById('tab-btn-purchases').click();
            });
        });
    });

    container.querySelectorAll('.btn-delete-purchase').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (confirm('この仕入れデータを削除しますか？')) {
                window.PurchaseDB.delete(id);
                window.app.showToast('仕入れデータを削除しました', 'success');
                const updatedPurchases = window.PurchaseDB.getBySiteId(siteId);
                renderPurchasesTab(container, updatedPurchases, siteId);
                renderLedgerDetail(document.getElementById('view-container'), siteId);
                document.getElementById('tab-btn-purchases').click();
            }
        });
    });
}

function renderInfoTab(container, site) {
    container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <div class="card-title">
                <i data-lucide="info"></i>
                <span>基本情報明細</span>
            </div>
            <div class="info-list">
                <div class="info-item">
                    <span class="info-label">工事番号</span>
                    <span class="info-value" style="font-family:'Inter'; font-weight:bold;">${site.code || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">現場名称</span>
                    <span class="info-value">${site.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">受注先</span>
                    <span class="info-value">${site.client || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">受注先担当者</span>
                    <span class="info-value">${site.clientManager || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">見積り番号</span>
                    <span class="info-value" style="font-family:'Inter';">${site.estimateCode || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">請求状況</span>
                    <span class="info-value">
                        <span class="badge ${site.isBilled ? 'badge-success' : 'badge-warning'}">${site.isBilled ? '請求済' : '未請求'}</span>
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">入金状況</span>
                    <span class="info-value">
                        <span class="badge ${site.isPaid ? 'badge-success' : 'badge-warning'}">${site.isPaid ? '入金済' : '未入金'}</span>
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">工期</span>
                    <span class="info-value">${site.startDate ? site.startDate.replace(/-/g, '/') : ''} 〜 ${site.endDate ? site.endDate.replace(/-/g, '/') : ''}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">現場住所</span>
                    <span class="info-value">${site.address || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">担当者</span>
                    <span class="info-value">${site.manager || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">予算</span>
                    <span class="info-value" style="font-family:'Inter'; color:var(--color-primary); font-weight:600;">${site.budget ? '¥' + site.budget.toLocaleString() : '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">メモ</span>
                    <span class="info-value" style="white-space:pre-wrap; font-size:0.85rem; color:var(--text-muted);">${site.memo || 'なし'}</span>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// 4. モーダルダイアログ処理 (現場 & 仕入れ & 日報プレビュー)
// ==========================================================================

function openSiteModal(siteId = null, callback = null) {
    const isEdit = siteId !== null;
    const site = isEdit ? window.SiteDB.getById(siteId) : null;

    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = isEdit ? '現場情報の編集' : '新規現場登録';

    body.innerHTML = `
        <form id="site-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="form-site-code">工事番号 <span style="color: var(--color-danger);">*</span></label>
                    <input type="text" id="form-site-code" required value="${site ? site.code : '2026-' + String(Date.now()).slice(-3)}">
                </div>
                <div class="form-group">
                    <label for="form-site-status">ステータス</label>
                    <select id="form-site-status">
                        <option value="planning" ${site && site.status === 'planning' ? 'selected' : ''}>計画中</option>
                        <option value="active" ${site && site.status === 'active' ? 'selected' : ''}>進行中</option>
                        <option value="completed" ${!site || (site && site.status === 'completed') ? 'selected' : ''}>完了</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="form-site-name">現場名称 <span style="color: var(--color-danger);">*</span></label>
                <input type="text" id="form-site-name" required value="${site ? site.name : ''}">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="form-site-client">受注先 (顧客名 / 元請)</label>
                    <input type="text" id="form-site-client" value="${site ? site.client || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="form-site-client-manager">受注先担当者</label>
                    <input type="text" id="form-site-client-manager" value="${site ? site.clientManager || '' : ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="form-site-start">工期（開始）</label>
                    <input type="date" id="form-site-start" value="${site ? site.startDate || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="form-site-end">工期（終了）</label>
                    <input type="date" id="form-site-end" value="${site ? site.endDate || '' : ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="form-site-manager">担当者</label>
                    <input type="text" id="form-site-manager" value="${site ? site.manager || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="form-site-budget">予算額 (円)</label>
                    <input type="number" id="form-site-budget" value="${site ? site.budget || '' : ''}">
                </div>
            </div>

            <!-- 見積り番号、請求・入金確認 -->
            <div class="form-row" style="grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; align-items: end;">
                <div class="form-group">
                    <label for="form-site-estimate">見積り番号</label>
                    <input type="text" id="form-site-estimate" value="${site ? site.estimateCode || '' : ''}" placeholder="例: EST-26-001">
                </div>
                <div class="form-group" style="display: flex; align-items: center; height: 100%; padding-bottom: 0.6rem;">
                    <label style="display:inline-flex; align-items:center; gap:0.4rem; cursor:pointer; font-weight:600;">
                        <input type="checkbox" id="form-site-billed" style="width: 1.2rem; height: 1.2rem;" ${site && site.isBilled ? 'checked' : ''}>
                        <span>請求済</span>
                    </label>
                </div>
                <div class="form-group" style="display: flex; align-items: center; height: 100%; padding-bottom: 0.6rem;">
                    <label style="display:inline-flex; align-items:center; gap:0.4rem; cursor:pointer; font-weight:600;">
                        <input type="checkbox" id="form-site-paid" style="width: 1.2rem; height: 1.2rem;" ${site && site.isPaid ? 'checked' : ''}>
                        <span>入金済</span>
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label for="form-site-address">住所</label>
                <input type="text" id="form-site-address" value="${site ? site.address || '' : ''}">
            </div>

            <div class="form-group">
                <label for="form-site-memo">メモ</label>
                <textarea id="form-site-memo" rows="3">${site ? site.memo || '' : ''}</textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="btn-site-cancel">キャンセル</button>
                <button type="submit" class="btn btn-primary">保存する</button>
            </div>
        </form>
    `;

    backdrop.classList.add('open');
    const form = document.getElementById('site-form');

    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-site-cancel').addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const siteData = {
            code: document.getElementById('form-site-code').value.trim(),
            name: document.getElementById('form-site-name').value.trim(),
            client: document.getElementById('form-site-client').value.trim(),
            clientManager: document.getElementById('form-site-client-manager').value.trim(),
            startDate: document.getElementById('form-site-start').value,
            endDate: document.getElementById('form-site-end').value,
            manager: document.getElementById('form-site-manager').value.trim(),
            budget: parseInt(document.getElementById('form-site-budget').value) || 0,
            estimateCode: document.getElementById('form-site-estimate').value.trim(),
            isBilled: document.getElementById('form-site-billed').checked,
            isPaid: document.getElementById('form-site-paid').checked,
            address: document.getElementById('form-site-address').value.trim(),
            status: document.getElementById('form-site-status').value,
            memo: document.getElementById('form-site-memo').value.trim()
        };

        if (isEdit) {
            window.SiteDB.update(siteId, siteData);
            window.app.showToast('現場情報を更新しました', 'success');
        } else {
            window.SiteDB.add(siteData);
            window.app.showToast('新規現場を登録しました', 'success');
        }

        closeModal();
        if (callback) {
            callback();
        } else {
            const searchInput = document.getElementById('site-search');
            if (searchInput) {
                refreshSiteTable({
                    search: searchInput.value,
                    rollover: document.getElementById('site-rollover-filter').value,
                    manager: document.getElementById('site-manager-filter').value
                });
            }
        }
    });
}

function openPurchaseModal(siteId, purchaseId = null, callback = null) {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const isEdit = purchaseId !== null;
    title.textContent = isEdit ? '仕入れ材料の編集' : '新規仕入れ材料の手入力';

    const pur = isEdit ? window.PurchaseDB.getById(purchaseId) : null;

    body.innerHTML = `
        <form id="purchase-form">
            ${!isEdit ? `
            <div id="pdf-scan-dropzone" style="border: 2px dashed rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 1.25rem 1rem; text-align: center; margin-bottom: 1.25rem; background: rgba(59, 130, 246, 0.02); cursor: pointer; transition: all 0.2s; position: relative;">
                <div id="pdf-scan-status-container" style="display: flex; flex-direction: column; align-items: center; gap: 0.35rem; color: var(--text-muted);">
                    <i data-lucide="file-check-2" style="width: 2rem; height: 2rem; color: var(--color-primary);"></i>
                    <span id="pdf-scan-status-title" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">電子PDF伝票 (テキスト選択可能) からの自動入力</span>
                    <span id="pdf-scan-status-subtitle" style="font-size: 0.75rem; color: #f59e0b; font-weight: bold;">(※コピー可能なPDF専用 / スキャン画像や写真 of PDFは非対応)</span>
                </div>
                <input type="file" id="pdf-scan-input" accept="application/pdf" style="display: none;">
            </div>
            <details id="pdf-debug-details" style="display: none; margin-top: 0.5rem; text-align: left; background: rgba(0,0,0,0.15); padding: 0.5rem; border-radius: 6px; font-size: 0.75rem; border: 1px dashed rgba(255,255,255,0.15);">
                <summary style="cursor: pointer; color: var(--color-info); font-weight: 600;">🛠️ PDF解析がうまくいかない場合 (デバッグ用テキスト表示)</summary>
                <p style="color: var(--text-muted); margin: 0.35rem 0; font-size: 0.7rem;">下の枠内のテキストをコピーして、そのままチャットに貼り付けて送ってください。すぐに解析精度をアジャストします。</p>
                <textarea id="pdf-debug-raw-text" readonly style="width: 100%; height: 120px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); border-radius: 4px; padding: 0.35rem; color: var(--text-main); font-family: monospace; font-size: 0.7rem; resize: vertical;"></textarea>
            </details>
            ` : ''}

            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="form-pur-site">対象の工事番号・現場名</label>
                <select id="form-pur-site" disabled style="background: rgba(255,255,255,0.05); color: var(--text-muted);">
                    <!-- 現場DBから自動選択 -->
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="form-pur-date">入荷月日 <span style="color:var(--color-danger);">*</span></label>
                    <input type="date" id="form-pur-date" required value="${pur ? pur.date : ''}">
                </div>
                <div class="form-group">
                    <label for="form-pur-buyer">発注者 (自社手配者)</label>
                    <input type="text" id="form-pur-buyer" value="${pur ? (pur.orderedBy || '') : '所'}" placeholder="所">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="form-pur-supplier">仕入れ先名 <span style="color:var(--color-danger);">*</span></label>
                    <input type="text" id="form-pur-supplier" required value="${pur ? (pur.supplier || '') : ''}" placeholder="〇〇資材">
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">
                    <input type="checkbox" id="form-pur-slip" ${pur && pur.slipChecked ? 'checked' : ''} style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                    <label for="form-pur-slip" style="margin: 0; cursor: pointer;">伝票の有無 (有る場合チェック)</label>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="form-pur-item">仕入れ材料 (品名・型式) <span style="color:var(--color-danger);">*</span></label>
                    <input type="text" id="form-pur-item" required value="${pur ? pur.itemName : ''}" placeholder="塩ビパイプ VP20">
                </div>
                <div class="form-group">
                    <label for="form-pur-maker">メーカー名</label>
                    <input type="text" id="form-pur-maker" value="${pur ? (pur.maker || '') : ''}" placeholder="積水化学">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="form-pur-qty">数量 <span style="color:var(--color-danger);">*</span></label>
                    <input type="number" id="form-pur-qty" step="0.01" required min="0.01" placeholder="10" value="${pur ? pur.quantity : ''}">
                </div>
                <div class="form-group">
                    <label for="form-pur-unit">単位 <span style="color:var(--color-danger);">*</span></label>
                    <input type="text" id="form-pur-unit" required value="${pur ? pur.unit : '本'}" placeholder="本">
                </div>
                <div class="form-group">
                    <label for="form-pur-uprice">仕入れ単価 <span style="color:var(--color-danger);">*</span></label>
                    <input type="number" id="form-pur-uprice" required min="0" placeholder="150" value="${pur ? pur.unitPrice : ''}">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                    <label for="form-pur-lprice">定価 (単価・省略可)</label>
                    <input type="number" id="form-pur-lprice" min="0" placeholder="250" value="${pur && pur.listPrice ? pur.listPrice : ''}">
                </div>
                <div class="form-group">
                    <label for="form-pur-mult">掛け率 (%)</label>
                    <input type="number" id="form-pur-mult" step="0.01" min="0" max="10" placeholder="0.65" value="${pur ? pur.multiplier : ''}" style="background: rgba(255,255,255,0.02); color: var(--text-muted);" readonly>
                </div>
            </div>

            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); padding: 0.85rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="color: var(--text-muted);">合計仕入れ金額 (自動計算):</span>
                    <strong id="pur-live-total" style="font-size: 1.1rem; color: var(--color-primary); margin-left: 0.5rem; font-family:'Inter';">¥0</strong>
                </div>
                <div>
                    <span style="color: var(--text-muted);">算出掛け率:</span>
                    <strong id="pur-live-mult" style="color: var(--color-success); margin-left: 0.25rem;">-</strong>
                </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary" id="btn-pur-cancel">閉じる</button>
                <div style="display: flex; gap: 0.5rem;">
                    ${!isEdit ? '<button type="button" class="btn btn-info" id="btn-pur-save-continue" style="background:var(--color-info); color:white;">連続して登録</button>' : ''}
                    <button type="submit" class="btn btn-primary">${isEdit ? '変更を保存' : '登録して閉じる'}</button>
                </div>
            </div>
        </form>
    `;

    // ======= Datalist の構築 =======
    const sites = window.SiteDB.getAll() || [];
    const siteDatalist = document.getElementById('site-list-datalist');
    const siteInput = document.getElementById('form-pur-site-input');
    const siteHidden = document.getElementById('form-pur-site');

    // 現場のサジェストリスト作成
    siteDatalist.innerHTML = sites.map(s => `<option value="[${s.code}] ${s.name}" data-id="${s.id}"></option>`).join('');

    // 初期値のセット
    if (pur && pur.siteId) {
        const s = sites.find(x => x.id === pur.siteId);
        if (s) siteInput.value = `[${s.code}] ${s.name}`;
    } else if (siteId) {
        const s = sites.find(x => x.id === siteId);
        if (s) siteInput.value = `[${s.code}] ${s.name}`;
    }

    // 選択時に内部IDを隠しフィールドへ反映
    siteInput.addEventListener('input', () => {
        const val = siteInput.value;
        const matchedOpt = Array.from(siteDatalist.options).find(opt => opt.value === val);
        if (matchedOpt) {
            siteHidden.value = matchedOpt.getAttribute('data-id');
        } else {
            siteHidden.value = ''; // 完全一致しない場合は空
        }
    });

    // メーカーと単位の過去履歴サジェスト構築
    const allPurchases = window.PurchaseDB.getAll() || [];
    const uniqueMakers = new Set();
    const uniqueUnits = new Set(['本', '個', 'm', '式', '箱', '台']);
    
    allPurchases.forEach(p => {
        if (p.maker && p.maker.trim()) uniqueMakers.add(p.maker.trim());
        if (p.unit && p.unit.trim()) uniqueUnits.add(p.unit.trim());
    });

    document.getElementById('maker-datalist').innerHTML = Array.from(uniqueMakers).sort().map(m => `<option value="${m}">`).join('');
    document.getElementById('unit-datalist').innerHTML = Array.from(uniqueUnits).map(u => `<option value="${u}">`).join('');
    // ===================================


    backdrop.classList.add('open');
    if (window.lucide) window.lucide.createIcons();

    const form = document.getElementById('purchase-form');
    const qtyInput = document.getElementById('form-pur-qty');
    const uPriceInput = document.getElementById('form-pur-uprice');
    const lPriceInput = document.getElementById('form-pur-lprice');
    const multInput = document.getElementById('form-pur-mult');

    const liveTotal = document.getElementById('pur-live-total');
    const liveMult = document.getElementById('pur-live-mult');
    const slipCheck = document.getElementById('form-pur-slip');

    const calculateLive = () => {
        const qty = parseFloat(qtyInput.value) || 0;
        const uprice = parseFloat(uPriceInput.value) || 0;
        const lprice = parseFloat(lPriceInput.value) || 0;

        const total = qty * uprice;
        liveTotal.textContent = `¥${Math.round(total).toLocaleString()}`;

        if (lprice > 0) {
            const mult = uprice / lprice;
            multInput.value = mult.toFixed(2);
            liveMult.textContent = `${(mult * 100).toFixed(0)}%`;
        } else {
            multInput.value = '';
            liveMult.textContent = '-';
        }
    };

    qtyInput.addEventListener('input', calculateLive);
    uPriceInput.addEventListener('input', calculateLive);
    lPriceInput.addEventListener('input', calculateLive);

    calculateLive();

    // 電子PDF自動読み込み処理のバインド
    if (!isEdit) {
        const dropzone = document.getElementById('pdf-scan-dropzone');
        const fileInput = document.getElementById('pdf-scan-input');
        const statusContainer = document.getElementById('pdf-scan-status-container');

        // ドラッグ＆ドロップイベント
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-primary)';
            dropzone.style.background = 'rgba(59, 130, 246, 0.08)';
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            dropzone.style.background = 'rgba(59, 130, 246, 0.02)';
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            dropzone.style.background = 'rgba(59, 130, 246, 0.02)';
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                processPdfFile(files[0]);
            } else {
                window.app.showToast('PDFファイルのみ対応しています', 'error');
            }
        });

        // クリックでファイル選択
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                processPdfFile(fileInput.files[0]);
            }
        });

        // PDF解析のメイン処理 (OCR不使用・電子PDF専用)
        const processPdfFile = async (file) => {
            dropzone.style.pointerEvents = 'none';
            statusContainer.innerHTML = `
                <div class="spinner" style="border: 3px solid rgba(255,255,255,0.1); border-radius: 50%; border-top: 3px solid var(--color-primary); width: 1.5rem; height: 1.5rem; animation: spin 1s linear infinite; margin-bottom: 0.25rem;"></div>
                <span id="pdf-progress-text" style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary);">電子PDFを高速解析中...</span>
                <span style="font-size: 0.75rem;">(文字を直接抽出しています)</span>
            `;

            if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }

                // デバッグテキスト表示の更新
                const debugDetails = document.getElementById('pdf-debug-details');
                const debugTextarea = document.getElementById('pdf-debug-raw-text');
                if (debugDetails && debugTextarea) {
                    debugTextarea.value = fullText.trim();
                    debugDetails.style.display = 'block';
                }

                // ガード：もしテキスト文字数が極端に少ない場合は、スキャン画像PDFと判定して終了
                if (fullText.replace(/\s+/g, '').length < 15) {
                    window.app.showToast('このPDFは「スキャン画像（写真）」形式のようです。テキスト選択可能な「電子PDF」のみ自動入力に対応しています。', 'error');
                    throw new Error('Image-based PDF not supported');
                }

                const extracted = parsePurchaseText(fullText); // 複数資材の配列

                if (extracted.length === 0) {
                    window.app.showToast('PDFから資材データ（数量×単価＝金額の行）を検出できませんでした。', 'warning');
                    return;
                }

                const defaultSiteId = siteId; // モーダルを開いた元の現場ID
                const sites = window.SiteDB.getAll() || [];

                let tbodyHtml = '';
                extracted.forEach((item, index) => {
                    const siteOpts = sites.map(s => `
                        <option value="${s.id}" ${s.id === (item.siteId || defaultSiteId) ? 'selected' : ''}>
                            ${s.code} ${s.name}
                        </option>
                    `).join('');

                    tbodyHtml += `
                    <tr data-index="${index}">
                        <td style="padding: 0.25rem;"><select class="grid-site form-control" style="font-size: 0.75rem; padding: 0.2rem; width: 140px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;">${siteOpts}</select></td>
                        <td style="padding: 0.25rem;"><input type="date" class="grid-date form-control" value="${item.date}" style="font-size: 0.75rem; padding: 0.2rem; width: 105px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;"></td>
                        <td style="padding: 0.25rem;"><input type="text" class="grid-buyer form-control" value="${item.orderedBy}" style="font-size: 0.75rem; padding: 0.2rem; width: 45px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px; text-align:center;"></td>
                        <td style="padding: 0.25rem;"><input type="text" class="grid-supplier form-control" value="${item.supplier}" style="font-size: 0.75rem; padding: 0.2rem; width: 90px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;"></td>
                        <td style="padding: 0.25rem;"><input type="text" class="grid-maker form-control" value="${item.maker}" style="font-size: 0.75rem; padding: 0.2rem; width: 80px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;"></td>
                        <td style="padding: 0.25rem;"><input type="text" class="grid-item form-control" value="${item.itemName}" style="font-size: 0.75rem; padding: 0.2rem; width: 130px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;"></td>
                        <td style="padding: 0.25rem;"><input type="number" class="grid-qty form-control" value="${item.quantity}" style="font-size: 0.75rem; padding: 0.2rem; width: 45px; text-align: right; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;"></td>
                        <td style="padding: 0.25rem;"><input type="number" class="grid-uprice form-control" value="${item.unitPrice}" style="font-size: 0.75rem; padding: 0.2rem; width: 65px; text-align: right; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-light); border-radius:4px;"></td>
                        <td class="grid-total" style="font-size: 0.75rem; padding: 0.25rem; text-align: right; font-weight: bold; width: 75px; color:var(--color-primary);">
                            ¥${Math.round(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td style="padding: 0.25rem; text-align: center;"><button type="button" class="btn-delete-row" style="background:none; border:none; color:var(--color-danger); cursor:pointer;"><i data-lucide="trash-2" style="width: 1.1rem; height: 1.1rem;"></i></button></td>
                    </tr>
                    `;
                });

                body.innerHTML = `
                    <div style="background: rgba(59, 130, 246, 0.08); padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid rgba(59, 130, 246, 0.2); line-height: 1.4;">
                        <strong>📄 電子PDF一括抽出プレビュー:</strong> <span id="pdf-rows-count">${extracted.length}</span>件の資材を検出しました。<br>
                        内容を確認・修正したあと、下の一括登録ボタンを押してください。
                    </div>
                    <div class="table-responsive" style="max-height: 380px; overflow-y: auto; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 1.25rem; background: var(--bg-sidebar);">
                        <table class="data-table" style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--bg-sidebar); border-bottom: 1px solid var(--border-light);">
                                    <th style="padding: 0.5rem; text-align: left;">現場名</th>
                                    <th style="padding: 0.5rem; text-align: left;">日付</th>
                                    <th style="padding: 0.5rem; text-align: center; width: 45px;">発注者</th>
                                    <th style="padding: 0.5rem; text-align: left;">仕入れ先</th>
                                    <th style="padding: 0.5rem; text-align: left;">メーカー</th>
                                    <th style="padding: 0.5rem; text-align: left;">品番・品名</th>
                                    <th style="padding: 0.5rem; text-align: right; width: 45px;">数量</th>
                                    <th style="padding: 0.5rem; text-align: right; width: 65px;">単価</th>
                                    <th style="padding: 0.5rem; text-align: right; width: 75px;">合計</th>
                                    <th style="padding: 0.5rem; text-align: center; width: 40px;">削除</th>
                                </tr>
                            </thead>
                            <tbody id="pdf-grid-tbody">${tbodyHtml}</tbody>
                        </table>
                    </div>
                    <div class="modal-footer" style="padding-top: 0.75rem; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 0.75rem; background: transparent;">
                        <button type="button" class="btn btn-secondary" id="btn-pur-cancel">キャンセル</button>
                        <button type="button" class="btn btn-primary" id="btn-pur-bulk-save" style="font-weight:600; display: flex; align-items: center; gap: 0.25rem;">
                            <i data-lucide="check" style="width: 1.1rem; height: 1.1rem;"></i>
                            <span>${extracted.length}件の資材を一括登録</span>
                        </button>
                    </div>
                `;

                const tbody = document.getElementById('pdf-grid-tbody');
                
                // 行削除
                tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tr = e.target.closest('tr');
                        tr.remove();
                        updateBulkButtonCount();
                    });
                });

                // 金額のリアルタイム計算
                tbody.addEventListener('input', (e) => {
                    if (e.target.classList.contains('grid-qty') || e.target.classList.contains('grid-uprice')) {
                        const tr = e.target.closest('tr');
                        const qty = parseFloat(tr.querySelector('.grid-qty').value) || 0;
                        const uprice = parseFloat(tr.querySelector('.grid-uprice').value) || 0;
                        tr.querySelector('.grid-total').textContent = `¥${Math.round(qty * uprice).toLocaleString()}`;
                    }
                });

                const updateBulkButtonCount = () => {
                    const rowsCount = tbody.querySelectorAll('tr').length;
                    const countSpan = document.getElementById('pdf-rows-count');
                    if (countSpan) countSpan.textContent = rowsCount;

                    const saveBtn = document.getElementById('btn-pur-bulk-save');
                    if (saveBtn) {
                        saveBtn.querySelector('span').textContent = `${rowsCount}件の資材を一括登録`;
                        saveBtn.disabled = rowsCount === 0;
                    }
                };

                // キャンセル
                document.getElementById('btn-pur-cancel').addEventListener('click', () => {
                    backdrop.classList.remove('open');
                });

                // 一括保存
                document.getElementById('btn-pur-bulk-save').addEventListener('click', async () => {
                    const rows = tbody.querySelectorAll('tr');
                    let count = 0;
                    for (const row of rows) {
                        const siteId = row.querySelector('.grid-site').value;
                        const date = row.querySelector('.grid-date').value;
                        const buyer = row.querySelector('.grid-buyer').value.trim();
                        const supplier = row.querySelector('.grid-supplier').value.trim();
                        const maker = row.querySelector('.grid-maker').value.trim();
                        const item = row.querySelector('.grid-item').value.trim();
                        const qty = parseFloat(row.querySelector('.grid-qty').value) || 0;
                        const uprice = parseFloat(row.querySelector('.grid-uprice').value) || 0;

                        if (!siteId || !date || !item || qty <= 0 || uprice <= 0) {
                            continue;
                        }

                        const purchaseData = {
                            siteId,
                            date,
                            orderedBy: buyer,
                            slipChecked: true,
                            maker,
                            itemName: item,
                            quantity: qty,
                            unit: '本',
                            unitPrice: uprice,
                            listPrice: 0
                        };

                        await window.PurchaseDB.save(purchaseData);
                        count++;
                    }

                    backdrop.classList.remove('open');
                    window.app.showToast(`${count}件の資材を一括登録しました！`, 'success');
                    if (callback) callback();
                });

            } catch (err) {
                console.error(err);
                if (err.message !== 'Image-based PDF not supported') {
                    window.app.showToast('PDF解析中にエラーが発生しました: ' + err.message, 'error');
                }
            } finally {
                dropzone.style.pointerEvents = 'auto';
                statusContainer.innerHTML = `
                    <i data-lucide="check-circle-2" style="width: 2rem; height: 2rem; color: var(--color-success);"></i>
                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-success);">スキャンが完了しました！</span>
                    <span style="font-size: 0.75rem;">(別の電子PDFをドロップして再スキャンも可能です)</span>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        };
    }

    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-pur-cancel').addEventListener('click', closeModal);

    // データの保存処理本体
    const savePurchaseData = () => {
        const selectedSiteId = document.getElementById('form-pur-site').value;
        if (!selectedSiteId) {
            window.app.showToast('正しい対象現場をリストから選択してください', 'error');
            return false;
        }

        const purchaseData = {
            siteId: selectedSiteId,
            date: document.getElementById('form-pur-date').value,
            orderedBy: document.getElementById('form-pur-buyer').value.trim(),
            slipChecked: slipCheck.checked,
            maker: document.getElementById('form-pur-maker').value.trim(),
            itemName: document.getElementById('form-pur-item').value.trim(),
            quantity: parseFloat(qtyInput.value) || 0,
            unit: document.getElementById('form-pur-unit').value.trim(),
            unitPrice: parseFloat(uPriceInput.value) || 0,
            listPrice: parseFloat(lPriceInput.value) || 0
        };

        if (isEdit) {
            window.PurchaseDB.update(purchaseId, purchaseData);
            window.app.showToast('仕入れデータを更新しました', 'success');
        } else {
            window.PurchaseDB.add(purchaseData);
            window.app.showToast('仕入れデータを登録しました', 'success');
        }
        return true;
    };

    // 通常の登録（保存して閉じる）
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (savePurchaseData()) {
            closeModal();
            if (callback) callback();
        }
    });

    // 連続して登録
    const btnContinue = document.getElementById('btn-pur-save-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            // HTML5バリデーションを手動チェック
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            if (savePurchaseData()) {
                // 品名、数量、単価、定価だけクリアする（他は保持）
                document.getElementById('form-pur-item').value = '';
                document.getElementById('form-pur-qty').value = '';
                document.getElementById('form-pur-uprice').value = '';
                document.getElementById('form-pur-lprice').value = '';
                
                // 再計算を走らせて合計金額を0に戻す
                calculateLive();
                
                // 次のアイテムにフォーカス
                document.getElementById('form-pur-item').focus();
                
                // リスト更新（裏側）
                if (callback) callback();
            }
        });
    }
}

function openReportPreviewModal(reportId) {
    const report = window.ReportDB.getById(reportId);
    if (!report) return;

    const site = window.SiteDB.getById(report.siteId);
    const siteName = site ? site.name : (report.siteName || '不明な現場');
    const siteCode = site ? site.code : (report.siteCode || '-');
    const clientName = site ? site.client : (report.client || '-');

    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = '作業日報 プレビュー';

    body.innerHTML = `
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;" class="no-print">
            <button class="btn btn-primary" id="modal-btn-edit-report" style="background:var(--color-primary); color:white;">
                <i data-lucide="edit-3"></i>
                <span>この日報を修正</span>
            </button>
            <button class="btn btn-danger" id="modal-btn-delete-report" style="background:var(--color-danger); color:white;">
                <i data-lucide="trash-2"></i>
                <span>削除</span>
            </button>
            <button class="btn btn-success" id="modal-btn-print">
                <i data-lucide="printer"></i>
                <span>印刷する</span>
            </button>
        </div>
        <div class="report-preview-sheet" id="report-print-area">
            <div style="text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid var(--text-main); padding-bottom: 0.5rem;">
                <h2 style="font-size: 1.5rem; font-weight: bold; margin: 0;">作業日報 提出書</h2>
            </div>

            <table class="detail-table" style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
                <tr>
                    <th style="width: 120px; padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">日付</th>
                    <td style="padding: 0.5rem; border: 1px solid var(--border-light); font-family: 'Inter';">${report.date.replace(/-/g, '/')}</td>
                    <th style="width: 120px; padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">記入者</th>
                    <td style="padding: 0.5rem; border: 1px solid var(--border-light);"><strong>${report.writer}</strong></td>
                </tr>
                <tr>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">天気</th>
                    <td style="padding: 0.5rem; border: 1px solid var(--border-light);">${report.weather || '-'}</td>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">工事番号</th>
                    <td style="padding: 0.5rem; border: 1px solid var(--border-light); font-family: 'Inter';">${siteCode}</td>
                </tr>
                <tr>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">現場名称</th>
                    <td colspan="3" style="padding: 0.5rem; border: 1px solid var(--border-light);"><strong>${report.isOfficeWork ? '<span style="background:var(--color-warning); color:white; padding:0.1rem 0.35rem; border-radius:4px; font-size:0.75rem; margin-right:0.35rem; vertical-align:text-bottom;">事務仕事</span>' : ''}${siteName}</strong></td>
                </tr>
                <tr>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">受注先 (顧客)</th>
                    <td colspan="3" style="padding: 0.5rem; border: 1px solid var(--border-light);">${clientName}</td>
                </tr>
                <tr>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">勤務時間</th>
                    <td colspan="3" style="padding: 0.5rem; border: 1px solid var(--border-light); font-family: 'Inter';">
                        ${report.isDirectGo ? '直行' : (report.departureTime || '-')} 〜 ${report.isDirectBack ? '直帰' : (report.returnTime || '-')}
                        <span style="color: var(--text-muted); margin-left: 1rem;">(現場作業時間: ${report.startTime || '-'} 〜 ${report.endTime || '-'})</span>
                    </td>
                </tr>
                <tr>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">同行者</th>
                    <td colspan="3" style="padding: 0.5rem; border: 1px solid var(--border-light);">${report.companions || 'なし'}</td>
                </tr>
                <tr>
                    <th style="padding: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.02); text-align: left;">協力会社同行者</th>
                    <td colspan="3" style="padding: 0.5rem; border: 1px solid var(--border-light);">${report.partnerCompanions || 'なし'}</td>
                </tr>
            </table>

            <div class="card" style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.01);">
                <div style="font-weight: bold; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.25rem;">
                    📝 本日の作業内容
                </div>
                <div style="white-space: pre-wrap; line-height: 1.6; font-size: 0.95rem;">${report.workContent || '記入なし'}</div>
            </div>

            <div class="card" style="background: rgba(255,255,255,0.01); margin-bottom: 0;">
                <div style="font-weight: bold; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.25rem;">
                    📌 メモ・特記事項
                </div>
                <div style="white-space: pre-wrap; line-height: 1.6; font-size: 0.9rem; color: var(--text-muted);">${report.memo || '特になし'}</div>
            </div>
        </div>
    `;

    backdrop.classList.add('open');
    if (window.lucide) window.lucide.createIcons();

    // 削除処理
    document.getElementById('modal-btn-delete-report').addEventListener('click', () => {
        if (confirm('本当にこの日報データを削除しますか？\n（削除したデータは元に戻せません）')) {
            window.ReportDB.delete(reportId);
            window.app.showToast('日報データを削除しました。', 'success');
            backdrop.classList.remove('open');
            refreshLedgerTable();
        }
    });

    // 編集修正処理
    document.getElementById('modal-btn-edit-report').addEventListener('click', () => {
        openEditReportModal(reportId);
    });

    document.getElementById('modal-btn-print').addEventListener('click', () => {
        const printContent = document.getElementById('report-print-area').innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = `
            <div style="padding: 2cm; background: white; color: black; font-family: sans-serif;">
                ${printContent}
            </div>
        `;
        window.print();
        document.body.innerHTML = originalContent;
        location.reload();
    });
}

// 管理者用の日報修正・編集フォームモーダル描画
function openEditReportModal(reportId) {
    const report = window.ReportDB.getById(reportId);
    if (!report) return;

    const sites = window.SiteDB.getAll() || [];
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = '作業日報の修正・編集';

    // 現場の選択肢を工事番号順にソートして構築
    const sortedSites = [...sites].sort((a, b) => a.code.localeCompare(b.code));
    let siteOptions = sortedSites.map(s => `
        <option value="${s.id}" ${s.id === report.siteId ? 'selected' : ''}>[${s.code}] ${s.name}</option>
    `).join('');

    // マスタに紐づいていない場合は、現在保存されている名前を臨時オプションとして選択肢に追加
    const siteExists = sites.some(s => s.id === report.siteId);
    if (!siteExists && report.siteId) {
        const tempCode = report.siteCode || '-';
        const tempName = report.siteName || '不明な現場';
        siteOptions = `<option value="${report.siteId}" selected>[${tempCode}] ${tempName} (※マスタ未登録)</option>` + siteOptions;
    }

    body.innerHTML = `
        <form id="edit-report-form" style="padding: 0.5rem 0.25rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="edit-rep-date">作業日 <span style="color:var(--color-danger);">*</span></label>
                    <input type="date" id="edit-rep-date" required value="${report.date}">
                </div>
                <div class="form-group">
                    <label for="edit-rep-writer">作業員 (記入者) <span style="color:var(--color-danger);">*</span></label>
                    <input type="text" id="edit-rep-writer" required value="${report.writer || ''}">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                        <label for="edit-rep-site" style="margin-bottom:0;">現場名 (工事番号) <span style="color:var(--color-danger);">*</span></label>
                        <label style="display:inline-flex; align-items:center; gap:0.2rem; font-size:0.75rem; cursor:pointer; color:var(--text-main); font-weight:normal; margin-bottom:0;">
                            <input type="checkbox" id="edit-rep-office" ${report.isOfficeWork ? 'checked' : ''} style="width:0.85rem; height:0.85rem;">
                            <span>事務仕事</span>
                        </label>
                    </div>
                    <select id="edit-rep-site" required style="width: 100%; padding: 0.5rem; border-radius: 6px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-light); font-size: 0.9rem;">
                        ${siteOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-rep-weather">天気</label>
                    <input type="text" id="edit-rep-weather" value="${report.weather || '晴れ'}">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; background: rgba(59,130,246,0.03); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(59,130,246,0.08);">
                <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.25rem;">
                        <label for="edit-rep-dep" style="margin-bottom:0;">出発時間</label>
                        <label style="display:inline-flex; align-items:center; gap:0.2rem; font-size:0.75rem; cursor:pointer; color:var(--color-warning); font-weight:bold; margin-bottom:0;">
                            <input type="checkbox" id="edit-rep-go" ${report.isDirectGo ? 'checked' : ''} style="width:0.85rem; height:0.85rem;">
                            <span>直行</span>
                        </label>
                    </div>
                    <input type="time" id="edit-rep-dep" value="${report.departureTime || ''}" ${report.isDirectGo ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label for="edit-rep-start">現場作業開始 <span style="color:var(--color-danger);">*</span></label>
                    <input type="time" id="edit-rep-start" required value="${report.startTime || '08:00'}">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; background: rgba(16,185,129,0.03); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(16,185,129,0.08);">
                <div class="form-group">
                    <label for="edit-rep-end">現場作業終了 <span style="color:var(--color-danger);">*</span></label>
                    <input type="time" id="edit-rep-end" required value="${report.endTime || '17:00'}">
                </div>
                <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.25rem;">
                        <label for="edit-rep-ret" style="margin-bottom:0;">帰社時間</label>
                        <label style="display:inline-flex; align-items:center; gap:0.2rem; font-size:0.75rem; cursor:pointer; color:var(--color-warning); font-weight:bold; margin-bottom:0;">
                            <input type="checkbox" id="edit-rep-back" ${report.isDirectBack ? 'checked' : ''} style="width:0.85rem; height:0.85rem;">
                            <span>直帰</span>
                        </label>
                    </div>
                    <input type="time" id="edit-rep-ret" value="${report.returnTime || ''}" ${report.isDirectBack ? 'disabled' : ''}>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="edit-rep-companions">同行者 (一般)</label>
                <input type="text" id="edit-rep-companions" value="${report.companions || ''}" placeholder="例: 山田 太郎, 鈴木 次郎">
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="edit-rep-partner-companions">協力会社同行者</label>
                <input type="text" id="edit-rep-partner-companions" value="${report.partnerCompanions || ''}" placeholder="例: 〇〇設備, △△工業">
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="edit-rep-content">作業内容 <span style="color:var(--color-danger);">*</span></label>
                <textarea id="edit-rep-content" required rows="4" style="font-family: var(--font-sans);">${report.workContent || ''}</textarea>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="edit-rep-memo">特記事項・メモ</label>
                <textarea id="edit-rep-memo" rows="2" style="font-family: var(--font-sans);">${report.memo || ''}</textarea>
            </div>

            <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 1rem;">
                <button type="button" class="btn btn-secondary" id="btn-edit-rep-cancel">キャンセル</button>
                <button type="submit" class="btn btn-success" style="background:var(--color-success); color:white;">変更を保存</button>
            </div>
        </form>
    `;

    // 直行直帰チェックのイベント連動
    const chkGo = document.getElementById('edit-rep-go');
    const timeDep = document.getElementById('edit-rep-dep');
    const chkBack = document.getElementById('edit-rep-back');
    const timeRet = document.getElementById('edit-rep-ret');

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

    // キャンセルボタン
    document.getElementById('btn-edit-rep-cancel').addEventListener('click', () => {
        openReportPreviewModal(reportId);
    });

    // フォーム送信（保存処理）
    document.getElementById('edit-report-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const updatedReport = {
            ...report,
            date: document.getElementById('edit-rep-date').value,
            writer: document.getElementById('edit-rep-writer').value.trim(),
            siteId: document.getElementById('edit-rep-site').value,
            weather: document.getElementById('edit-rep-weather').value.trim(),
            isOfficeWork: document.getElementById('edit-rep-office').checked,
            isDirectGo: chkGo.checked,
            departureTime: chkGo.checked ? '' : timeDep.value,
            startTime: document.getElementById('edit-rep-start').value,
            endTime: document.getElementById('edit-rep-end').value,
            isDirectBack: chkBack.checked,
            returnTime: chkBack.checked ? '' : timeRet.value,
            companions: document.getElementById('edit-rep-companions').value.trim(),
            partnerCompanions: document.getElementById('edit-rep-partner-companions').value.trim(),
            workContent: document.getElementById('edit-rep-content').value.trim(),
            memo: document.getElementById('edit-rep-memo').value.trim()
        };

        window.ReportDB.update(reportId, updatedReport);
        window.app.showToast('日報データを修正・保存しました。', 'success');
        backdrop.classList.remove('open');
        refreshLedgerTable();
    });
}

function openSiteModal(siteId = null, callback = null) {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const isEdit = siteId !== null;
    title.textContent = isEdit ? '現場情報の編集' : '新規現場の登録';

    const site = isEdit ? window.SiteDB.getById(siteId) : {
        code: '',
        name: '',
        client: '',
        clientManager: '',
        mainContractor: '',
        superintendent: '',
        superintendentPhone: '',
        estimateCode: '',
        survey: '',
        surveyDate: '',
        startDatePlanned: '',
        endDatePlanned: '',
        startDate: '',
        endDate: '',
        manager: '',
        managerConstruction: '',
        budget: 0,
        address: '',
        status: 'active',
        memo: '',
        billings: []
    };

    body.innerHTML = `
        <form id="site-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="site-code">工事番号 <span style="color:var(--color-danger);">*</span></label>
                    <input type="text" id="site-code" required value="${site.code}" placeholder="2026001" ${isEdit ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label for="site-name">現場名称 <span style="color:var(--color-danger);">*</span></label>
                    <input type="text" id="site-name" required value="${site.name}" placeholder="〇〇邸新築工事">
                </div>
            </div>

            <!-- 元請情報入力欄 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="site-main-contractor">元請会社名</label>
                    <input type="text" id="site-main-contractor" value="${site.mainContractor || ''}" placeholder="大林組など">
                </div>
                <div class="form-group">
                    <label for="site-superintendent">監督者</label>
                    <input type="text" id="site-superintendent" value="${site.superintendent || ''}" placeholder="山田">
                </div>
                <div class="form-group">
                    <label for="site-superintendent-phone">連絡先(携帯)</label>
                    <input type="text" id="site-superintendent-phone" value="${site.superintendentPhone || ''}" placeholder="090-XXXX-XXXX">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="site-client">受注先 (元請/顧客)</label>
                    <input type="text" id="site-client" value="${site.client || ''}" placeholder="〇〇建設">
                </div>
                <div class="form-group">
                    <label for="site-client-manager">受注先担当者</label>
                    <input type="text" id="site-client-manager" value="${site.clientManager || ''}" placeholder="鈴木様">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="site-estimate">見積り番号</label>
                    <input type="text" id="site-estimate" value="${site.estimateCode || ''}" placeholder="EST-2026-001">
                </div>
                <div class="form-group">
                    <label for="site-survey">現調</label>
                    <input type="text" id="site-survey" value="${site.survey || ''}" placeholder="有り/無し/個人名等">
                </div>
                <div class="form-group">
                    <label for="site-survey-date">現調日</label>
                    <input type="date" id="site-survey-date" value="${site.surveyDate || ''}">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="site-manager">自社担当(管理)</label>
                    <input type="text" id="site-manager" value="${site.manager || ''}" placeholder="所">
                </div>
                <div class="form-group">
                    <label for="site-manager-construction">自社担当(施工)</label>
                    <input type="text" id="site-manager-construction" value="${site.managerConstruction || ''}" placeholder="佐藤">
                </div>
            </div>

            <!-- 着工予定日・完了予定日入力欄 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label for="site-start-date-planned">着工予定日</label>
                    <input type="date" id="site-start-date-planned" value="${site.startDatePlanned || ''}">
                </div>
                <div class="form-group">
                    <label for="site-end-date-planned">完了予定日</label>
                    <input type="date" id="site-end-date-planned" value="${site.endDatePlanned || ''}">
                </div>
            </div>

            <!-- 出来高請求・入金履歴管理 -->
            <div class="form-group" style="margin-bottom: 1.5rem; border: 1px solid var(--border-light); padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.015);">
                <label style="font-weight: bold; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span>出来高請求・入金履歴</span>
                    <button type="button" class="btn btn-secondary" id="btn-add-billing-row" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px;">
                        ＋ 請求行を追加
                    </button>
                </label>
                <div id="billing-rows-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- 動的生成 -->
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="site-address">現場住所</label>
                <input type="text" id="site-address" value="${site.address || ''}" placeholder="東京都目黒区...">
            </div>

            <!-- 備考入力欄 -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="site-memo">備考</label>
                <textarea id="site-memo" rows="3" placeholder="現場に関する特記事項やメモを自由に入力してください..." style="width: 100%; padding: 0.5rem; border-radius: 6px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-light); font-size: 0.9rem; font-family: var(--font-sans); resize: vertical;">${site.memo || ''}</textarea>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                    ${isEdit ? `
                    <button type="button" class="btn btn-danger" id="btn-site-delete" data-id="${site.id}" data-name="${site.name}" style="background-color: var(--color-danger); border-color: var(--color-danger);">
                        この現場を削除
                    </button>
                    ` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-secondary" id="btn-site-cancel">キャンセル</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? '変更を保存' : '新規登録する'}</button>
                </div>
            </div>
        </form>
    `;

    backdrop.classList.add('open');
    const form = document.getElementById('site-form');

    // 請求行のレンダリング関数
    const renderBillingRows = () => {
        const container = document.getElementById('billing-rows-container');
        if (!site.billings) site.billings = [];

        // 互換性移行：既存データがあり、履歴が空なら格納
        if (site.billings.length === 0 && (site.billedDate || site.paidDate)) {
            site.billings.push({
                id: 'bill_legacy',
                billedDate: site.billedDate || '',
                paidDate: site.paidDate || ''
            });
        }

        container.innerHTML = site.billings.map((b, idx) => `
            <div class="billing-row" data-id="${b.id}" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.015); border: 1px solid var(--border-light); border-radius: 6px;">
                <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted); width: 60px; flex-shrink: 0;">${idx + 1}回目:</span>
                <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.3rem;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); flex-shrink: 0;">請求日:</span>
                        <input type="date" class="form-control billing-input-date" data-field="billedDate" value="${b.billedDate || ''}" style="padding: 0.2rem; font-size: 0.8rem; width: 100%;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.3rem;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); flex-shrink: 0;">入金日:</span>
                        <input type="date" class="form-control billing-input-date" data-field="paidDate" value="${b.paidDate || ''}" style="padding: 0.2rem; font-size: 0.8rem; width: 100%;">
                    </div>
                </div>
                <button type="button" class="btn btn-danger btn-delete-billing-row" style="padding: 0.2rem 0.4rem; font-size: 0.7rem; border-radius: 4px;">
                    削除
                </button>
            </div>
        `).join('');

        // 値の入力監視
        container.querySelectorAll('.billing-input-date').forEach(input => {
            input.addEventListener('change', (e) => {
                const row = e.target.closest('.billing-row');
                const id = row.getAttribute('data-id');
                const field = e.target.getAttribute('data-field');
                const val = e.target.value;
                const b = site.billings.find(x => x.id === id);
                if (b) b[field] = val;
            });
        });

        // 削除ボタンのクリックハンドラ
        container.querySelectorAll('.btn-delete-billing-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('.billing-row');
                const id = row.getAttribute('data-id');
                site.billings = site.billings.filter(x => x.id !== id);
                renderBillingRows();
            });
        });
    };

    // 初期生成と行追加ボタンイベント登録
    renderBillingRows();
    document.getElementById('btn-add-billing-row').addEventListener('click', () => {
        site.billings.push({
            id: 'bill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            billedDate: '',
            paidDate: ''
        });
        renderBillingRows();
    });

    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-site-cancel').addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const siteData = {
            code: document.getElementById('site-code').value.trim(),
            name: document.getElementById('site-name').value.trim(),
            client: document.getElementById('site-client').value.trim(),
            clientManager: document.getElementById('site-client-manager').value.trim(),
            estimateCode: document.getElementById('site-estimate').value.trim(),
            survey: document.getElementById('site-survey').value.trim(),
            surveyDate: document.getElementById('site-survey-date').value,
            mainContractor: document.getElementById('site-main-contractor').value.trim(),
            superintendent: document.getElementById('site-superintendent').value.trim(),
            superintendentPhone: document.getElementById('site-superintendent-phone').value.trim(),
            startDatePlanned: document.getElementById('site-start-date-planned').value,
            endDatePlanned: document.getElementById('site-end-date-planned').value,
            startDate: '', // 工期は廃止されたため空で登録
            endDate: '',   // 工期は廃止されたため空で登録
            manager: document.getElementById('site-manager').value.trim(),
            managerConstruction: document.getElementById('site-manager-construction').value.trim(),
            budget: 0, // ご予算は非表示にしたため一律0で登録
            address: document.getElementById('site-address').value.trim(),
            status: 'active', // 工事状況は非表示にしたため一律'active'(進行中)で自動登録
            memo: document.getElementById('site-memo').value.trim(),
            billings: site.billings || [],
            billedDate: '',
            paidDate: ''
        };

        const disp = getDisplayBilling(siteData);
        siteData.billedDate = disp.billedDate || '';
        siteData.paidDate = disp.paidDate || '';

        if (isEdit) {
            window.SiteDB.update(siteId, siteData);
            window.app.showToast('現場情報を更新しました', 'success');
        } else {
            // 工事番号の重複チェック
            const exist = window.SiteDB.getAll().find(s => s.code === siteData.code);
            if (exist) {
                window.app.showToast(`工事番号「${siteData.code}」は既に登録されています。`, 'error');
                return;
            }

            window.SiteDB.add(siteData);
            window.app.showToast('現場を新しく登録しました', 'success');
        }

        closeModal();
        if (callback) callback();
    });

    if (isEdit) {
        const deleteBtn = document.getElementById('btn-site-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const id = deleteBtn.getAttribute('data-id');
                const name = deleteBtn.getAttribute('data-name');
                if (confirm(`現場「${name}」を削除してもよろしいですか？\n※関連する材料仕入れデータもすべて削除されます。`)) {
                    window.SiteDB.delete(id);
                    window.app.showToast('現場および関連仕入れデータを削除しました', 'success');
                    if (window.CloudSync && window.CloudSync.isEnabled()) {
                        syncSitesToCloud();
                    }
                    closeModal();
                    if (callback) callback();
                }
            });
        }
    }
}
// アプリ初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
    // 1. 保存されたテーマ（ダーク/ライト）の適用
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // テーマ切り替えボタンの動作紐付け
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);

            // トースト通知で切り替えを知らせる
            window.app.showToast(`${nextTheme === 'dark' ? 'ダークモード' : 'ライトモード'}に変更しました`, 'success');
        });
    }

    // 2. 日付表示の設定 (本日を動的に取得)
    const headerDate = document.getElementById('header-date');
    if (headerDate) {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const w = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
        headerDate.textContent = `${y}年${m}月${d}日(${w})`;
    }

    // 3. モバイルメニューのトグル
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const headerNav = document.getElementById('header-nav');
    if (mobileMenuBtn && headerNav) {
        mobileMenuBtn.addEventListener('click', () => {
            headerNav.classList.toggle('open');
        });
    }

    // 4. モーダルの閉じるボタンの紐付け
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            const backdrop = document.getElementById('modal-backdrop');
            if (backdrop) {
                backdrop.classList.remove('open');
            }
        });
    }

    // 5. データベースの初期化
    if (typeof window.initDatabase === 'function') {
        window.initDatabase();
    }

    // 6. ルーターの起動
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
    router();

    // 7. アイコンの描画
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // クラウド設定モーダルのボタン紐付け
    const cloudConfigBtn = document.getElementById('btn-cloud-config');
    if (cloudConfigBtn) {
        cloudConfigBtn.addEventListener('click', () => {
            openCloudSettingsModal();
        });
    }

    // クラウド同期ボタンの紐付け
    const cloudSyncBtn = document.getElementById('btn-cloud-sync');
    if (cloudSyncBtn) {
        cloudSyncBtn.addEventListener('click', () => {
            syncReportsFromCloud(false); // 手動(強制)同期
        });
    }

    // 最終同期時間の初期表示
    updateSyncTimeDisplay();

    // 1時間おきに自動バックグラウンド同期を実行するタイマー (3600000ミリ秒)
    setInterval(() => {
        console.log('⏰ 1時間おきの自動バックグラウンド同期を開始します...');
        syncReportsFromCloud(true); // 自動同期
    }, 3600000);
    } catch (e) {
        alert("🚨 初期化中にエラーをキャッチしました！\n\nエラーメッセージ: " + e.message + "\n\nスタック情報:\n" + e.stack);
    }
});

// 5. クラウド中継 (暗号化版) 同期処理 ＆ 設定

// 現場リストを暗号化してクラウドに一括送信
async function syncSitesToCloud() {
    if (!window.CloudSync || !window.CloudSync.init()) return;

    try {
        const sites = window.SiteDB.getAll();
        const collection = window.CloudSync.collection('sites');

        // 1. クラウド上の現在のドキュメントIDを取得
        const snapshot = await collection.get();
        const cloudDocIds = [];
        snapshot.forEach(doc => cloudDocIds.push(doc.id));

        // 2. 暗号化してアップロード
        const localIds = sites.map(s => s.id);
        const uploadPromises = sites.map(async (site) => {
            const encryptedData = window.CryptoUtil.encrypt(site);
            if (encryptedData) {
                await collection.doc(site.id).set({
                    encrypted: encryptedData,
                    updatedAt: new Date().toISOString()
                });
            }
        });

        // 3. 削除された現場をクラウドから消去
        const deletePromises = cloudDocIds
            .filter(id => !localIds.includes(id))
            .map(id => collection.doc(id).delete());

        await Promise.all([...uploadPromises, ...deletePromises]);
        console.log('Sites synced to cloud successfully.');
    } catch (e) {
        console.error('Failed to sync sites to cloud:', e);
    }
}

// クラウド中継ポストから暗号化された日報をダウンロード ＆ 復号マージ ＆ クラウド消去
async function syncReportsFromCloud(isAutomatic = false) {
    if (!window.CloudSync || !window.CloudSync.init()) {
        if (!isAutomatic) {
            window.app.showToast('クラウド接続設定が未完了です。設定ボタンから登録してください。', 'warning');
        }
        return;
    }

    const syncBtn = document.getElementById('btn-cloud-sync');
    if (syncBtn && !isAutomatic) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i data-lucide="refresh-cw" style="width: 0.95rem; height: 0.95rem;"></i> <span>同期中...</span>';
        if (window.lucide) window.lucide.createIcons();
    }

    if (!isAutomatic) {
        window.app.showToast('クラウドから提出済みの未処理日報を読み込んでいます...', 'info');
    }

    try {
        const collection = window.CloudSync.collection('reports');
        const snapshot = await collection.get();

        if (snapshot.empty) {
            if (!isAutomatic) {
                window.app.showToast('新着日報はありません (中継ポスト is 空です)', 'info');
            }
            localStorage.setItem('last_cloud_sync_time', new Date().toLocaleString());
            updateSyncTimeDisplay();
            if (!isAutomatic) resetSyncButton();
            return;
        }

        let successCount = 0;
        const deletePromises = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.encrypted) {
                const report = window.CryptoUtil.decrypt(data.encrypted);
                if (report) {
                    const exists = window.ReportDB.getAll().some(r => 
                        r.id === report.id || 
                        (
                            r.date === report.date && 
                            r.siteId === report.siteId && 
                            r.writer === report.writer &&
                            r.startTime === report.startTime &&
                            r.endTime === report.endTime &&
                            r.content === report.content
                        )
                    );

                    if (!exists) {
                        window.ReportDB.add(report);
                    }
                    successCount++;
                    deletePromises.push(collection.doc(doc.id).delete());
                }
            }
        });

        if (successCount > 0) {
            await Promise.all(deletePromises);
            window.app.showToast(`${successCount}件の新着日報を取り込み、台帳に同期しました！`, 'success');
            localStorage.setItem('last_cloud_sync_time', new Date().toLocaleString());
            updateSyncTimeDisplay();
            router();
        } else {
            if (!isAutomatic) {
                window.app.showToast('新しい日報データは見つかりませんでした。', 'info');
            }
            localStorage.setItem('last_cloud_sync_time', new Date().toLocaleString());
            updateSyncTimeDisplay();
        }
    } catch (e) {
        console.error('Cloud report sync failed:', e);
        if (!isAutomatic) {
            window.app.showToast('同期中に接続エラーが発生しました。設定情報をご確認ください。', 'error');
        }
    } finally {
        if (!isAutomatic) resetSyncButton();
    }
}

// 最終同期バッジの更新表示
function updateSyncTimeDisplay() {
    const lastSyncSpan = document.getElementById('last-sync-time');
    const syncBadge = document.getElementById('sync-time-badge');
    if (lastSyncSpan) {
        const lastSync = localStorage.getItem('last_cloud_sync_time');
        if (lastSync) {
            const dateObj = new Date(lastSync);
            if (!isNaN(dateObj.getTime())) {
                const today = new Date();
                const isToday = dateObj.toDateString() === today.toDateString();
                const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                if (isToday) {
                    lastSyncSpan.textContent = `最終同期: 今日 ${timeStr}`;
                } else {
                    const m = dateObj.getMonth() + 1;
                    const d = dateObj.getDate();
                    lastSyncSpan.textContent = `最終同期: ${m}/${d} ${timeStr}`;
                }
            } else {
                lastSyncSpan.textContent = `最終同期: ${lastSync}`;
            }
            if (syncBadge) syncBadge.style.display = 'inline-flex';
        } else {
            lastSyncSpan.textContent = '最終同期: なし';
            if (syncBadge) syncBadge.style.display = 'inline-flex';
        }
    }
}

function resetSyncButton() {
    const syncBtn = document.getElementById('btn-cloud-sync');
    if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i data-lucide="refresh-cw" style="width: 0.95rem; height: 0.95rem;"></i> <span>クラウド同期</span>';
        if (window.lucide) window.lucide.createIcons();
    }
}

// クラウド設定モーダルの表示
function openCloudSettingsModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'システム設定 ＆ データ管理';

    const config = window.CloudSync.getConfig() || {
        url: '',
        token: 'TokoroEdgeOneAuthToken2026'
    };

    body.innerHTML = `
        <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.85rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); margin-bottom: 1.25rem;">
            <strong>🔒 暗号化について:</strong><br>
            送信される現場情報・日報データはすべてPCおよびスマートフォン内の共通キーで暗号化されてから中継ポストに送信されます。第三者がCloudflareのサーバーを覗き見ても現場名や金額は判読できません。
        </div>
        <form id="cloud-config-form">
            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="cfg-url">中継 API の URL <span style="color: var(--color-danger);">*</span></label>
                <input type="url" id="cfg-url" required value="${config.url}" placeholder="https://xxxx.workers.dev" style="font-family:monospace; font-size:0.85rem;">
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="cfg-token">アクセストークン <span style="color: var(--color-danger);">*</span></label>
                <input type="text" id="cfg-token" required value="${config.token}" style="font-family:monospace; font-size:0.85rem;">
            </div>
            <div class="modal-footer" style="padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-light);">
                <button type="button" class="btn btn-secondary" id="btn-cfg-cancel">キャンセル</button>
                <button type="submit" class="btn btn-primary" id="btn-cfg-save">保存して接続テスト</button>
            </div>
        </form>

        <!-- データバックアップ ＆ 復元エリア -->
        <div style="margin-top: 1.5rem; padding-top: 0.5rem;">
            <label style="font-size: 0.85rem; font-weight: bold; color: var(--color-primary); display: block; margin-bottom: 0.5rem;">💾 データのバックアップと復元</label>
            <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.85rem;">
                現在の全データ（現場、日報、仕入れ）をファイルとして保存（バックアップ）したり、保存したファイルからデータを復元（インポート）します。
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary" id="btn-cfg-export" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 6px; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <i data-lucide="download" style="width: 0.85rem; height: 0.85rem;"></i>データをPCに保存
                </button>
                <button type="button" class="btn btn-secondary" id="btn-cfg-import-trigger" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 6px; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <i data-lucide="upload" style="width: 0.85rem; height: 0.85rem;"></i>ファイルから復元
                </button>
                <input type="file" id="cfg-import-file" accept=".json" style="display: none;">
                
                <button type="button" class="btn btn-secondary" id="btn-cfg-rollback" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 6px; white-space: nowrap; display: none; align-items: center; gap: 0.3rem; background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2);">
                    <i data-lucide="rotate-ccw" style="width: 0.85rem; height: 0.85rem;"></i>直前の状態に戻す
                </button>
            </div>
        </div>

        <!-- データ整理（過去データのアーカイブ）エリア -->
        <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-light); padding-top: 1.25rem;">
            <label style="font-size: 0.85rem; font-weight: bold; color: var(--color-primary); display: block; margin-bottom: 0.5rem;">🧹 過去データの切り出し（軽量化）</label>
            <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.85rem;">
                指定した年月以前の古い日報データをパソコンにダウンロード保存し、同時にブラウザの記憶領域から消去して動作を軽量化（高速化）します。
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <div style="width: 150px;">
                    <select id="cfg-archive-month" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border-radius: 6px; width: 100%;">
                        <option value="">対象年月を選択...</option>
                    </select>
                </div>
                <button type="button" class="btn btn-secondary" id="btn-cfg-archive" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 6px; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <i data-lucide="archive" style="width: 0.85rem; height: 0.85rem;"></i>アーカイブ切り出し実行
                </button>
            </div>
        </div>

        <!-- 危険な操作エリア -->
        <div style="margin-top: 2rem; border-top: 1px solid var(--border-light); padding-top: 1.25rem;">
            <label style="font-size: 0.85rem; font-weight: bold; color: var(--color-danger); display: block; margin-bottom: 0.5rem;">⚠️ 危険な操作</label>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); padding: 0.85rem; border-radius: 8px; gap: 1rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; flex: 1;">
                    登録されているすべての現場情報をPCおよびクラウド上から完全に削除して初期化します。<br>
                    ※インポートやり直し時のみ実行してください。
                </div>
                <button type="button" class="btn btn-danger" id="btn-cfg-clear-sites" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 6px; white-space: nowrap;">
                    現場データを全消去
                </button>
            </div>
        </div>
    `;

    backdrop.classList.add('open');
    const form = document.getElementById('cloud-config-form');

    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-cfg-cancel').addEventListener('click', closeModal);

    document.getElementById('btn-cfg-clear-sites').addEventListener('click', async () => {
        if (confirm('登録されているすべての現場情報を完全に削除しますか？\n(過去の仕入れデータや日報データとの紐付けにも影響する場合があります)')) {
            if (confirm('本当に削除してもよろしいですか？この操作は取り消せません。')) {
                window.SiteDB.clearAll();
                if (window.CloudSync && window.CloudSync.isEnabled()) {
                    window.app.showToast('クラウド側の現場リストもクリアしています...', 'info');
                    await syncSitesToCloud();
                }
                window.app.showToast('すべての現場データを消去・初期化しました。', 'success');
                closeModal();
                const currentHash = window.location.hash;
                if (currentHash === '#ledger' || currentHash === '') {
                    if (typeof refreshSiteTable === 'function') {
                        refreshSiteTable();
                    } else {
                        location.reload();
                    }
                } else {
                    window.location.hash = '#ledger';
                }
            }
        }
    });

    // ==========================================
    // データ管理（バックアップ・復元・ロールバック）
    // ==========================================
    const exportBtn = document.getElementById('btn-cfg-export');
    const importTriggerBtn = document.getElementById('btn-cfg-import-trigger');
    const importFileInput = document.getElementById('cfg-import-file');
    const rollbackBtn = document.getElementById('btn-cfg-rollback');

    // 直前のロールバック用バックアップが存在するか確認して表示制御
    const hasRollbackData = localStorage.getItem('SiteDB_rollback_backup') && localStorage.getItem('ReportDB_rollback_backup');
    if (rollbackBtn) {
        if (hasRollbackData) {
            rollbackBtn.style.display = 'inline-flex';
        } else {
            rollbackBtn.style.display = 'none';
        }
    }

    // 1. バックアップの書き出し（エクスポート）
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                const backup = {
                    version: '2.0',
                    exportedAt: new Date().toISOString(),
                    sites: window.SiteDB.getAll() || [],
                    reports: window.ReportDB.getAll() || [],
                    purchases: window.PurchaseDB.getAll() || []
                };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `業務日報_現場台帳_バックアップ_${new Date().toISOString().substring(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                window.app.showToast('バックアップファイルを保存しました！', 'success');
            } catch (err) {
                console.error(err);
                window.app.showToast('バックアップの作成に失敗しました。', 'error');
            }
        });
    }

    // 2. 復元のファイル選択トリガーとインポート処理
    if (importTriggerBtn && importFileInput) {
        importTriggerBtn.addEventListener('click', () => {
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    // 以前のファイル形式（SiteDB, ReportDB, PurchaseDB）か、統合形式（sites, reports, purchases）か判定
                    const sites = data.sites || (data.SiteDB ? JSON.parse(data.SiteDB) : null);
                    const reports = data.reports || (data.ReportDB ? JSON.parse(data.ReportDB) : null);
                    const purchases = data.purchases || (data.PurchaseDB ? JSON.parse(data.PurchaseDB) : null);
                    
                    if (!sites || !reports || !purchases) {
                        window.app.showToast('有効なバックアップファイルではありません。', 'error');
                        return;
                    }
                    
                    const mergeMode = confirm(`【データの取り込み方法】\n現在のデータを消さずに、ファイルのデータを「追加（合体）」しますか？\n\n・「OK」を押す：過去のデータを現在のデータに追加合体します。\n・「キャンセル」を押す：現在のデータを完全に消去して置き換えます。`);
                    
                    // 復旧用（ロールバック）バックアップを自動取得
                    localStorage.setItem('SiteDB_rollback_backup', localStorage.getItem('SiteDB') || '');
                    localStorage.setItem('ReportDB_rollback_backup', localStorage.getItem('ReportDB') || '');
                    localStorage.setItem('PurchaseDB_rollback_backup', localStorage.getItem('PurchaseDB') || '');
                    
                    if (mergeMode) {
                        // 追加（合体）マージモード
                        const currentSites = window.SiteDB.getAll() || [];
                        const mergedSites = [...currentSites];
                        sites.forEach(s => {
                            const idx = mergedSites.findIndex(x => x.id === s.id || (x.code && x.code === s.code));
                            if (idx !== -1) {
                                mergedSites[idx] = { ...mergedSites[idx], ...s };
                            } else {
                                mergedSites.push(s);
                            }
                        });
                        
                        const currentReps = window.ReportDB.getAll() || [];
                        const mergedReps = [...currentReps];
                        reports.forEach(r => {
                            const idx = mergedReps.findIndex(x => 
                                x.id === r.id || 
                                (x.date === r.date && x.siteId === r.siteId && x.writer === r.writer && x.startTime === r.startTime && x.endTime === r.endTime)
                            );
                            if (idx !== -1) {
                                mergedReps[idx] = { ...mergedReps[idx], ...r };
                            } else {
                                mergedReps.push(r);
                            }
                        });
                        
                        const currentPurchases = window.PurchaseDB.getAll() || [];
                        const mergedPurchases = [...currentPurchases];
                        purchases.forEach(p => {
                            const idx = mergedPurchases.findIndex(x => x.id === p.id);
                            if (idx !== -1) {
                                mergedPurchases[idx] = { ...mergedPurchases[idx], ...p };
                            } else {
                                mergedPurchases.push(p);
                            }
                        });
                        
                        window.SiteDB.saveAll(mergedSites);
                        window.ReportDB.saveAll(mergedReps);
                        window.PurchaseDB.saveAll(mergedPurchases);
                        
                        window.app.showToast('過去データを現在のデータに追加合体しました！リロードします。', 'success');
                    } else {
                        // 完全上書きモード
                        if (confirm('本当に現在のローカルデータを消去し、ファイルの内容で完全に置き換えますか？')) {
                            window.SiteDB.saveAll(sites);
                            window.ReportDB.saveAll(reports);
                            window.PurchaseDB.saveAll(purchases);
                            window.app.showToast('データを完全上書き復元しました！リロードします。', 'success');
                        } else {
                            // ロールバックデータをクリアしてキャンセル
                            localStorage.removeItem('SiteDB_rollback_backup');
                            localStorage.removeItem('ReportDB_rollback_backup');
                            localStorage.removeItem('PurchaseDB_rollback_backup');
                            return;
                        }
                    }
                    setTimeout(() => location.reload(), 1500);
                } catch (err) {
                    console.error(err);
                    window.app.showToast('ファイルの解析に失敗しました。ファイル形式をご確認ください。', 'error');
                }
            };
            reader.readAsText(file);
            importFileInput.value = ''; // リセット
        });
    }

    // 3. ロールバック（直前の状態に戻す）
    if (rollbackBtn) {
        rollbackBtn.addEventListener('click', () => {
            const oldSitesStr = localStorage.getItem('SiteDB_rollback_backup');
            const oldReportsStr = localStorage.getItem('ReportDB_rollback_backup');
            const oldPurchasesStr = localStorage.getItem('PurchaseDB_rollback_backup');
            
            if (!oldSitesStr || !oldReportsStr) {
                window.app.showToast('戻すことができるバックアップ履歴がありません。', 'error');
                return;
            }
            
            if (confirm('直前の復元・整理を実行する前の状態に戻しますか？')) {
                localStorage.setItem('SiteDB', oldSitesStr);
                localStorage.setItem('ReportDB', oldReportsStr);
                if (oldPurchasesStr) {
                    localStorage.setItem('PurchaseDB', oldPurchasesStr);
                } else {
                    localStorage.removeItem('PurchaseDB');
                }
                
                // ロールバックデータをクリア
                localStorage.removeItem('SiteDB_rollback_backup');
                localStorage.removeItem('ReportDB_rollback_backup');
                localStorage.removeItem('PurchaseDB_rollback_backup');
                
                window.app.showToast('直前の状態にロールバックしました！画面をリロードします。', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        });
    }

    // ==========================================
    // 過去データ年月アーカイブ切り出し（整理）
    // ==========================================
    const archiveMonthSelect = document.getElementById('cfg-archive-month');
    const archiveBtn = document.getElementById('btn-cfg-archive');

    // 存在する年月の一覧を動的生成してセレクトボックスに詰める
    if (archiveMonthSelect) {
        const allReps = window.ReportDB.getAll() || [];
        const uniqueMonths = [...new Set(allReps.map(r => r.date ? r.date.substring(0, 7) : null).filter(Boolean))].sort().reverse();
        archiveMonthSelect.innerHTML = '<option value="">対象年月を選択...</option>' + 
            uniqueMonths.map(m => {
                const [y, mm] = m.split('-');
                return `<option value="${m}">${y}年${mm}月 以前</option>`;
            }).join('');
    }

    if (archiveBtn && archiveMonthSelect) {
        archiveBtn.addEventListener('click', () => {
            const targetMonth = archiveMonthSelect.value;
            if (!targetMonth) {
                window.app.showToast('対象となる年月を選択してください。', 'warning');
                return;
            }
            
            const targetDateStr = targetMonth + '-31'; // 指定月以前
            const allReps = window.ReportDB.getAll() || [];
            const allPurchases = window.PurchaseDB.getAll() || [];
            const allSites = window.SiteDB.getAll() || [];
            
            // アーカイブ（消去対象）データの抽出
            const repsToArchive = allReps.filter(r => r.date && r.date <= targetDateStr);
            // 仕入れデータも日付があれば紐付け
            const purchasesToArchive = allPurchases.filter(p => p.date && p.date <= targetDateStr);
            
            if (repsToArchive.length === 0) {
                window.app.showToast(`${targetMonth} 以前の対象データが見つかりません。`, 'info');
                return;
            }
            
            if (confirm(`${targetMonth} 以前の日報 ${repsToArchive.length} 件（および関連する仕入れ ${purchasesToArchive.length} 件）を「アーカイブファイル」としてPCに保存し、ブラウザの記憶領域から消去します。よろしいですか？`)) {
                
                // ロールバックバックアップの取得
                localStorage.setItem('SiteDB_rollback_backup', localStorage.getItem('SiteDB') || '');
                localStorage.setItem('ReportDB_rollback_backup', localStorage.getItem('ReportDB') || '');
                localStorage.setItem('PurchaseDB_rollback_backup', localStorage.getItem('PurchaseDB') || '');
                
                // 1. アーカイブファイルをPCに保存
                const archiveData = {
                    version: '2.0_archive',
                    archivedAt: new Date().toISOString(),
                    targetPeriod: `${targetMonth} 以前`,
                    sites: allSites, // 現場情報は整合性のため全件含めます
                    reports: repsToArchive,
                    purchases: purchasesToArchive
                };
                
                const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `業務日報_現場台帳_アーカイブ_${targetMonth}_以前.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // 2. ブラウザの記憶領域から削除
                const remainingReps = allReps.filter(r => !r.date || r.date > targetDateStr);
                const remainingPurchases = allPurchases.filter(p => !p.date || p.date > targetDateStr);
                
                window.ReportDB.saveAll(remainingReps);
                window.PurchaseDB.saveAll(remainingPurchases);
                
                window.app.showToast(`アーカイブファイルの作成とデータ整理が完了しました！リロードします。`, 'success');
                setTimeout(() => location.reload(), 1500);
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('btn-cfg-save');
        saveBtn.disabled = true;
        saveBtn.textContent = '接続テスト中...';

        const urlInput = document.getElementById('cfg-url').value.trim().replace(/\/$/, '');
        const tokenInput = document.getElementById('cfg-token').value.trim();

        const newConfig = {
            url: urlInput,
            token: tokenInput
        };

        if (!newConfig.url || !newConfig.token) {
            window.app.showToast('設定が空です。「疑似クラウド（ブラウザ内中継）」として起動します。', 'info');
            localStorage.removeItem('cloudflare_config');
            window.CloudSync.config = null;
            window.CloudSync.isMock = true;
            closeModal();
            return;
        }

        try {
            const testUrl = `${newConfig.url}/api/test`;
            const res = await fetch(testUrl, {
                headers: { 'Authorization': `Bearer ${newConfig.token}` }
            });

            if (res.ok) {
                const testData = await res.json();
                if (testData.status === 'ok') {
                    window.app.showToast('Cloudflare Workers への接続テストに成功しました！', 'success');
                    window.CloudSync.saveConfig(newConfig);
                    closeModal();
                    syncSitesToCloud();
                } else {
                    throw new Error('Invalid response status');
                }
            } else {
                if (res.status === 401) {
                    window.app.showToast('接続に失敗しました。アクセストークンが間違っています。', 'error');
                } else {
                    window.app.showToast(`接続エラー。ステータス: ${res.status}`, 'error');
                }
                saveBtn.disabled = false;
                saveBtn.textContent = '保存して接続テスト';
            }
        } catch (err) {
            console.error('Cloudflare test connection failed:', err);
            window.app.showToast('API URLへの接続に失敗しました。URLに誤りがあるか、Workersが未デプロイです。', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = '保存して接続テスト';
        }
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Excel/CSV一括インポートモーダルの表示
function openExcelImportModal(callback) {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Excel / CSV 現場データ一括インポート';

    body.innerHTML = `
        <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.85rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); margin-bottom: 1.25rem;">
            <strong>📋 Excelファイル形式について:</strong><br>
            1行目に見出し（「工事番号」「現場名」「受注先」など）があるExcel（.xlsx / .xls）またはCSVファイルを選択してください。<br>
            ※同一の工事番号が既に登録されている場合は、自動的に新しい情報に上書き更新されます。
        </div>

        <!-- ドラッグ＆ドロップエリア -->
        <div id="excel-drop-zone" style="border: 2px dashed var(--border-light); border-radius: 10px; padding: 2rem 1rem; text-align: center; background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(59,130,246,0.04)'; this.style.borderColor='var(--color-primary)';" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.borderColor='var(--border-light)';">
            <i data-lucide="upload-cloud" style="width: 2.5rem; height: 2.5rem; color: var(--color-primary); margin-bottom: 0.5rem;"></i>
            <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">ここにExcelファイルをドラッグ＆ドロップ</p>
            <p style="font-size: 0.75rem; color: var(--text-muted);">またはクリックしてファイルを選択</p>
            <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" style="display: none;">
        </div>

        <!-- プレビューテーブル領域（初期は非表示） -->
        <div id="excel-preview-area" style="display: none; margin-top: 1.25rem;">
            <p style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem;">📋 インポートデータのプレビュー（最大800件表示）</p>
            <div class="table-responsive" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-light); border-radius: 8px;">
                <table class="data-table" style="font-size: 0.8rem;">
                    <thead>
                        <tr>
                            <th>状態</th>
                            <th>工事番号</th>
                            <th>見積り番号</th>
                            <th>現場名称</th>
                            <th>受注先 (元請)</th>
                            <th>受注先担当者</th>
                            <th>自社担当</th>
                            <th>住所</th>
                            <th>請求日</th>
                            <th>入金日</th>
                        </tr>
                    </thead>
                    <tbody id="excel-preview-tbody"></tbody>
                </table>
            </div>
        </div>

        <div class="modal-footer" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-import-cancel">キャンセル</button>
            <button type="button" class="btn btn-primary" id="btn-import-submit" disabled>データを読み込んでください</button>
        </div>
    `;

    backdrop.classList.add('open');
    if (window.lucide) window.lucide.createIcons();

    const dropZone = document.getElementById('excel-drop-zone');
    const fileInput = document.getElementById('excel-file-input');
    const previewArea = document.getElementById('excel-preview-area');
    const previewTbody = document.getElementById('excel-preview-tbody');
    const submitBtn = document.getElementById('btn-import-submit');

    let parsedSites = [];

    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-import-cancel').addEventListener('click', closeModal);

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.background = 'rgba(59,130,246,0.08)';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.background = 'rgba(255,255,255,0.02)';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.background = 'rgba(255,255,255,0.02)';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleExcelFile(files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleExcelFile(files[0]);
        }
    });

    function handleExcelFile(file) {
        if (!window.XLSX) {
            window.app.showToast('Excel解析ライブラリが読み込まれていません', 'error');
            return;
        }

        window.app.showToast(`${file.name} を読み込んでいます...`, 'info');
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                if (rows.length < 2) {
                    window.app.showToast('ファイルに現場データが見つかりませんでした (見出しとデータが最低2行必要です)', 'error');
                    return;
                }

                const headers = rows[0].map(h => String(h).replace(/\s+/g, '').trim().toLowerCase());

                let codeIdx = -1;
                let nameIdx = -1;
                let clientIdx = -1;
                let clientManagerIdx = -1;
                let managerIdx = -1;
                let addressIdx = -1;
                let memoIdx = -1;
                let estimateIdx = -1;
                let billedDateIdx = -1;
                let paidDateIdx = -1;

                headers.forEach((h, idx) => {
                    // 1. 受注先担当者 (「担当」を含むものを最優先で判定して誤認を防ぐ)
                    if (h.includes('受注先担当') || h.includes('受注担当') || h.includes('元請担当') || h.includes('客先担当') || h.includes('clientmanager') || h.includes('client_manager')) {
                        clientManagerIdx = idx;
                    }
                    // 2. 自社担当者 (自社担当、弊社担当、担当者)
                    else if (h.includes('自社担当') || h.includes('弊社担当') || h.includes('担当者') || h.includes('管理者') || h.includes('staff')) {
                        managerIdx = idx;
                    }
                    // 3. 受注先 (「担当」を含まない「受注先」「元請」など)
                    else if (h.includes('受注先') || h.includes('元請') || h.includes('顧客') || h.includes('発注') || h.includes('client') || h.includes('customer') || h.includes('company')) {
                        clientIdx = idx;
                    }
                    // 4. 工事番号
                    else if (h.includes('工事番号') || h.includes('コード') || h.includes('code') || h.includes('no') || h.includes('現場no')) {
                        codeIdx = idx;
                    }
                    // 5. 現場名称
                    else if (h.includes('現場名称') || h.includes('現場名') || h.includes('工事名') || h.includes('name')) {
                        nameIdx = idx;
                    }
                    // 6. 見積番号
                    else if (h.includes('見積番号') || h.includes('見積り番号') || h.includes('見積') || h.includes('estimate')) {
                        estimateIdx = idx;
                    }
                    // 7. 住所
                    else if (h.includes('住所') || h.includes('所在地') || h.includes('address')) {
                        addressIdx = idx;
                    }
                    // 8. メモ・備考
                    else if (h.includes('メモ') || h.includes('備考') || h.includes('memo')) {
                        memoIdx = idx;
                    }
                    // 9. 請求日
                    else if (h.includes('請求日') || h.includes('請求年月日') || h.includes('billeddate') || h.includes('billed_date')) {
                        billedDateIdx = idx;
                    }
                    // 10. 入金日
                    else if (h.includes('入金日') || h.includes('入金年月日') || h.includes('paiddate') || h.includes('paid_date')) {
                        paidDateIdx = idx;
                    }
                });

                if (nameIdx === -1) {
                    window.app.showToast('「現場名」または「現場名称」の列が見つかりません。', 'error');
                    return;
                }

                parsedSites = [];
                const existSites = window.SiteDB.getAll();
                let html = '';

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length === 0 || !row[nameIdx]) continue;

                    const name = String(row[nameIdx]).trim();
                    const code = codeIdx !== -1 && row[codeIdx] 
                        ? String(row[codeIdx]).trim() 
                        : 'XX' + String(Date.now()).slice(-3) + i;

                    // Excelシリアル値および書式を日付(YYYY-MM-DD)に標準化するヘルパー
                    const parseExcelDate = (val) => {
                        if (!val) return '';
                        if (typeof val === 'number' || (!isNaN(val) && Number(val) > 40000)) {
                            const date = new Date((Number(val) - 25569) * 86400 * 1000);
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        }
                        let str = String(val).trim().split('/').join('-');
                        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
                            const parts = str.split('-');
                            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                        }
                        return str;
                    };

                    const client = clientIdx !== -1 ? String(row[clientIdx]).trim() : '';
                    const clientManager = clientManagerIdx !== -1 ? String(row[clientManagerIdx]).trim() : '';
                    const manager = managerIdx !== -1 ? String(row[managerIdx]).trim() : '';
                    const address = addressIdx !== -1 ? String(row[addressIdx]).trim() : '';
                    const memo = memoIdx !== -1 ? String(row[memoIdx]).trim() : '';
                    const estimateCode = estimateIdx !== -1 ? String(row[estimateIdx]).trim() : '';
                    const billedDate = billedDateIdx !== -1 ? parseExcelDate(row[billedDateIdx]) : '';
                    const paidDate = paidDateIdx !== -1 ? parseExcelDate(row[paidDateIdx]) : '';

                    const exist = existSites.find(s => s.code === code);
                    const statusText = exist ? '🔄 上書き更新' : '➕ 新規追加';
                    const statusClass = exist ? 'color: var(--color-warning); font-weight:bold;' : 'color: var(--color-success); font-weight:bold;';

                    const siteObj = {
                        id: exist ? exist.id : null,
                        code,
                        name: name || (exist ? exist.name : ''),
                        client: client || (exist ? exist.client : ''),
                        clientManager: clientManager || (exist ? exist.clientManager : ''),
                        startDate: exist ? exist.startDate : '',
                        endDate: exist ? exist.endDate : '',
                        manager: manager || (exist ? exist.manager : ''),
                        budget: exist ? exist.budget : 0,
                        estimateCode: estimateCode || (exist ? exist.estimateCode : ''),
                        billedDate: billedDate || (exist ? (exist.billedDate || '') : ''),
                        paidDate: paidDate || (exist ? (exist.paidDate || '') : ''),
                        isBilled: !!(billedDate || (exist && exist.isBilled)),
                        isPaid: !!(paidDate || (exist && exist.isPaid)),
                        address: address || (exist ? exist.address : ''),
                        status: exist ? exist.status : 'active',
                        memo: memo || (exist ? exist.memo : 'Excelインポートにより登録されました。')
                    };

                    parsedSites.push(siteObj);

                    if (parsedSites.length <= 800) {
                        html += `
                            <tr>
                                <td style="${statusClass}">${statusText}</td>
                                <td style="font-family:'Inter'; font-weight:600;">${code}</td>
                                <td>${estimateCode || '-'}</td>
                                <td><strong>${name}</strong></td>
                                <td>${client || '-'}</td>
                                <td>${clientManager || '-'}</td>
                                <td>${manager || '-'}</td>
                                <td style="font-size:0.75rem;">${address || '-'}</td>
                                <td style="font-family:'Inter';">${billedDate || '-'}</td>
                                <td style="font-family:'Inter';">${paidDate || '-'}</td>
                            </tr>
                        `;
                    }
                }

                if (parsedSites.length === 0) {
                    window.app.showToast('インポート可能なデータがありませんでした', 'error');
                    return;
                }

                previewTbody.innerHTML = html;
                previewArea.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = `現場 ${parsedSites.length} 件を一括インポートする`;

                window.app.showToast(`Excelの解析が完了しました (合計${parsedSites.length}件)`, 'success');
            } catch (err) {
                console.error(err);
                window.app.showToast('Excelファイルの読み込みに失敗しました。正しいフォーマットかご確認ください。', 'error');
            }
        };

        reader.readAsArrayBuffer(file);
    }

    submitBtn.addEventListener('click', async () => {
        if (parsedSites.length === 0) return;

        submitBtn.disabled = true;
        submitBtn.textContent = '登録中...';

        try {
            let addCount = 0;
            let updateCount = 0;

            parsedSites.forEach(site => {
                const siteData = { ...site };
                const id = siteData.id;
                delete siteData.id;

                if (id) {
                    window.SiteDB.update(id, siteData);
                    updateCount++;
                } else {
                    window.SiteDB.add(siteData);
                    addCount++;
                }
            });

            window.app.showToast(`${addCount}件の新規登録、${updateCount}件の上書き更新が完了しました！`, 'success');

            if (window.CloudSync && window.CloudSync.isEnabled()) {
                window.app.showToast('Cloudflareへの現場リスト自動同期を開始します...', 'info');
                await syncSitesToCloud();
                window.app.showToast('Cloudflareへの同期が成功しました！スマホ側も即時反映されます。', 'success');
            }

            closeModal();
            if (callback) callback();
        } catch (err) {
            console.error('Batch import failed:', err);
            window.app.showToast('インポート処理中にエラーが発生しました', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = `一括インポートを再実行`;
        }
    });
}

// PDFの抽出テキストから仕入れ情報（複数件の配列）を判別するパーサ (電子PDF専用・高精度版)
function parsePurchaseText(text) {
    const items = [];
    if (!text) return items;

    // 1. 日付の判別 (「発行日」または「発行」の周辺から最優先)    // 共通情報の抽出（日付、仕入れ先、発注者）
    const common = {
        date: '',
        supplier: '',
        orderedBy: '所'
    };

    // 1. 日付の判別 (「発行日」または「発行」の周辺から最優先)
    const issueDateMatch = text.match(/(?:発行日|発行|日付)\s*[:：\s]*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/i);
    if (issueDateMatch) {
        const parts = issueDateMatch[1].replace(/日$/, '').split(/[-/年月]/);
        if (parts.length === 3) {
            common.date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
    } else {
        const dateMatch = text.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2}日?)/);
        if (dateMatch) {
            const y = dateMatch[1];
            const m = String(dateMatch[2]).padStart(2, '0');
            const d = String(dateMatch[3]).replace(/日$/, '').padStart(2, '0');
            common.date = `${y}-${m}-${d}`;
        } else {
            const eraMatch = text.match(/(?:令和|令|R|r)\s*(\d{1,2})[-/年\s](\d{1,2})[-/月\s](\d{1,2})/);
            if (eraMatch) {
                const rYear = parseInt(eraMatch[1], 10);
                const wYear = 2018 + rYear;
                const m = String(eraMatch[2]).padStart(2, '0');
                const d = String(eraMatch[3]).padStart(2, '0');
                common.date = `${wYear}-${m}-${d}`;
            }
        }
    }

    // 2. 発注者（「注文No.」の周辺から）
    const orderNoMatch = text.match(/(?:注文No\.?|注文番号|発注No\.?)\s*[:：\s]*([a-zA-Z0-9\-_]+)/i);
    if (orderNoMatch) {
        common.orderedBy = orderNoMatch[1].trim();
    }

    // 3. 仕入れ先の判別 (「請求元：」の周辺から最優先、なければ過去の履歴から)
    const supplierMatch = text.match(/(?:請求元|仕入先|発行元)\s*[:：\s]*([^\s\n]+)/);
    if (supplierMatch) {
        common.supplier = supplierMatch[1].replace(/[御中様]/g, '').trim();
    } else {
        const allPurchases = window.PurchaseDB.getAll() || [];
        const suppliers = [...new Set(allPurchases.map(p => p.supplier).filter(Boolean))];
        for (const sup of suppliers) {
            if (text.includes(sup)) {
                common.supplier = sup;
                break;
            }
        }
        if (!common.supplier) {
            const companyMatch = text.match(/([^\s\n]+(?:株式会社|有限会社|合同会社|建設|資材|電材)[^\s\n]*)/);
            if (companyMatch) {
                common.supplier = companyMatch[1].replace(/[御中様]/g, '').trim();
            }
        }
    }

    // 4. 品名・数量・単価・メーカー名・現場IDの判別 (積のチェック A * B = C)
    const lines = text.split('\n');
    const sites = window.SiteDB.getAll() || [];

    for (const line of lines) {
        const words = line.split(/\s+/).filter(Boolean);
        const numbers = words.map(w => {
            const clean = w.replace(/[¥￥,円\s]/g, '');
            const num = parseFloat(clean);
            return { original: w, clean, num };
        }).filter(item => !isNaN(item.num) && item.num > 0);

        if (numbers.length >= 3) {
            let matchedInLine = false;
            for (let i = 0; i < numbers.length && !matchedInLine; i++) {
                for (let j = 0; j < numbers.length && !matchedInLine; j++) {
                    if (i === j) continue;
                    for (let k = 0; k < numbers.length && !matchedInLine; k++) {
                        if (k === i || k === j) continue;

                        const valA = numbers[i].num;
                        const valB = numbers[j].num;
                        const valC = numbers[k].num;

                        if (Math.abs(valA * valB - valC) < 0.5 && valC > 1) {
                            const qty = Math.min(valA, valB);
                            const price = Math.max(valA, valB);

                            const idxA = words.indexOf(numbers[i].original);
                            const idxB = words.indexOf(numbers[j].original);
                            const idxC = words.indexOf(numbers[k].original);

                            const minIdx = Math.min(idxA, idxB, idxC);
                            const maxIdx = Math.max(idxA, idxB, idxC);

                            const item = {
                                ...common,
                                quantity: qty,
                                unitPrice: price,
                                itemName: '',
                                maker: '',
                                unit: '本',
                                siteId: ''
                            };

                            // 品名 (数値の左側を結合)
                            if (minIdx > 0) {
                                let rawItemName = words.slice(0, minIdx).join(' ').trim();

                                // メーカー名の抽出 (品名の中の括弧の左側、すなわち "）" の左側)
                                const parenMatch = rawItemName.match(/[（\(]([^）\)]+)[）\)]/);
                                if (parenMatch) {
                                    item.maker = parenMatch[1].trim(); // 括弧内をメーカー名に
                                    rawItemName = rawItemName.replace(/[（\(][^）\)]+[）\)]/, '').trim(); // 品名からメーカー部分を除去
                                }
                                item.itemName = rawItemName.replace(/[^a-zA-Z0-9ぁ-んァ-ヶ亜-熙\s\-_]/g, '').trim();
                            }

                            // 単位
                            const unitWord = words.find(w => ['本', '枚', 't', 'kg', '台', '缶', '箱', 'm', 'セット', '組', '個', '袋'].includes(w));
                            if (unitWord) {
                                item.unit = unitWord;
                            }

                            // 対象工事番号・現場名 (数値の右側にある「備考」部分)
                            if (maxIdx < words.length - 1) {
                                const memoText = words.slice(maxIdx + 1).join(' ').trim();
                                if (memoText) {
                                    const matchedSite = sites.find(s => 
                                        s.code === memoText || 
                                        s.name.includes(memoText) || 
                                        memoText.includes(s.code) || 
                                        memoText.includes(s.name)
                                    );
                                    if (matchedSite) {
                                        item.siteId = matchedSite.id;
                                    }
                                }
                            }

                            items.push(item);
                            matchedInLine = true; // 1行からは重複して抽出しない
                        }
                    }
                }
            }
        }
    }

    return items;
}

// ==========================================================================
// 協力業者台帳
// ==========================================================================

function renderPartnerLedger(container) {
    container.innerHTML = `
        <div class="toolbar no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div class="search-filter-group" style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
                <div class="input-search-wrapper" style="position: relative; min-width: 250px; flex: 1;">
                    <i data-lucide="search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: var(--text-muted);"></i>
                    <input type="text" id="partner-ledger-search" class="input-search" placeholder="現場名、工事番号、作業内容で検索..." style="padding-left: 2.2rem; width: 100%;">
                </div>
                <div style="width: 150px;">
                    <select id="partner-ledger-month-filter" class="form-control" style="padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                        <option value="all">すべての月 (11日〜翌10日)</option>
                        <!-- 動的に月が追加される -->
                    </select>
                </div>
                <div style="width: 200px;">
                    <select id="partner-ledger-partner-filter" class="form-control" style="padding: 0.4rem; border-radius: 6px; font-size: 0.85rem; background-color: rgba(59, 130, 246, 0.05); border-color: var(--color-primary); font-weight: bold; color: var(--color-primary);">
                        <option value="all">協力業者すべて (階層表示)</option>
                        <!-- 動的に業者が追加される -->
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-secondary" id="btn-print-partner-ledger" style="display: none;">
                    <i data-lucide="printer"></i>
                    <span>一覧表を印刷・PDF保存</span>
                </button>
            </div>
        </div>

        <div id="partner-ledger-list-container">
            <!-- ここにテーブルが動的生成されます -->
        </div>
    `;

    // フィルタ要素
    const searchInput = document.getElementById('partner-ledger-search');
    const monthFilter = document.getElementById('partner-ledger-month-filter');
    const partnerFilter = document.getElementById('partner-ledger-partner-filter');

    // データ抽出 (協力業者が存在する日報のみ)
    const reports = window.ReportDB.getAll() || [];
    const reportsWithPartners = reports.filter(r => r.partnerCompanions && r.partnerCompanions.trim() !== '');

    // 選択肢の動的生成
    const uniqueMonths = new Set();
    const uniquePartners = new Set();

    reportsWithPartners.forEach(r => {
        // 月
        if (r.date) {
            const parts = r.date.split('-');
            if (parts.length >= 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const d = parseInt(parts[2], 10);
                if (d >= 11) {
                    let closingM = m + 1;
                    let closingY = y;
                    if (closingM > 12) {
                        closingM = 1;
                        closingY = y + 1;
                    }
                    uniqueMonths.add(`${closingY}-${String(closingM).padStart(2, '0')}`);
                } else {
                    uniqueMonths.add(`${y}-${String(m).padStart(2, '0')}`);
                }
            }
        }
        // 業者名
        if (r.partnerCompanions) {
            const partners = r.partnerCompanions.split(/[、,、\s\+]+/).map(p => p.trim()).filter(p => p);
            partners.forEach(p => uniquePartners.add(p));
        }
    });

    Array.from(uniqueMonths).sort().reverse().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `${m.split('-')[0]}年${parseInt(m.split('-')[1])}月度 (前11日〜当10日)`;
        monthFilter.appendChild(opt);
    });

    Array.from(uniquePartners).sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        partnerFilter.appendChild(opt);
    });

    // デフォルトで今月度を選択
    const now = new Date();
    let currentClosingY = now.getFullYear();
    let currentClosingM = now.getMonth() + 1;
    if (now.getDate() >= 11) {
        currentClosingM += 1;
        if (currentClosingM > 12) {
            currentClosingM = 1;
            currentClosingY += 1;
        }
    }
    const currentClosingStr = `${currentClosingY}-${String(currentClosingM).padStart(2, '0')}`;
    if (uniqueMonths.has(currentClosingStr)) {
        monthFilter.value = currentClosingStr;
    }

    const updateTable = () => {
        refreshPartnerLedgerTable({
            search: searchInput.value,
            month: monthFilter.value,
            partner: partnerFilter.value
        });
    };

    searchInput.addEventListener('input', updateTable);
    monthFilter.addEventListener('change', updateTable);
    partnerFilter.addEventListener('change', updateTable);

    updateTable();
}

function refreshPartnerLedgerTable(filter = {}) {
    const container = document.getElementById('partner-ledger-list-container');
    const printBtn = document.getElementById('btn-print-partner-ledger');
    if (!container) return;

    let allReports = window.ReportDB.getAll() || [];
    const sites = window.SiteDB.getAll() || [];
    const siteMap = new Map(sites.map(s => [s.id, s]));

    // 業者ごとにデータを分解してフラットなリストを作成する
    let partnerEntries = [];
    allReports.forEach(r => {
        if (!r.partnerCompanions || r.partnerCompanions.trim() === '') return;
        const partners = r.partnerCompanions.split(/[、,、\s\+]+/).map(p => p.trim()).filter(p => p);
        partners.forEach(p => {
            // コピーを作成して業者名を付与
            partnerEntries.push({
                ...r,
                _targetPartner: p
            });
        });
    });

    // 検索フィルタ
    if (filter.search) {
        const query = filter.search.toLowerCase();
        partnerEntries = partnerEntries.filter(r => {
            const site = siteMap.get(r.siteId);
            const siteCode = site ? site.code.toLowerCase() : '';
            const siteName = site ? site.name.toLowerCase() : '';
            const clientName = site && site.client ? site.client.toLowerCase() : '';
            return (
                siteCode.includes(query) ||
                siteName.includes(query) ||
                clientName.includes(query) ||
                (r.workContent && r.workContent.toLowerCase().includes(query))
            );
        });
    }

    // 月フィルタ
    if (filter.month && filter.month !== 'all') {
        const getClosingMonth = (dateStr) => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length < 3) return null;
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (d >= 11) {
                let closingM = m + 1;
                let closingY = y;
                if (closingM > 12) {
                    closingM = 1;
                    closingY = y + 1;
                }
                return `${closingY}-${String(closingM).padStart(2, '0')}`;
            } else {
                return `${y}-${String(m).padStart(2, '0')}`;
            }
        };
        partnerEntries = partnerEntries.filter(r => r.date && getClosingMonth(r.date) === filter.month);
    }

    // 業者フィルタ
    const isSinglePartnerMode = filter.partner && filter.partner !== 'all';
    if (isSinglePartnerMode) {
        partnerEntries = partnerEntries.filter(r => r._targetPartner === filter.partner);
        if (printBtn) printBtn.style.display = 'inline-flex';
    } else {
        if (printBtn) printBtn.style.display = 'none';
    }

    // 時間計算用ヘルパー
    const calculateWorkTime = (startStr, endStr) => {
        if (!startStr || !endStr) return { start: '-', end: '-', breakTime: '-', total: '-' };
        const parseMin = (str) => {
            const [h, m] = str.split(':').map(Number);
            return h * 60 + m;
        };
        const startMin = parseMin(startStr);
        const endMin = parseMin(endStr);
        if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) {
            return { start: startStr, end: endStr, breakTime: '-', total: '-' };
        }
        const breakStart = 12 * 60; // 12:00
        const breakEnd = 13 * 60;   // 13:00
        const hasBreak = (startMin <= breakStart && endMin >= breakEnd);
        const breakMin = hasBreak ? 60 : 0;
        const totalMin = (endMin - startMin) - breakMin;
        const breakHours = hasBreak ? '1時間' : '0時間';
        const totalH = Math.floor(totalMin / 60);
        const totalM = totalMin % 60;
        const totalText = totalM > 0 ? `${totalH}時間${totalM}分` : `${totalH}時間`;
        return { start: startStr, end: endStr, breakTime: breakHours, total: totalText, min: totalMin };
    };

    const generateTableRow = (rep) => {
        const site = siteMap.get(rep.siteId);
        const siteCode = rep.siteCode || (site ? site.code : '-');
        const siteName = rep.siteName || (site ? site.name : '不明な現場');
        const clientName = rep.client || (site ? site.client : '-');

        const isOfficeWork = rep.isOfficeWork || siteCode === 'OFFICE' || !siteCode || siteCode === '-';
        const times = calculateWorkTime(rep.startTime, rep.endTime);
        const totalTimeText = isOfficeWork ? '-' : times.total;
        const formattedDate = rep.date ? rep.date.replace(/-/g, '/') : '-';

        let snippet = rep.workContent || '';
        if (snippet.length > 25) snippet = snippet.substring(0, 25) + '...';
        snippet = snippet.replace(/\n/g, ' ');

        const displaySiteName = rep.isOfficeWork ? `<span style="background:var(--color-warning); color:white; padding:0.1rem 0.35rem; border-radius:4px; font-size:0.7rem; margin-right:0.35rem; vertical-align:text-bottom;">事務仕事</span>${siteName}` : siteName;

        return `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="font-family: 'Inter', sans-serif; font-size: 0.85rem; padding: 0.75rem;">${formattedDate}</td>
                <td style="font-family: 'Inter', sans-serif; font-weight: 600; padding: 0.75rem;">
                    <a href="#ledger/detail/${rep.siteId}">${siteCode}</a>
                </td>
                <td style="padding: 0.75rem;"><strong>${displaySiteName}</strong></td>
                <td style="padding: 0.75rem;">${clientName}</td>
                <td style="font-size: 0.85rem; padding: 0.75rem; color: var(--text-muted);" title="${rep.workContent || ''}">${snippet}</td>
                <td style="text-align: center; font-family: 'Inter', sans-serif; padding: 0.75rem;">${times.start}</td>
                <td style="text-align: center; font-family: 'Inter', sans-serif; padding: 0.75rem;">${times.end}</td>
                <td style="text-align: center; padding: 0.75rem; color: var(--text-muted);">${times.breakTime}</td>
                <td style="text-align: right; padding-right: 1.5rem; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--color-primary); padding: 0.75rem;">
                    ${totalTimeText}
                </td>
                <td style="font-size: 0.8rem; padding: 0.75rem; color: var(--text-muted); text-align: center;">${rep.writer}</td>
                <td style="text-align: center; padding: 0.75rem;" class="no-print">
                    <button class="btn btn-secondary btn-icon-only btn-view-report-detail" data-repid="${rep.id}" title="詳細表示" style="width: 1.8rem; height: 1.8rem; padding:0; display: inline-flex; align-items: center; justify-content: center;">
                        <i data-lucide="arrow-right" style="width: 0.85rem; height: 0.85rem;"></i>
                    </button>
                </td>
            </tr>
        `;
    };

    let html = '';

    if (isSinglePartnerMode) {
        // ========== 業者別フラット表示モード ==========
        partnerEntries.sort((a, b) => b.date.localeCompare(a.date));

        let totalMin = 0;
        let tableRows = '';

        if (partnerEntries.length === 0) {
            tableRows = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">該当するデータがありません。</td></tr>`;
        } else {
            partnerEntries.forEach(r => {
                const site = siteMap.get(r.siteId);
                const siteCode = r.siteCode || (site ? site.code : '');
                const isOfficeWork = r.isOfficeWork || siteCode === 'OFFICE' || !siteCode || siteCode === '-';
                if (!isOfficeWork) {
                    const times = calculateWorkTime(r.startTime, r.endTime);
                    if (times.min) totalMin += times.min;
                }
                tableRows += generateTableRow(r);
            });
        }

        const tH = Math.floor(totalMin / 60);
        const tM = totalMin % 60;
        const tManpower = (totalMin / 480).toFixed(2);
        const totalTimeText = `${tM > 0 ? `${tH}時間${tM}分` : `${tH}時間`} (${tManpower}人工)`;

        html += `
            <div id="partner-flat-view-container" style="background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--border-light);">
                <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); background: rgba(59, 130, 246, 0.05);">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="users" style="width: 1.25rem; height: 1.25rem;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; font-size: 1.15rem; font-weight: bold; color: var(--color-primary);">協力業者: ${filter.partner}</h2>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">全 ${partnerEntries.length} 件 / 作業時間: ${totalTimeText}</div>
                        </div>
                    </div>
                </div>

                <!-- 印刷用ヘッダー -->
                <div class="print-only" style="display: none; text-align: center; margin: 1rem 0;">
                    <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">協力業者台帳: ${filter.partner}</h2>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">対象月: ${filter.month === 'all' ? 'すべて' : filter.month} / 出力日時: ${new Date().toLocaleString()}</p>
                </div>

                <div class="table-responsive" style="margin: 0;" id="partner-print-area">
                    <table class="data-table">
                        <thead>
                            <tr style="background: var(--bg-card);">
                                <th style="width: 90px; text-align: left; padding: 0.75rem;">日付</th>
                                <th style="width: 100px; text-align: left; padding: 0.75rem;">工事番号</th>
                                <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                                <th style="text-align: left; padding: 0.75rem;">受注先 (元請/顧客)</th>
                                <th style="text-align: left; padding: 0.75rem;">作業内容</th>
                                <th style="width: 90px; text-align: center; padding: 0.75rem;">作業開始</th>
                                <th style="width: 90px; text-align: center; padding: 0.75rem;">作業完了</th>
                                <th style="width: 80px; text-align: center; padding: 0.75rem;">昼休憩</th>
                                <th style="width: 100px; text-align: right; padding: 0.75rem; padding-right: 1.5rem;">合計時間</th>
                                <th style="width: 90px; text-align: center; padding: 0.75rem;">同伴者(自社)</th>
                                <th style="width: 60px; text-align: center; padding: 0.75rem;" class="no-print">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                        <tfoot class="print-only" style="display:none;">
                            <tr>
                                <td colspan="8" style="text-align: right; font-weight: bold; padding: 0.5rem;">総合計:</td>
                                <td colspan="3" style="font-weight: bold; padding: 0.5rem;">${totalTimeText}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

    } else {
        // ========== 全業者アコーディオンモード ==========
        // 業者名でグルーピング
        const grouped = {};
        partnerEntries.forEach(r => {
            const p = r._targetPartner;
            if (!grouped[p]) grouped[p] = [];
            grouped[p].push(r);
        });

        const sortedPartners = Object.keys(grouped).sort();

        if (sortedPartners.length === 0) {
            html = `<p style="text-align:center; padding:2rem; color:var(--text-muted);">該当するデータがありません。</p>`;
        } else {
            sortedPartners.forEach(p => {
                const list = grouped[p];
                list.sort((a, b) => b.date.localeCompare(a.date));
                
                let deptTotalMin = 0;
                list.forEach(r => {
                    const site = siteMap.get(r.siteId);
                    const siteCode = r.siteCode || (site ? site.code : '');
                    const isOfficeWork = r.isOfficeWork || siteCode === 'OFFICE' || !siteCode || siteCode === '-';
                    if (!isOfficeWork) {
                        const times = calculateWorkTime(r.startTime, r.endTime);
                        if (times.min) deptTotalMin += times.min;
                    }
                });

                const cH = Math.floor(deptTotalMin / 60);
                const cM = deptTotalMin % 60;
                const cManpower = (deptTotalMin / 480).toFixed(2);
                const cTimeText = `${cM > 0 ? `${cH}時間${cM}分` : `${cH}時間`} (${cManpower}人工)`;

                const tableRows = list.map(rep => generateTableRow(rep)).join('');
                
                html += `
                    <div class="dept-accordion" style="border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; background: var(--bg-card); box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                        <div class="dept-header" style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.015); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <strong style="font-size: 1.1rem; color: var(--color-primary);">${p}</strong>
                                <span style="background: rgba(59, 130, 246, 0.1); color: var(--color-primary); padding: 0.15rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-family: 'Inter'; font-weight: 600;">${list.length} 件</span>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${cTimeText}</span>
                            </div>
                            <i data-lucide="chevron-down" class="accordion-icon" style="width: 1.2rem; height: 1.2rem; color: var(--text-muted); transition: transform 0.2s;"></i>
                        </div>
                        <div class="dept-content" style="display: none; border-top: 1px solid var(--border-light);">
                            <div class="table-responsive" style="margin: 0;">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 90px; text-align: left; padding: 0.75rem;">日付</th>
                                            <th style="width: 100px; text-align: left; padding: 0.75rem;">工事番号</th>
                                            <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                                            <th style="text-align: left; padding: 0.75rem;">受注先</th>
                                            <th style="text-align: left; padding: 0.75rem;">作業内容</th>
                                            <th style="width: 90px; text-align: center; padding: 0.75rem;">開始</th>
                                            <th style="width: 90px; text-align: center; padding: 0.75rem;">完了</th>
                                            <th style="width: 80px; text-align: center; padding: 0.75rem;">昼休憩</th>
                                            <th style="width: 100px; text-align: right; padding: 0.75rem;">合計時間</th>
                                            <th style="width: 90px; text-align: center; padding: 0.75rem;">同伴者(自社)</th>
                                            <th style="width: 60px; text-align: center; padding: 0.75rem;" class="no-print">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tableRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    }

    container.innerHTML = html;

    // アコーディオン開閉
    container.querySelectorAll('.dept-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');
            const isVisible = content.style.display === 'block';
            if (isVisible) {
                content.style.display = 'none';
                icon.style.transform = '';
            } else {
                content.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // 詳細表示
    container.querySelectorAll('.btn-view-report-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const repId = btn.getAttribute('data-repid');
            if (window.openReportPreviewModal) {
                window.openReportPreviewModal(repId);
            }
        });
    });

    // 印刷イベント
    if (printBtn && isSinglePartnerMode) {
        // 古いイベントリスナーが蓄積しないようにクローンして置換
        const newPrintBtn = printBtn.cloneNode(true);
        printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
        newPrintBtn.addEventListener('click', () => {
            const printContent = document.getElementById('partner-print-area').innerHTML;
            const originalContent = document.body.innerHTML;
            
            document.body.innerHTML = `
                <div style="padding: 1cm; background: white; color: black; font-family: sans-serif;">
                    <style>
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th, td { border: 1px solid #666; padding: 4px 6px; text-align: left; }
                        th { background-color: #eee; font-weight: bold; }
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        @page { size: A4 landscape; margin: 1cm; }
                        body { margin: 0; }
                    </style>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="font-size: 20px; margin: 0 0 10px 0;">協力業者台帳: ${filter.partner}</h2>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span>対象月: ${filter.month === 'all' ? 'すべて' : filter.month}</span>
                            <span>出力日時: ${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                    ${printContent}
                </div>
            `;
            window.print();
            document.body.innerHTML = originalContent;
            location.reload();
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
