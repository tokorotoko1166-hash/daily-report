
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
// 仕入れ一覧表の描画
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
                    <span>一覧表の印刷</span>
                </button>
                <button class="btn btn-primary" id="btn-list-new-purchase">
                    <i data-lucide="plus"></i>
                    <span>新規仕入れ</span>
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;" class="no-print">
            <div style="background: rgba(59, 130, 246, 0.08); padding: 1rem; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">総仕入れ金額 (表示中)</span>
                <span id="purchase-grand-total" style="font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: bold; color: var(--color-primary);">¥0</span>
            </div>
            <div style="background: rgba(16, 185, 129, 0.08); padding: 1rem; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-success); margin-bottom: 0.25rem;">✅ 照合済の合計 (請求書と一致)</span>
                <span id="purchase-matched-total" style="font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: bold; color: var(--color-success);">¥0</span>
            </div>
            <div style="background: rgba(239, 68, 68, 0.08); padding: 1rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-danger); margin-bottom: 0.25rem;">⚠️ 未照合の合計</span>
                <span id="purchase-unmatched-total" style="font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: bold; color: var(--color-danger);">¥0</span>
            </div>
        </div>

        <!-- 画面表示用の事業部アコーディオンコンテナ -->
        <div id="purchase-departments-container" class="no-print" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
            <!-- ここに事業部ごとのアコーディオンが動的に生成されます -->
        </div>

        <!-- 印刷用エリア -->
        <div class="print-only" id="purchase-list-print-area" style="width: 100%;"></div>
    `;

    const searchInput = document.getElementById('list-purchase-search');
    const startDateInput = document.getElementById('list-purchase-start-date');
    const endDateInput = document.getElementById('list-purchase-end-date');
    const newPurchaseBtn = document.getElementById('btn-list-new-purchase');
    const printBtn = document.getElementById('btn-list-purchase-print');
    
    const updateTable = () => {
        window.currentDeptLimits = {}; // 各事業部の表示件数をリセット
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

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const printArea = document.getElementById('purchase-list-print-area');
            if (printArea) {
                printArea.innerHTML = generatePrintPurchaseTableHtml();
            }
            setTimeout(() => {
                window.print();
                if (printArea) printArea.innerHTML = '';
            }, 300);
        });
    }

    updateTable();
    if (window.lucide) window.lucide.createIcons();
}

function generatePrintPurchaseTableHtml() {
    const searchInput = document.getElementById('list-purchase-search');
    const startDateInput = document.getElementById('list-purchase-start-date');
    const endDateInput = document.getElementById('list-purchase-end-date');

    const filter = {
        search: searchInput ? searchInput.value : '',
        startDate: startDateInput ? startDateInput.value : '',
        endDate: endDateInput ? endDateInput.value : ''
    };

    let purchases = window.PurchaseDB.getAll() || [];
    const sites = window.SiteDB.getAll() || [];
    const siteMap = new Map(sites.map(s => [s.id, s]));

    if (filter.startDate) purchases = purchases.filter(p => p.date >= filter.startDate);
    if (filter.endDate) purchases = purchases.filter(p => p.date <= filter.endDate);
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

    if (purchases.length === 0) {
        return '<p style="text-align:center; padding:2rem; color:#000; font-weight:bold;">表示対象の仕入れデータがありません。</p>';
    }

    // 事業部振り分け
    const getDeptKey = (code) => {
        if (!code) return 'OTHER';
        const prefix = code.slice(0, 2).toUpperCase();
        if (['QK', 'QM', 'QT', 'QS', 'QY'].includes(prefix)) return prefix;
        return 'OTHER';
    };

    const DEPT_INFO = {
        'QK': { name: '仮設事業部', color: '#3b82f6' },
        'QM': { name: '施設住宅事業部', color: '#10b981' },
        'QT': { name: '設備改修事業部', color: '#f59e0b' },
        'QS': { name: '公共事業部', color: '#0ea5e9' },
        'QY': { name: '本部', color: '#8b5cf6' },
        'OTHER': { name: 'その他・不明現場', color: '#6b7280' }
    };

    const deptGroups = { 'QK': [], 'QM': [], 'QT': [], 'QS': [], 'QY': [], 'OTHER': [] };
    
    let grandTotal = 0;
    purchases.forEach(p => {
        grandTotal += (p.quantity || 0) * (p.unitPrice || 0);
        const site = siteMap.get(p.siteId);
        const key = site ? getDeptKey(site.code) : 'OTHER';
        deptGroups[key].push(p);
    });

    let html = `
        <div style="padding: 1.5rem 1rem 0.5rem 1rem; border-bottom: 2px solid #333; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.6rem; font-weight: bold; text-align: center; color: #000; letter-spacing: 0.1em; margin-bottom: 0.5rem;">仕 入 れ 一 覧 表</h2>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #333;">
                <span>出力日: ${new Date().toLocaleDateString('ja-JP')}</span>
                <span>総合計: ¥${Math.round(grandTotal).toLocaleString()}</span>
            </div>
        </div>
    `;

    Object.keys(DEPT_INFO).forEach(key => {
        const list = deptGroups[key];
        if (list.length === 0) return;
        
        list.sort((a, b) => b.date.localeCompare(a.date));
        
        let deptTotal = 0;
        list.forEach(p => deptTotal += (p.quantity || 0) * (p.unitPrice || 0));

        html += `
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.1rem; color: #000; margin-bottom: 0.5rem; border-left: 4px solid ${DEPT_INFO[key].color}; padding-left: 0.5rem;">${DEPT_INFO[key].name} (${list.length}件 / 合計 ¥${Math.round(deptTotal).toLocaleString()})</h3>
                <table class="data-table print-fit-table" style="width: 100%; border-collapse: collapse; border: 1px solid #333; color: #000; font-size: 0.8rem;">
                    <thead>
                        <tr style="background: #e5e7eb; border-bottom: 2px solid #333;">
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 75px;">日付</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 85px;">工事番号</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">現場名称</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: left; width: 60px;">発注者</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">仕入れ先</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: left;">品名・型式</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: center; width: 45px;">伝票</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: right; width: 45px;">数量</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: right; width: 65px;">単価</th>
                            <th style="border: 1px solid #333; padding: 0.4rem; text-align: right; width: 80px;">金額</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        html += list.map(pur => {
            const site = siteMap.get(pur.siteId);
            const total = (pur.quantity || 0) * (pur.unitPrice || 0);
            const slipMark = pur.slipChecked ? '有' : '無';
            return `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="border: 1px solid #333; padding: 0.4rem;">${pur.date.replace(/-/g, '/')}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem;">${site ? site.code : '-'}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem;"><strong>${site ? site.name : '不明'}</strong></td>
                    <td style="border: 1px solid #333; padding: 0.4rem;">${pur.orderedBy || '-'}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem;">${pur.supplier || '-'}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem;">${pur.itemName}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem; text-align: center;">${slipMark}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem; text-align: right;">${pur.quantity || 0}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem; text-align: right;">¥${Math.round(pur.unitPrice).toLocaleString()}</td>
                    <td style="border: 1px solid #333; padding: 0.4rem; text-align: right; font-weight: bold;">¥${Math.round(total).toLocaleString()}</td>
                </tr>
            `;
        }).join('');

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    return html;
}

