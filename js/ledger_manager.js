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

/**
 * 簡易ルーター
 */
function router() {
    const hash = window.location.hash || '#ledger';
    const container = document.getElementById('view-container');
    const pageTitle = document.getElementById('page-title');
    const headerNav = document.getElementById('header-nav');
    
    // モバイル表示時のメニューの自動非表示
    if (headerNav) {
        headerNav.classList.remove('open');
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
    
    window.location.hash = '#ledger';
}

// ==========================================================================
// 1. ダッシュボード画面の制御
// ==========================================================================

function renderDashboard(container) {
    const stats = window.StatsDB.getSummary();
    
    container.innerHTML = `
        <div class="stats-grid">
            <div class="card stat-card">
                <div class="stat-info">
                    <h3>進行中の現場</h3>
                    <div class="stat-value">${stats.activeSitesCount} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">件</span></div>
                </div>
                <div class="stat-icon-wrapper primary">
                    <i data-lucide="building"></i>
                </div>
            </div>
            
            <div class="card stat-card">
                <div class="stat-info">
                    <h3>今月の日報提出</h3>
                    <div class="stat-value">${stats.monthlyReportsCount} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">枚</span></div>
                </div>
                <div class="stat-icon-wrapper success">
                    <i data-lucide="file-check"></i>
                </div>
            </div>
            
            <div class="card stat-card">
                <div class="stat-info">
                    <h3>今月の材料仕入れ額</h3>
                    <div class="stat-value" style="font-size: 1.45rem; color: var(--color-primary); font-weight: 700;">
                        ¥${stats.monthlyPurchasesSum.toLocaleString()}
                    </div>
                </div>
                <div class="stat-icon-wrapper info">
                    <i data-lucide="shopping-cart"></i>
                </div>
            </div>
            
            <div class="card stat-card">
                <div class="stat-info">
                    <h3>本日の総稼働人数</h3>
                    <div class="stat-value">${stats.todayWorkersCount} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">名</span></div>
                </div>
                <div class="stat-icon-wrapper warning">
                    <i data-lucide="users"></i>
                </div>
            </div>
        </div>

        <div class="dashboard-layout">
            <div class="card chart-card">
                <div class="card-title">
                    <i data-lucide="bar-chart-3"></i>
                    <span>現場別 累計人工 (名) ＆ 材料仕入れ額 (万円) の対比</span>
                </div>
                <div style="position: relative; height: 320px; width: 100%;">
                    <canvas id="dashboard-chart"></canvas>
                </div>
            </div>
            
            <div class="card activity-card">
                <div class="card-title">
                    <i data-lucide="history"></i>
                    <span>最近のアクティビティ</span>
                </div>
                <ul class="activity-list">
                    ${stats.recentActivities.length === 0 
                        ? `<li class="activity-item" style="color: var(--text-muted); text-align: center; padding: 2rem 0;">履歴はありません</li>`
                        : stats.recentActivities.map(act => `
                            <li class="activity-item">
                                <div class="activity-meta">
                                    <span>${act.title}</span>
                                    <span>${formatRelativeTime(act.time)}</span>
                                </div>
                                <div class="activity-desc">${act.detail}</div>
                            </li>
                        `).join('')
                    }
                </ul>
            </div>
        </div>
    `;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    renderChart(stats.siteChartData);
}

function renderChart(chartData) {
    const ctx = document.getElementById('dashboard-chart');
    if (!ctx) return;
    
    const labels = chartData.map(d => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name);
    const manpowerData = chartData.map(d => d.manpower);
    const purchasesData = chartData.map(d => parseFloat((d.purchases / 10000).toFixed(2)));
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
    
    if (window.myDashboardChart) {
        window.myDashboardChart.destroy();
    }
    
    window.myDashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '累計人工 (名)',
                    data: manpowerData,
                    backgroundColor: 'rgba(59, 130, 246, 0.65)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'yManpower',
                    order: 2
                },
                {
                    label: '仕入れ総額 (万円)',
                    data: purchasesData,
                    type: 'line',
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                    tension: 0.35,
                    yAxisID: 'yPurchases',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor,
                        font: { family: 'Noto Sans JP, sans-serif' }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return chartData[context[0].dataIndex].name;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.datasetIndex === 0) {
                                label += context.parsed.y + ' 名';
                            } else {
                                const originalY = chartData[context.dataIndex].purchases;
                                label += context.parsed.y + ' 万円 (¥' + originalY.toLocaleString() + ')';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                yManpower: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: gridColor },
                    ticks: { color: textColor, stepSize: 2 },
                    title: { display: true, text: '累計人工 (名)', color: textColor }
                },
                yPurchases: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: textColor },
                    title: { display: true, text: '仕入れ総額 (万円)', color: textColor }
                }
            }
        }
    });
}

function formatRelativeTime(isoString) {
    const date = new Date(isoString);
    const now = new Date('2026-06-27T17:03:56+09:00');
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMin < 1) return 'たった今';
    if (diffMin < 60) return `${diffMin}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ==========================================================================
// 1.5 現場一覧表（Site List）の制御
// ==========================================================================

function renderSiteListTable(container) {
    container.innerHTML = `
        <div class="toolbar no-print">
            <div class="search-filter-group">
                <div class="input-search-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" id="list-site-search" class="input-search" placeholder="現場名、工事番号、受注先、住所、担当者で検索...">
                </div>
                <div style="width: 150px;">
                    <select id="list-site-status-filter">
                        <option value="all">すべてのステータス</option>
                        <option value="active">進行中</option>
                        <option value="planning">計画中</option>
                        <option value="completed">完了</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-success" id="btn-print-site-list">
                    <i data-lucide="printer"></i>
                    <span>一覧表の印刷</span>
                </button>
                <button class="btn btn-primary" id="btn-list-new-site">
                    <i data-lucide="plus"></i>
                    <span>新規現場登録</span>
                </button>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px;">
            <!-- 印刷時のヘッダー表示用 -->
            <div class="print-only" style="padding: 1.5rem 1rem 0.5rem 1rem; border-bottom: 2px solid #333; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.6rem; font-weight: bold; text-align: center; color: #000; letter-spacing: 0.1em; margin-bottom: 0.5rem;">現 場 一 覧 表</h2>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #333;">
                    <span>出力日: 2026年6月27日(土)</span>
                    <span>管理者: 宛</span>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="data-table print-fit-table">
                    <thead>
                        <tr>
                            <th style="width: 100px;">工事番号</th>
                            <th>現場名称</th>
                            <th>受注先 (元請/顧客)</th>
                            <th>受注先担当者</th>
                            <th>見積り番号</th>
                            <th style="width: 70px; text-align: center;">請求</th>
                            <th style="width: 70px; text-align: center;">入金</th>
                            <th>工期 (開始〜終了)</th>
                            <th>担当者</th>
                            <th>現場住所</th>
                            <th style="width: 100px; text-align: center;" class="no-print">操作</th>
                        </tr>
                    </thead>
                    <tbody id="site-list-table-body">
                        <!-- 各行がインサートされます -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    const searchInput = document.getElementById('list-site-search');
    const statusFilter = document.getElementById('list-site-status-filter');
    const newSiteBtn = document.getElementById('btn-list-new-site');
    const printBtn = document.getElementById('btn-print-site-list');
    
    const updateTable = () => {
        const filter = {
            search: searchInput.value,
            status: statusFilter.value
        };
        refreshSiteListTable(filter);
    };
    
    searchInput.addEventListener('input', updateTable);
    statusFilter.addEventListener('change', updateTable);
    newSiteBtn.addEventListener('click', () => {
        openSiteModal(null, updateTable);
    });
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    updateTable();
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function refreshSiteListTable(filter) {
    const tbody = document.getElementById('site-list-table-body');
    if (!tbody) return;
    
    const sites = window.SiteDB.getAll(filter);
    
    if (sites.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
                    現場情報がありません
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sites.map(site => {
        const dateRange = (site.startDate || site.endDate) 
            ? `${site.startDate ? site.startDate.replace(/-/g, '/') : ''} 〜 ${site.endDate ? site.endDate.replace(/-/g, '/') : ''}`
            : '-';
            
        return `
            <tr>
                <td style="font-family: 'Inter', sans-serif; font-weight: bold;">${site.code || '-'}</td>
                <td><strong>${site.name}</strong></td>
                <td>${site.client || '-'}</td>
                <td>${site.clientManager || '-'}</td>
                <td style="font-family: 'Inter', sans-serif; font-size: 0.9rem;">${site.estimateCode || '-'}</td>
                <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" class="site-billing-check no-print" data-id="${site.id}" ${site.isBilled ? 'checked' : ''} style="width: 1.1rem; height: 1.1rem; cursor: pointer; vertical-align: middle;">
                    <span class="print-only" style="font-size: 8.5pt;">${site.isBilled ? '済' : '未'}</span>
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" class="site-payment-check no-print" data-id="${site.id}" ${site.isPaid ? 'checked' : ''} style="width: 1.1rem; height: 1.1rem; cursor: pointer; vertical-align: middle;">
                    <span class="print-only" style="font-size: 8.5pt;">${site.isPaid ? '済' : '未'}</span>
                </td>
                <td style="font-size: 0.8rem; font-family: 'Inter', sans-serif;">${dateRange}</td>
                <td>${site.manager || '-'}</td>
                <td style="font-size: 0.85rem;">${site.address || '-'}</td>
                <td class="no-print">
                    <div class="table-actions" style="justify-content: center;">
                        <button class="btn btn-secondary btn-icon-only btn-list-edit" data-id="${site.id}" title="編集" style="width: 1.8rem; height: 1.8rem; padding:0;">
                            <i data-lucide="edit-3" style="width: 0.85rem; height: 0.85rem;"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only btn-list-delete" data-id="${site.id}" data-name="${site.name}" title="削除" style="width: 1.8rem; height: 1.8rem; padding:0;">
                            <i data-lucide="trash-2" style="width: 0.85rem; height: 0.85rem;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.querySelectorAll('.btn-list-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openSiteModal(id, () => refreshSiteListTable(filter));
        });
    });
    
    tbody.querySelectorAll('.btn-list-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            if (confirm(`現場「${name}」を削除してもよろしいですか？`)) {
                window.SiteDB.delete(id);
                window.app.showToast('現場を削除しました', 'success');
                refreshSiteListTable(filter);
            }
        });
    });

    // 請求・入金チェックボックスのリアルタイム変更検知
    tbody.querySelectorAll('.site-billing-check').forEach(chk => {
        chk.addEventListener('change', () => {
            const id = chk.getAttribute('data-id');
            const site = window.SiteDB.getById(id);
            if (site) {
                site.isBilled = chk.checked;
                window.SiteDB.update(id, site);
                window.app.showToast('請求状況を更新しました', 'success');
            }
        });
    });

    tbody.querySelectorAll('.site-payment-check').forEach(chk => {
        chk.addEventListener('change', () => {
            const id = chk.getAttribute('data-id');
            const site = window.SiteDB.getById(id);
            if (site) {
                site.isPaid = chk.checked;
                window.SiteDB.update(id, site);
                window.app.showToast('入金状況を更新しました', 'success');
            }
        });
    });
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ==========================================================================
// 1.6 仕入れ一覧（Purchase List）の制御
// ==========================================================================

function renderPurchaseListTable(container) {
    container.innerHTML = `
        <div class="toolbar no-print" style="flex-wrap: wrap; gap: 0.75rem;">
            <div class="search-filter-group" style="flex-wrap: wrap; gap: 0.75rem; flex: 1;">
                <div class="input-search-wrapper" style="min-width: 250px; flex: 1;">
                    <i data-lucide="search"></i>
                    <input type="text" id="list-purchase-search" class="input-search" placeholder="商品名、仕入れ先、担当者、工事番号で検索...">
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">期間:</span>
                    <input type="date" id="list-purchase-start-date" class="form-control" style="width: 135px; padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">〜</span>
                    <input type="date" id="list-purchase-end-date" class="form-control" style="width: 135px; padding: 0.4rem; border-radius: 6px; font-size: 0.85rem;">
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-success" id="btn-print-purchase-list">
                    <i data-lucide="printer"></i>
                    <span>一覧表の印刷</span>
                </button>
                <button class="btn btn-primary" id="btn-list-new-purchase">
                    <i data-lucide="plus"></i>
                    <span>新規仕入れ登録</span>
                </button>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px;">
            <!-- 印刷時のヘッダー表示用 -->
            <div class="print-only" style="padding: 1.5rem 1rem 0.5rem 1rem; border-bottom: 2px solid #333; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.6rem; font-weight: bold; text-align: center; color: #000; letter-spacing: 0.1em; margin-bottom: 0.5rem;">仕 入 れ 一 覧 表</h2>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #333;">
                    <span>出力日: 2026年6月27日(土)</span>
                    <span>管理者: 宛</span>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="data-table print-fit-table">
                    <thead>
                        <tr>
                            <th style="width: 100px;">日付</th>
                            <th style="width: 100px;">工事番号</th>
                            <th>現場名称</th>
                            <th>発注担当者</th>
                            <th>仕入れ先</th>
                            <th>商品名 (品番・型式)</th>
                            <th style="text-align: right; width: 70px;">数量</th>
                            <th style="text-align: right; width: 100px;">単価</th>
                            <th style="text-align: right; width: 120px; padding-right: 1.5rem;">合計金額</th>
                            <th style="text-align: right; width: 100px;">定価</th>
                            <th style="text-align: right; width: 70px;">掛率</th>
                            <th style="width: 100px; text-align: center;" class="no-print">操作</th>
                        </tr>
                    </thead>
                    <tbody id="purchase-list-table-body">
                        <!-- 各行がインサートされます -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    const searchInput = document.getElementById('list-purchase-search');
    const startDateInput = document.getElementById('list-purchase-start-date');
    const endDateInput = document.getElementById('list-purchase-end-date');
    const newPurchaseBtn = document.getElementById('btn-list-new-purchase');
    const printBtn = document.getElementById('btn-print-purchase-list');
    
    const updateTable = () => {
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
        window.print();
    });
    
    updateTable();
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function refreshPurchaseListTable(filter) {
    const tbody = document.getElementById('purchase-list-table-body');
    if (!tbody) return;
    
    // 全仕入れデータを取得
    let purchases = window.PurchaseDB.getAll() || [];
    const sites = window.SiteDB.getAll() || [];
    
    // フィルタリング処理
    if (filter.startDate) {
        purchases = purchases.filter(p => p.date >= filter.startDate);
    }
    if (filter.endDate) {
        purchases = purchases.filter(p => p.date <= filter.endDate);
    }
    if (filter.search) {
        const query = filter.search.toLowerCase();
        purchases = purchases.filter(p => {
            const site = sites.find(s => s.id === p.siteId);
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
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
                    仕入れデータがありません
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = purchases.map(pur => {
        const site = sites.find(s => s.id === pur.siteId);
        const siteCode = site ? site.code : '-';
        const siteName = site ? site.name : '不明な現場';
        const formattedDate = pur.date ? pur.date.replace(/-/g, '/') : '-';
        const displayMultiplier = pur.multiplier ? (pur.multiplier * 100).toFixed(0) + '%' : '-';
        
        return `
            <tr>
                <td style="font-family: 'Inter', sans-serif; font-size: 0.85rem;">${formattedDate}</td>
                <td style="font-family: 'Inter', sans-serif; font-weight: bold;">${siteCode}</td>
                <td style="font-size: 0.85rem;"><strong>${siteName}</strong></td>
                <td>${pur.orderedBy || '-'}</td>
                <td>${pur.supplier || '-'}</td>
                <td style="font-size: 0.85rem;">${pur.itemName}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right;">${pur.quantity || 0}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right;">${pur.unitPrice ? '¥' + pur.unitPrice.toLocaleString() : '-'}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right; padding-right: 1.5rem; font-weight: 500;">
                    ¥${(pur.totalPrice || 0).toLocaleString()}
                </td>
                <td style="font-family: 'Inter', sans-serif; text-align: right;">${pur.listPrice ? '¥' + pur.listPrice.toLocaleString() : '-'}</td>
                <td style="font-family: 'Inter', sans-serif; text-align: right;">${displayMultiplier}</td>

                <td class="no-print">
                    <div class="table-actions" style="justify-content: center;">
                        <button class="btn btn-secondary btn-icon-only btn-pur-edit" data-id="${pur.id}" data-site-id="${pur.siteId}" title="編集" style="width: 1.8rem; height: 1.8rem; padding:0;">
                            <i data-lucide="edit-3" style="width: 0.85rem; height: 0.85rem;"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only btn-pur-delete" data-id="${pur.id}" data-item="${pur.itemName}" title="削除" style="width: 1.8rem; height: 1.8rem; padding:0;">
                            <i data-lucide="trash-2" style="width: 0.85rem; height: 0.85rem;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.querySelectorAll('.btn-pur-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const siteId = btn.getAttribute('data-site-id');
            openPurchaseModal(siteId, id, () => refreshPurchaseListTable(filter));
        });
    });
    
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

// ==========================================================================
// 2. 現場台帳一覧の制御
// ==========================================================================

function renderLedgerList(container) {
    container.innerHTML = `
        <div class="toolbar">
            <div class="search-filter-group">
                <div class="input-search-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" id="site-search" class="input-search" placeholder="現場名、工事番号、受注先で検索...">
                </div>
                <div style="width: 150px;">
                    <select id="site-status-filter">
                        <option value="all">すべてのステータス</option>
                        <option value="active">進行中</option>
                        <option value="planning">計画中</option>
                        <option value="completed">完了</option>
                    </select>
                </div>
            </div>
            
            <button class="btn btn-primary" id="btn-new-site">
                <i data-lucide="plus"></i>
                <span>新規現場登録</span>
            </button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>工事番号</th>
                            <th>現場名称</th>
                            <th>受注先 (元請/顧客)</th>
                            <th>作業開始</th>
                            <th>作業終了</th>
                            <th>休憩時間</th>
                            <th>就労時間</th>
                            <th>担当者</th>
                            <th style="width: 120px; text-align: center;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="site-table-body">
                        <!-- 動的インサート -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    const searchInput = document.getElementById('site-search');
    const statusFilter = document.getElementById('site-status-filter');
    const newSiteBtn = document.getElementById('btn-new-site');
    
    const updateTable = () => {
        const filter = {
            search: searchInput.value,
            status: statusFilter.value
        };
        refreshSiteTable(filter);
    };
    
    searchInput.addEventListener('input', updateTable);
    statusFilter.addEventListener('change', updateTable);
    newSiteBtn.addEventListener('click', () => openSiteModal());
    
    updateTable();
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function refreshSiteTable(filter) {
    const tbody = document.getElementById('site-table-body');
    if (!tbody) return;
    
    const sites = window.SiteDB.getAll(filter);
    
    if (sites.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
                    該当する現場が見つかりません
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = sites.map(site => {
        const reports = window.ReportDB.getBySiteId(site.id);
        const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
        
        let startTime = '-';
        let endTime = '-';
        let breakTime = '-';
        let workHoursText = '-';
        if (latestReport) {
            startTime = latestReport.startTime || '-';
            endTime = latestReport.endTime || '-';
            if (latestReport.startTime && latestReport.endTime) {
                if (latestReport.startTime <= '12:00' && latestReport.endTime >= '13:00') {
                    breakTime = '12:00〜13:00';
                }
                
                // 実就労時間の計算
                const [startH, startM] = latestReport.startTime.split(':').map(Number);
                const [endH, endM] = latestReport.endTime.split(':').map(Number);
                const startMin = startH * 60 + startM;
                const endMin = endH * 60 + endM;
                let diffMin = endMin - startMin;
                
                if (breakTime !== '-') {
                    diffMin -= 60; // 休憩1時間を差し引く
                }
                
                if (diffMin > 0) {
                    const hours = diffMin / 60;
                    workHoursText = hours % 1 === 0 ? `${hours}時間` : `${hours.toFixed(1)}時間`;
                }
            }
        }
        
        const purchases = window.PurchaseDB.getBySiteId(site.id);
        const totalPurchasesPrice = purchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
        
        return `
            <tr>
                <td style="font-family: 'Inter', sans-serif; font-weight: 600;">${site.code || '-'}</td>
                <td><strong>${site.name}</strong></td>
                <td>${site.client || '-'}</td>
                <td style="font-family: 'Inter', sans-serif;">${startTime}</td>
                <td style="font-family: 'Inter', sans-serif;">${endTime}</td>
                <td style="font-family: 'Inter', sans-serif;">${breakTime}</td>
                <td style="font-family: 'Inter', sans-serif; font-weight: 500; color: var(--color-success);">${workHoursText}</td>
                <td>${site.manager || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-icon-only btn-view-site" data-id="${site.id}" title="集計・詳細を開く">
                            <i data-lucide="eye" style="width: 1rem; height: 1rem;"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon-only btn-edit-site" data-id="${site.id}" title="基本情報編集">
                            <i data-lucide="edit-3" style="width: 1rem; height: 1rem;"></i>
                        </button>
                        <button class="btn btn-danger btn-icon-only btn-delete-site" data-id="${site.id}" data-name="${site.name}" title="現場削除">
                            <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.querySelectorAll('.btn-view-site').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            window.location.hash = `#ledger/detail/${id}`;
        });
    });
    
    tbody.querySelectorAll('.btn-edit-site').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openSiteModal(id);
        });
    });
    
    tbody.querySelectorAll('.btn-delete-site').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            if (confirm(`現場「${name}」を削除してもよろしいですか？\n※関連する材料仕入れデータもすべて削除されます。`)) {
                window.SiteDB.delete(id);
                window.app.showToast('現場および関連仕入れデータを削除しました', 'success');
                // クラウドと同期
                if (window.CloudSync && window.CloudSync.isEnabled()) {
                    syncSitesToCloud();
                }
                refreshSiteTable(filter);
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
        return count;
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
        const btnPurchases = document.getElementById('tab-btn-purchases');
        const btnInfo = document.getElementById('tab-btn-info');
        
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
                        <option value="active" ${!site || site.status === 'active' ? 'selected' : ''}>進行中</option>
                        <option value="completed" ${site && site.status === 'completed' ? 'selected' : ''}>完了</option>
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
        
        // クラウド同期
        if (window.CloudSync && window.CloudSync.isEnabled()) {
            syncSitesToCloud();
        }
        
        closeModal();
        if (callback) {
            callback();
        } else {
            const searchInput = document.getElementById('site-search');
            if (searchInput) {
                refreshSiteTable({
                    search: searchInput.value,
                    status: document.getElementById('site-status-filter').value
                });
            }
        }
    });
}

function openPurchaseModal(siteId, purchaseId = null, callback = null) {
    const isEdit = purchaseId !== null;
    const pur = isEdit ? window.PurchaseDB.getById(purchaseId) : null;
    
    // siteId が null で編集の場合は、pur から siteId を復元
    const targetSiteId = siteId || (pur ? pur.siteId : null);
    
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = isEdit ? '仕入れデータの編集' : '材料仕入れの手入力';
    
    const sites = window.SiteDB.getAll() || [];
    
    // 対象現場の入力グループHTMLの決定
    let siteSelectorHTML = '';
    if (targetSiteId) {
        // 現場が特定されている場合は隠し要素
        siteSelectorHTML = `<input type="hidden" id="form-pur-site" value="${targetSiteId}">`;
    } else {
        // 現場が特定されていない場合はセレクトボックス
        siteSelectorHTML = `
            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="form-pur-site">対象現場 <span style="color: var(--color-danger);">*</span></label>
                <select id="form-pur-site" required style="padding: 0.65rem; border-radius: 8px; font-size: 0.9rem;">
                    <option value="">現場を選択してください</option>
                    ${sites.map(s => `<option value="${s.id}">[${s.code}] ${s.name}</option>`).join('')}
                </select>
            </div>
        `;
    }
    
    body.innerHTML = `
        <form id="purchase-form">
            ${siteSelectorHTML}
            
            <div class="form-row">
                <div class="form-group">
                    <label for="form-pur-date">入荷月日 <span style="color: var(--color-danger);">*</span></label>
                    <input type="date" id="form-pur-date" required value="${pur ? pur.date : '2026-06-27'}">
                </div>
                <div class="form-group">
                    <label for="form-pur-buyer">発注担当者</label>
                    <input type="text" id="form-pur-buyer" value="${pur ? pur.orderedBy || '' : '佐藤 健太'}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="form-pur-supplier">仕入れ先</label>
                    <input type="text" id="form-pur-supplier" value="${pur ? pur.supplier || '' : ''}" placeholder="例: ○○資材店">
                </div>
                <div class="form-group">
                    <label for="form-pur-maker">メーカー</label>
                    <input type="text" id="form-pur-maker" value="${pur ? pur.maker || '' : ''}">
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="form-pur-item">仕入れ材料（品名・型式） <span style="color: var(--color-danger);">*</span></label>
                <input type="text" id="form-pur-item" required value="${pur ? pur.itemName || '' : ''}">
            </div>
            
            <div class="form-row" style="grid-template-columns: 1.5fr 1fr 1fr;">
                <div class="form-group">
                    <label for="form-pur-qty">数量 <span style="color: var(--color-danger);">*</span></label>
                    <input type="number" id="form-pur-qty" step="0.01" min="0" required value="${pur ? pur.quantity : ''}">
                </div>
                <div class="form-group">
                    <label for="form-pur-unit">単位 <span style="color: var(--color-danger);">*</span></label>
                    <input type="text" id="form-pur-unit" required value="${pur ? pur.unit : '個'}">
                </div>
                <div class="form-group" style="display:flex; align-items:center; height: 100%; padding-top: 1.25rem;">
                    <label style="display:inline-flex; align-items:center; gap:0.4rem; cursor:pointer; font-weight:600;">
                        <input type="checkbox" id="form-pur-slip" style="width: 1.2rem; height: 1.2rem;" ${pur && pur.slipChecked ? 'checked' : ''}>
                        <span>伝票チェック済</span>
                    </label>
                </div>
            </div>
            
            <div class="form-row" style="grid-template-columns: 1.2fr 1fr 0.8fr;">
                <div class="form-group">
                    <label for="form-pur-uprice">仕入れ単価 (円) <span style="color: var(--color-danger);">*</span></label>
                    <input type="number" id="form-pur-uprice" min="0" required value="${pur ? pur.unitPrice : ''}">
                </div>
                <div class="form-group">
                    <label for="form-pur-lprice">定価 (円)</label>
                    <input type="number" id="form-pur-lprice" min="0" value="${pur ? pur.listPrice || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="form-pur-mult">掛率</label>
                    <input type="number" id="form-pur-mult" step="0.01" min="0" max="10" placeholder="0.65" value="${pur ? pur.multiplier : ''}">
                </div>
            </div>
            
            <div class="form-row" style="background: rgba(59, 130, 246, 0.05); padding: 0.85rem; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.15); margin-bottom: 1.5rem; font-size: 0.9rem;">
                <div>
                    <strong>合計仕入れ金額 (自動):</strong> 
                    <span id="live-total-price" style="font-family:'Inter'; font-weight:bold; color:var(--color-primary); font-size: 1.05rem;">
                        ${pur ? '¥' + pur.totalPrice.toLocaleString() : '¥0'}
                    </span>
                </div>
                <div>
                    <strong>掛け率 (自動):</strong> 
                    <span id="live-multiplier" style="font-family:'Inter'; font-weight:bold; color:var(--color-success); font-size: 1.05rem;">
                        ${pur && pur.listPrice ? (pur.multiplier * 100).toFixed(0) + '%' : '-'}
                    </span>
                </div>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="btn-pur-cancel">キャンセル</button>
                <button type="submit" class="btn btn-primary">仕入れデータを登録</button>
            </div>
        </form>
    `;
    
    backdrop.classList.add('open');
    const form = document.getElementById('purchase-form');
    const qtyInput = document.getElementById('form-pur-qty');
    const uPriceInput = document.getElementById('form-pur-uprice');
    const lPriceInput = document.getElementById('form-pur-lprice');
    const multInput = document.getElementById('form-pur-mult');
    const slipCheck = document.getElementById('form-pur-slip');
    const liveTotal = document.getElementById('live-total-price');
    const liveMult = document.getElementById('live-multiplier');
    
    // 双方向連動計算
    const onUPriceOrQtyChange = () => {
        const qty = parseFloat(qtyInput.value) || 0;
        const uprice = parseFloat(uPriceInput.value) || 0;
        const lprice = parseFloat(lPriceInput.value) || 0;
        
        // 合計金額の更新
        const total = qty * uprice;
        liveTotal.textContent = `¥${Math.round(total).toLocaleString()}`;
        
        // 掛率の自動更新
        if (lprice > 0) {
            const mult = uprice / lprice;
            multInput.value = mult.toFixed(2);
            liveMult.textContent = `${(mult * 100).toFixed(0)}%`;
        } else {
            liveMult.textContent = '-';
        }
    };
    
    const onListPriceOrMultChange = () => {
        const lprice = parseFloat(lPriceInput.value) || 0;
        const mult = parseFloat(multInput.value) || 0;
        
        // 定価と掛率がある場合、単価を自動決定
        if (lprice > 0 && mult > 0) {
            const uprice = Math.round(lprice * mult);
            uPriceInput.value = uprice;
        }
        
        // 合計金額の再計算
        const qty = parseFloat(qtyInput.value) || 0;
        const uprice = parseFloat(uPriceInput.value) || 0;
        const total = qty * uprice;
        liveTotal.textContent = `¥${Math.round(total).toLocaleString()}`;
        
        if (lprice > 0) {
            const displayMult = parseFloat((uprice / lprice).toFixed(4));
            liveMult.textContent = `${(displayMult * 100).toFixed(0)}%`;
        } else {
            liveMult.textContent = '-';
        }
    };
    
    qtyInput.addEventListener('input', onUPriceOrQtyChange);
    uPriceInput.addEventListener('input', onUPriceOrQtyChange);
    
    lPriceInput.addEventListener('input', onListPriceOrMultChange);
    multInput.addEventListener('input', onListPriceOrMultChange);
    
    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-pur-cancel').addEventListener('click', closeModal);
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedSiteId = document.getElementById('form-pur-site').value;
        if (!selectedSiteId) {
            window.app.showToast('対象現場を選択してください', 'error');
            return;
        }
        
        const purchaseData = {
            siteId: selectedSiteId,
            date: document.getElementById('form-pur-date').value,
            orderedBy: document.getElementById('form-pur-buyer').value.trim(),
            supplier: document.getElementById('form-pur-supplier').value.trim(),
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
        
        closeModal();
        if (callback) callback();
    });
}

function openReportPreviewModal(reportId) {
    const report = window.ReportDB.getById(reportId);
    if (!report) return;
    
    const site = window.SiteDB.getById(report.siteId);
    const siteName = site ? site.name : '不明な現場';
    const siteCode = site ? site.code : '-';
    const clientName = site ? site.client : '-';
    
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = '作業日報 プレビュー';
    
    body.innerHTML = `
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;" class="no-print">
            <button class="btn btn-success" id="modal-btn-print">
                <i data-lucide="printer"></i>
                <span>印刷・PDF出力</span>
            </button>
        </div>
        
        <div class="report-preview-container" style="padding: 1.5rem; max-width: 100%;">
            <div class="report-header" style="margin-bottom:1rem;">
                <div style="font-size: 0.8rem; color: var(--text-muted); float: right;">作成日: ${report.date.replace(/-/g, '/')}</div>
                <div class="report-title-jp" style="font-size:1.5rem;">業 務 日 報</div>
                <div style="clear: both;"></div>
            </div>
            
            <table class="report-meta-table" style="margin-bottom: 1rem;">
                <tr>
                    <th style="width:30%;">工事番号</th>
                    <td style="font-family:'Inter'; font-weight:bold;">${siteCode}</td>
                </tr>
                <tr>
                    <th>現場名称</th>
                    <td><strong>${siteName}</strong></td>
                </tr>
                <tr>
                    <th>受注先 (元請)</th>
                    <td>${clientName}</td>
                </tr>
                <tr>
                    <th>天候 / 記入者</th>
                    <td>${report.weather || '晴れ'} / ${report.writer || '-'}</td>
                </tr>
            </table>
            
            <div class="report-section" style="margin-bottom:1rem;">
                <h4 class="report-section-title" style="font-size:0.9rem;">本日の時間記録</h4>
                <table class="report-grid-table" style="font-size:0.8rem;">
                    <thead>
                        <tr>
                            <th>区分</th>
                            <th>時間</th>
                            <th>備考</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>出発時間</strong></td>
                            <td style="font-family:'Inter';">${report.isDirectGo ? '直行' : (report.departureTime || '--:--')}</td>
                            <td>${report.isDirectGo ? '現場へ直行' : '事務所出発'}</td>
                        </tr>
                        <tr>
                            <td><strong>作業開始</strong></td>
                            <td style="font-family:'Inter';">${report.startTime || '--:--'}</td>
                            <td>施工開始</td>
                        </tr>
                        <tr>
                            <td><strong>作業終了</strong></td>
                            <td style="font-family:'Inter';">${report.endTime || '--:--'}</td>
                            <td>施工終了</td>
                        </tr>
                        <tr>
                            <td><strong>帰社時間</strong></td>
                            <td style="font-family:'Inter';">${report.isDirectBack ? '直帰' : (report.returnTime || '--:--')}</td>
                            <td>${report.isDirectBack ? '現場から直帰' : '事務所帰社'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="report-section" style="margin-bottom:1rem;">
                <h4 class="report-section-title" style="font-size:0.9rem;">本日の作業内容</h4>
                <div class="report-content-box" style="white-space:pre-wrap; font-size:0.85rem; min-height:80px; padding:0.75rem;">${report.workContent || '特になし'}</div>
            </div>
            
            <div class="report-section" style="margin-bottom:0;">
                <h4 class="report-section-title" style="font-size:0.9rem;">同行者</h4>
                <div class="report-content-box" style="font-size:0.85rem; padding:0.75rem;">${report.companions || 'なし'}</div>
            </div>
        </div>
    `;
    
    backdrop.classList.add('open');
    document.getElementById('modal-btn-print').addEventListener('click', () => {
        window.print();
    });
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ==========================================================================
// 5. テーマとアプリケーション初期化
// ==========================================================================

function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeText = themeToggleBtn.querySelector('.theme-text');
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeText.textContent = savedTheme === 'dark' ? 'ライトモード' : 'ダークモード';
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        themeText.textContent = nextTheme === 'dark' ? 'ライトモード' : 'ダークモード';
        
        window.app.showToast(`${nextTheme === 'dark' ? 'ダークモード' : 'ライトモード'}に変更しました`, 'info');
        
        if (window.location.hash === '#dashboard' || window.location.hash === '') {
            router();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    window.initDatabase();
    
    // クラウド中継の初期化
    if (window.CloudSync && window.CloudSync.init()) {
        console.log('Cloud middle post connected.');
    }
    
    const headerDate = document.getElementById('header-date');
    if (headerDate) {
        headerDate.textContent = '2026年6月27日(土)';
    }
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const headerNav = document.getElementById('header-nav');
    if (mobileMenuBtn && headerNav) {
        mobileMenuBtn.addEventListener('click', () => {
            headerNav.classList.toggle('open');
        });
    }
    
    const cloudSyncBtn = document.getElementById('btn-cloud-sync');
    const cloudConfigBtn = document.getElementById('btn-cloud-config');
    if (cloudSyncBtn) {
        cloudSyncBtn.addEventListener('click', syncReportsFromCloud);
    }
    if (cloudConfigBtn) {
        cloudConfigBtn.addEventListener('click', () => openCloudSettingsModal());
    }
    
    initTheme();
    
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
    
    // モーダルの閉じるボタン紐付け
    document.getElementById('modal-close-btn').addEventListener('click', () => {
        document.getElementById('modal-backdrop').classList.remove('open');
    });
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

// ==========================================================================
// 5. クラウド中継 (暗号化版) 同期処理 ＆ 設定
// ==========================================================================

// 現場リストを暗号化してクラウドに一括送信
async function syncSitesToCloud() {
    if (!window.CloudSync || !window.CloudSync.isEnabled()) return;
    try {
        const collection = window.CloudSync.collection('sites');
        const sites = window.SiteDB.getAll();
        
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
async function syncReportsFromCloud() {
    if (!window.CloudSync || !window.CloudSync.init()) {
        window.app.showToast('クラウド接続設定が未完了です。設定ボタンから登録してください。', 'warning');
        return;
    }
    
    const syncBtn = document.getElementById('btn-cloud-sync');
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:0.95rem;height:0.95rem;"></i> <span>同期中...</span>';
        if (window.lucide) window.lucide.createIcons();
    }
    
    window.app.showToast('クラウドから提出済みの未処理日報を読み込んでいます...', 'info');
    
    try {
        const collection = window.CloudSync.collection('reports');
        const snapshot = await collection.get();
        
        if (snapshot.empty) {
            window.app.showToast('新着日報はありません（中継ポストは空です）', 'info');
            resetSyncButton();
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
                        (r.date === report.date && r.siteId === report.siteId && r.writer === report.writer)
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
            router();
        } else {
            window.app.showToast('新しい日報データは見つかりませんでした。', 'info');
        }
    } catch (e) {
        console.error('Cloud report sync failed:', e);
        window.app.showToast('同期中に接続エラーが発生しました。設定情報をご確認ください。', 'error');
    } finally {
        resetSyncButton();
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
    
    title.textContent = 'クラウド中継 (Cloudflare Workers) 接続設定';
    
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
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="btn-cfg-cancel">キャンセル</button>
                <button type="submit" class="btn btn-primary" id="btn-cfg-save">保存して接続テスト</button>
            </div>
        </form>
    `;
    
    backdrop.classList.add('open');
    const form = document.getElementById('cloud-config-form');
    
    const closeModal = () => backdrop.classList.remove('open');
    document.getElementById('btn-cfg-cancel').addEventListener('click', closeModal);
    
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
                    
                    // 初回の現場リスト同期をクラウドへアップロード
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
}