function refreshPurchaseListTable(filter) {
    const container = document.getElementById('purchase-departments-container');
    if (!container) return;

    let purchases = window.PurchaseDB.getAll() || [];
    const sites = window.SiteDB.getAll() || [];
    const siteMap = new Map(sites.map(s => [s.id, s]));

    if (filter.startDate) purchases = purchases.filter(p => p.date >= filter.startDate);
    if (filter.endDate) purchases = purchases.filter(p => p.date <= filter.endDate);
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

    let grandTotal = 0;
    let matchedTotal = 0;
    let unmatchedTotal = 0;

    purchases.forEach(p => {
        const total = (p.quantity || 0) * (p.unitPrice || 0);
        grandTotal += total;
        if (p.matched) {
            matchedTotal += total;
        } else {
            unmatchedTotal += total;
        }
    });

    const grandTotalEl = document.getElementById('purchase-grand-total');
    const matchedTotalEl = document.getElementById('purchase-matched-total');
    const unmatchedTotalEl = document.getElementById('purchase-unmatched-total');
    
    if (grandTotalEl) grandTotalEl.textContent = `¥${Math.round(grandTotal).toLocaleString()}`;
    if (matchedTotalEl) matchedTotalEl.textContent = `¥${Math.round(matchedTotal).toLocaleString()}`;
    if (unmatchedTotalEl) unmatchedTotalEl.textContent = `¥${Math.round(unmatchedTotal).toLocaleString()}`;

    if (purchases.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 3rem 0; border: 1px dashed var(--border-light); border-radius: 12px;">
                指定された条件に一致する仕入れデータがありません。
            </div>
        `;
        return;
    }

    const getDeptKey = (code) => {
        if (!code) return 'OTHER';
        const prefix = code.slice(0, 2).toUpperCase();
        if (['QK', 'QM', 'QT', 'QS', 'QY'].includes(prefix)) return prefix;
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

    const deptGroups = { 'QK': [], 'QM': [], 'QT': [], 'QS': [], 'QY': [], 'OTHER': [] };
    
    purchases.forEach(p => {
        const site = siteMap.get(p.siteId);
        const key = site ? getDeptKey(site.code) : 'OTHER';
        deptGroups[key].push(p);
    });

    let html = '';
    
    Object.keys(DEPT_INFO).forEach(key => {
        const list = deptGroups[key];
        const info = DEPT_INFO[key];
        
        if ((filter.search || filter.startDate || filter.endDate) && list.length === 0) return;

        list.sort((a, b) => b.date.localeCompare(a.date));
        const count = list.length;
        
        let deptTotal = 0;
        let deptMatched = 0;
        list.forEach(p => {
            const t = (p.quantity || 0) * (p.unitPrice || 0);
            deptTotal += t;
            if (p.matched) deptMatched += t;
        });

        const isDefaultOpen = !!(filter.search || filter.startDate || filter.endDate);
        const displayStyle = isDefaultOpen ? 'block' : 'none';
        const rotateStyle = isDefaultOpen ? 'transform: rotate(180deg);' : '';

        if (!window.currentDeptLimits) window.currentDeptLimits = {};
        if (!window.currentDeptLimits[`pur_${key}`]) window.currentDeptLimits[`pur_${key}`] = 100;
        
        const limit = window.currentDeptLimits[`pur_${key}`];
        const displayed = list.slice(0, limit);

        html += `
            <div class="dept-accordion" data-dept="${key}" style="border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; background: var(--bg-card); box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div class="dept-header pur-dept-header" style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.015); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="display: inline-block; width: 4px; height: 1.35rem; background: ${info.color}; border-radius: 4px;"></span>
                        <strong style="font-size: 1rem; color: var(--text-main);">${info.name} (${key})</strong>
                        <span style="background: rgba(255,255,255,0.06); padding: 0.15rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-family: 'Inter'; color: var(--text-muted); font-weight: 600;">
                            ${count} 件 / 計 ¥${Math.round(deptTotal).toLocaleString()} 
                            <span style="color:var(--color-success); margin-left:0.5rem;">(照合済 ¥${Math.round(deptMatched).toLocaleString()})</span>
                        </span>
                    </div>
                    <i data-lucide="chevron-down" class="accordion-icon" style="width: 1.2rem; height: 1.2rem; color: var(--text-muted); transition: transform 0.2s; ${rotateStyle}"></i>
                </div>
                <div class="dept-content pur-dept-content" style="display: ${displayStyle}; border-top: 1px solid var(--border-light);">
                    <div class="table-responsive" style="margin: 0;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse; margin: 0;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.005);">
                                    <th style="width: 50px; text-align: center; padding: 0.75rem;">照合</th>
                                    <th style="width: 90px; text-align: left; padding: 0.75rem;">日付</th>
                                    <th style="text-align: left; padding: 0.75rem;">現場名称</th>
                                    <th style="width: 70px; text-align: left; padding: 0.75rem;">発注者</th>
                                    <th style="width: 110px; text-align: left; padding: 0.75rem;">仕入れ先</th>
                                    <th style="text-align: left; padding: 0.75rem;">品名・型式</th>
                                    <th style="text-align: right; width: 60px; padding: 0.75rem;">数量</th>
                                    <th style="text-align: right; width: 80px; padding: 0.75rem;">単価</th>
                                    <th style="text-align: right; width: 90px; padding: 0.75rem; font-weight: 600;">金額</th>
                                    <th style="width: 70px; text-align: center; padding: 0.75rem;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        html += displayed.map(pur => {
            const site = siteMap.get(pur.siteId);
            const total = (pur.quantity || 0) * (pur.unitPrice || 0);
            
            const isChecked = pur.matched ? 'checked' : '';
            const rowOpacity = pur.matched ? '0.6' : '1';
            const bgStyle = pur.matched ? 'background: rgba(16, 185, 129, 0.05);' : '';
            
            const slipBadge = pur.slipChecked 
                ? '<span style="display:inline-block; font-size:0.65rem; padding:0.15rem 0.3rem; background:rgba(59,130,246,0.1); color:var(--color-primary); border:1px solid rgba(59,130,246,0.2); border-radius:4px; margin-left:0.25rem;">📄伝票有</span>'
                : '<span style="display:inline-block; font-size:0.65rem; padding:0.15rem 0.3rem; background:rgba(239,68,68,0.1); color:var(--color-danger); border:1px solid rgba(239,68,68,0.2); border-radius:4px; margin-left:0.25rem;">⚠️伝票無</span>';

            return `
                <tr style="border-bottom: 1px solid var(--border-light); opacity: ${rowOpacity}; ${bgStyle}">
                    <td style="text-align: center; padding: 0.6rem 0.75rem;">
                        <input type="checkbox" class="cb-match-purchase" data-id="${pur.id}" ${isChecked} style="width: 1.1rem; height: 1.1rem; cursor: pointer;">
                    </td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 0.8rem; padding: 0.6rem 0.75rem;">${pur.date.replace(/-/g, '/')}</td>
                    <td style="font-family: 'Inter', sans-serif; font-weight: bold; font-size: 0.8rem; padding: 0.6rem 0.75rem;">
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.1rem;">${site ? site.code : '-'}</div>
                        <div>${site ? site.name : '不明な現場'}</div>
                    </td>
                    <td style="font-size: 0.8rem; padding: 0.6rem 0.75rem;">${pur.orderedBy || '-'}</td>
                    <td style="font-size: 0.8rem; padding: 0.6rem 0.75rem;">${pur.supplier || '-'}</td>
                    <td style="font-size: 0.8rem; padding: 0.6rem 0.75rem;">
                        <div>${pur.itemName}</div>
                        <div style="margin-top:0.25rem;">${slipBadge}</div>
                    </td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-align: right; padding: 0.6rem 0.75rem;">${pur.quantity || 0}</td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-align: right; padding: 0.6rem 0.75rem;">¥${Math.round(pur.unitPrice).toLocaleString()}</td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-align: right; padding: 0.6rem 0.75rem; font-weight: 600; color: var(--color-primary);">¥${Math.round(total).toLocaleString()}</td>
                    <td style="text-align: center; padding: 0.6rem 0.75rem;">
                        <div style="display: flex; gap: 0.35rem; justify-content: center;">
                            <button class="btn btn-secondary btn-icon-only btn-pur-edit" data-id="${pur.id}" data-site-id="${pur.siteId}" title="編集" style="width: 1.6rem; height: 1.6rem; padding:0; display: inline-flex; align-items: center; justify-content: center;">
                                <i data-lucide="edit-3" style="width: 0.8rem; height: 0.8rem;"></i>
                            </button>
                            <button class="btn btn-danger btn-icon-only btn-pur-delete" data-id="${pur.id}" data-item="${pur.itemName}" title="削除" style="width: 1.6rem; height: 1.6rem; padding:0; display: inline-flex; align-items: center; justify-content: center;">
                                <i data-lucide="trash-2" style="width: 0.8rem; height: 0.8rem;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        html += `
                            </tbody>
                        </table>
                    </div>
        `;

        if (count > limit) {
            const remain = count - limit;
            html += `
                    <div style="text-align: center; padding: 0.75rem; border-top: 1px solid var(--border-light); background: rgba(255,255,255,0.01);">
                        <button class="btn btn-secondary btn-pur-load-more" data-dept="${key}" style="font-size: 0.8rem; padding: 0.4rem 1.5rem;">
                            さらに ${Math.min(remain, 100)} 件を表示 (残り ${remain} 件)
                        </button>
                    </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // アコーディオン開閉イベント
    container.querySelectorAll('.pur-dept-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');
            if (content.style.display === 'none' || !content.style.display) {
                content.style.display = 'block';
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                content.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Load More イベント
    container.querySelectorAll('.btn-pur-load-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = btn.getAttribute('data-dept');
            window.currentDeptLimits[`pur_${key}`] += 100;
            refreshPurchaseListTable(filter);
        });
    });

    // 照合済チェックボックスイベント
    container.querySelectorAll('.cb-match-purchase').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = cb.getAttribute('data-id');
            const isMatched = cb.checked;
            
            const pur = window.PurchaseDB.getById(id);
            if (pur) {
                pur.matched = isMatched;
                window.PurchaseDB.update(id, pur);
                // 再描画して集計を更新する
                refreshPurchaseListTable(filter);
            }
        });
    });

    // 編集・削除イベント
    container.querySelectorAll('.btn-pur-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const siteId = btn.getAttribute('data-site-id');
            openPurchaseModal(siteId, id, () => refreshPurchaseListTable(filter));
        });
    });

    container.querySelectorAll('.btn-pur-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
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

