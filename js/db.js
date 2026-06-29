/**
 * データベース層 (LocalStorage 制御) - グローバル公開版 (CORSポリシー回避)
 * 現場データ、日報データ、材料仕入れデータの保存および取得・集計処理を行います。
 */

// LocalStorageのキー定義
const STORAGE_KEYS = {
    SITES: 'report_ledger_sites',
    REPORTS: 'report_ledger_reports',
    PURCHASES: 'report_ledger_purchases'
};

// デモ用の現場データ初期値（工事番号と受注先を強調）
const DEMO_SITES = [
    {
        id: 'site_1',
        code: 'SB101', // 工事番号 (アルファベット2文字+数字3桁)
        name: '渋谷駅前複合ビル新築工事',
        client: '東都都市開発 株式会社', // 受注先
        clientManager: '高橋 一郎 部長', // 受注先担当者
        estimateCode: 'EST-26-001', // 見積り番号 [NEW]
        isBilled: true, // 請求確認 [NEW]
        isPaid: false, // 入金確認 [NEW]
        startDate: '2026-04-01',
        endDate: '2026-12-31',
        address: '東京都渋谷区道玄坂2丁目',
        manager: '佐藤 健太',
        budget: 150000000,
        status: 'active', // active: 進行中, planning: 計画中, completed: 完了
        memo: 'RC造地上12階建ての複合商業ビル新築案件。',
        createdAt: '2026-04-01T08:00:00.000Z'
    },
    {
        id: 'site_2',
        code: 'SJ202', // 工事番号 (アルファベット2文字+数字3桁)
        name: '新宿オフィスビル改修工事',
        client: '日本インベストメント興産 株式会社', // 受注先
        clientManager: '渡辺 課長', // 受注先担当者
        estimateCode: 'EST-26-002', // 見積り番号 [NEW]
        isBilled: false, // 請求確認 [NEW]
        isPaid: false, // 入金確認 [NEW]
        startDate: '2026-06-01',
        endDate: '2026-07-20',
        address: '東京都新宿区西新宿1丁目',
        manager: '鈴木 一郎',
        budget: 45000000,
        status: 'active',
        memo: '5階〜8階オフィステナント退去に伴う内装・設備改修工事。',
        createdAt: '2026-06-01T08:00:00.000Z'
    },
    {
        id: 'site_3',
        code: 'IB303', // 工事番号 (アルファベット2文字+数字3桁)
        name: '池袋レジデンス外壁塗装工事',
        client: '池袋レジデンス管理組合', // 受注先
        clientManager: '小林 理事長', // 受注先担当者
        estimateCode: 'EST-26-003', // 見積り番号 [NEW]
        isBilled: true, // 請求確認 [NEW]
        isPaid: true, // 入金確認 [NEW]
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        address: '東京都豊島区東池袋3丁目',
        manager: '田中 浩二',
        budget: 12000000,
        status: 'planning',
        memo: '大規模修繕周期に伴う塗装およびバルコニー防水工事。',
        createdAt: '2026-06-10T10:00:00.000Z'
    }
];

// デモ用の業務日報データ初期値（出発・開始・終了・帰社時間、直行・直帰、同行者を追加）
const DEMO_REPORTS = [
    {
        id: 'rep_1',
        siteId: 'site_1',
        date: '2026-06-12',
        weather: '晴れ',
        writer: '佐藤 健太',
        departureTime: '07:30',
        isDirectGo: false, // 直行なし
        startTime: '08:30',
        endTime: '17:00',
        returnTime: '18:15',
        isDirectBack: false, // 直帰なし
        companions: '高橋 義男、渡辺 誠、伊藤 淳', // 同行者
        workContent: '1階床コンクリート打設前の配筋検査対応。\n2階型枠支保工の組み立て。\n生コン打設用機材の搬入および配置確認。',
        memo: '14:00に設計監理者による配筋検査実施。指摘事項なし。明日朝一番より生コンクリート打設開始。',
        createdAt: '2026-06-12T17:30:00.000Z'
    },
    {
        id: 'rep_2',
        siteId: 'site_2',
        date: '2026-06-12',
        weather: '曇り',
        writer: '鈴木 一郎',
        departureTime: '',
        isDirectGo: true, // 直行
        startTime: '08:00',
        endTime: '17:30',
        returnTime: '',
        isDirectBack: true, // 直帰
        companions: '小林 茂、加藤 博', // 同行者
        workContent: '6階LGS天井下地および壁下地の組み込み。\n7階配線配管仕込み工事（電気設備業者と合同調整）。',
        memo: '搬出エレベーターの使用時間が13:00〜16:00に制限されているため、作業調整に留意した。',
        createdAt: '2026-06-12T18:00:00.000Z'
    },
    {
        id: 'rep_3',
        siteId: 'site_1',
        date: '2026-06-13',
        weather: '晴れ',
        writer: '佐藤 健太',
        departureTime: '07:00',
        isDirectGo: false,
        startTime: '08:00',
        endTime: '17:30',
        returnTime: '',
        isDirectBack: true, // 直帰（現場からそのまま帰宅）
        companions: '山本 太郎、高橋 義男、渡辺 誠',
        workContent: '1階床コンクリート打設（設計値24-18-20、打設数量：85m³）。\nコンクリート打設後の養生および散水準備。\n2階型枠支保工組み立て完了。',
        memo: '気温28度のため、打設後のクラック防止用散水養生を徹底。強度試験ピースを6本採取完了。',
        createdAt: '2026-06-13T17:15:00.000Z'
    }
];

// デモ用の材料仕入れデータ初期値
const DEMO_PURCHASES = [
    {
        id: 'pur_1',
        siteId: 'site_1',
        date: '2026-06-11', // 入荷月日
        orderedBy: '佐藤 健太', // 発注者
        supplier: '東京鋼材 株式会社', // 仕入れ先
        slipChecked: true, // 伝票チェック
        maker: '東京製鉄', // メーカー
        itemName: 'D19 異形鉄筋 5.5m', // 品名・型式
        unit: 't',
        quantity: 2.5,
        unitPrice: 110000, // 仕入れ単価
        totalPrice: 275000, // 合計仕入れ金額 (2.5 * 110000)
        listPrice: 150000, // 定価
        multiplier: 0.73, // 掛け率 (110000 / 150000)
        createdAt: '2026-06-11T09:00:00.000Z'
    },
    {
        id: 'pur_2',
        siteId: 'site_1',
        date: '2026-06-12',
        orderedBy: '佐藤 健太',
        supplier: '三多摩電材 株式会社', // 仕入れ先
        slipChecked: true,
        maker: '積水化学',
        itemName: '塩ビ管 VP50 4m',
        unit: '本',
        quantity: 30,
        unitPrice: 1200,
        totalPrice: 36000,
        listPrice: 2000,
        multiplier: 0.60,
        createdAt: '2026-06-12T10:00:00.000Z'
    },
    {
        id: 'pur_3',
        siteId: 'site_2',
        date: '2026-06-12',
        orderedBy: '鈴木 一郎',
        supplier: '建材センター 新宿店', // 仕入れ先
        slipChecked: false, // 伝票未チェック
        maker: '吉野石膏',
        itemName: 'タイガーボード 9.5mm',
        unit: '枚',
        quantity: 150,
        unitPrice: 450,
        totalPrice: 67500,
        listPrice: 900,
        multiplier: 0.50,
        createdAt: '2026-06-12T11:00:00.000Z'
    }
];

/**
 * データベースの初期化
 */
function initDatabase() {
    // 工事番号形式が変更された際や、見積り番号(estimateCode)フィールドが不足している場合もリセットします。
    const sites = JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES)) || [];
    const hasOldCodes = sites.length > 0 && sites.some(s => s.code.includes('-'));
    const missingEstimateField = sites.length > 0 && !sites[0].hasOwnProperty('estimateCode');
    
    const reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
    const hasNewFields = reports.length > 0 && reports[0].hasOwnProperty('departureTime');
    
    const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
    const missingSupplierField = purchases.length > 0 && !purchases[0].hasOwnProperty('supplier');
    
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASES) || !hasNewFields || hasOldCodes || missingEstimateField || missingSupplierField || sites.length === 0) {
        localStorage.removeItem(STORAGE_KEYS.SITES);
        localStorage.removeItem(STORAGE_KEYS.REPORTS);
        localStorage.removeItem(STORAGE_KEYS.PURCHASES);
    }

    if (!localStorage.getItem(STORAGE_KEYS.SITES)) {
        localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(DEMO_SITES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEMO_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(DEMO_PURCHASES));
    }
}

// ==========================================================================
// 現場台帳 (Sites) のデータ操作API
// ==========================================================================

const SiteDB = {
    getAll(filter = {}) {
        let sites = JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES)) || [];
        
        if (filter.search) {
            const query = filter.search.toLowerCase();
            sites = sites.filter(s => 
                s.name.toLowerCase().includes(query) || 
                s.code.toLowerCase().includes(query) ||
                (s.client && s.client.toLowerCase().includes(query)) ||
                (s.clientManager && s.clientManager.toLowerCase().includes(query)) ||
                (s.estimateCode && s.estimateCode.toLowerCase().includes(query)) ||
                (s.manager && s.manager.toLowerCase().includes(query))
            );
        }
        
        if (filter.status && filter.status !== 'all') {
            sites = sites.filter(s => s.status === filter.status);
        }
        
        return sites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getById(id) {
        const sites = this.getAll();
        return sites.find(s => s.id === id) || null;
    },

    add(siteData) {
        const sites = JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES)) || [];
        const newSite = {
            ...siteData,
            id: 'site_' + Date.now(),
            createdAt: new Date().toISOString()
        };
        sites.push(newSite);
        localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
        return newSite;
    },

    update(id, siteData) {
        let sites = JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES)) || [];
        const index = sites.findIndex(s => s.id === id);
        if (index === -1) return null;
        
        sites[index] = {
            ...sites[index],
            ...siteData,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
        return sites[index];
    },

    delete(id) {
        let sites = JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES)) || [];
        const filtered = sites.filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(filtered));
        
        // 関連する材料仕入れデータも削除
        let purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
        purchases = purchases.filter(p => p.siteId !== id);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        
        return true;
    }
};

// ==========================================================================
// 業務日報 (Reports) のデータ操作API
// ==========================================================================

const ReportDB = {
    getAll(filter = {}) {
        let reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
        
        if (filter.search) {
            const query = filter.search.toLowerCase();
            reports = reports.filter(r => 
                r.writer.toLowerCase().includes(query) || 
                r.workContent.toLowerCase().includes(query) ||
                (r.companions && r.companions.toLowerCase().includes(query)) ||
                (r.memo && r.memo.toLowerCase().includes(query))
            );
        }
        
        if (filter.siteId && filter.siteId !== 'all') {
            reports = reports.filter(r => r.siteId === filter.siteId);
        }
        
        if (filter.startDate) {
            reports = reports.filter(r => r.date >= filter.startDate);
        }
        
        if (filter.endDate) {
            reports = reports.filter(r => r.date <= filter.endDate);
        }
        
        return reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getById(id) {
        const reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
        return reports.find(r => r.id === id) || null;
    },

    getBySiteId(siteId) {
        return this.getAll({ siteId });
    },

    add(reportData) {
        const reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
        const newReport = {
            ...reportData,
            id: 'rep_' + Date.now(),
            createdAt: new Date().toISOString()
        };
        reports.push(newReport);
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        return newReport;
    },

    update(id, reportData) {
        let reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
        const index = reports.findIndex(r => r.id === id);
        if (index === -1) return null;
        
        reports[index] = {
            ...reports[index],
            ...reportData,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        return reports[index];
    },

    delete(id) {
        let reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
        const filtered = reports.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
        return true;
    }
};

// ==========================================================================
// 材料仕入れ (Purchases) のデータ操作API
// ==========================================================================

const PurchaseDB = {
    getAll(filter = {}) {
        let purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
        
        if (filter.search) {
            const query = filter.search.toLowerCase();
            purchases = purchases.filter(p => 
                p.maker.toLowerCase().includes(query) || 
                p.itemName.toLowerCase().includes(query) ||
                (p.orderedBy && p.orderedBy.toLowerCase().includes(query))
            );
        }
        
        if (filter.siteId && filter.siteId !== 'all') {
            purchases = purchases.filter(p => p.siteId === filter.siteId);
        }
        
        return purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getById(id) {
        const purchases = this.getAll();
        return purchases.find(p => p.id === id) || null;
    },

    getBySiteId(siteId) {
        return this.getAll({ siteId });
    },

    add(purchaseData) {
        const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
        
        const quantity = parseFloat(purchaseData.quantity) || 0;
        const unitPrice = parseFloat(purchaseData.unitPrice) || 0;
        const listPrice = parseFloat(purchaseData.listPrice) || 0;
        
        const totalPrice = quantity * unitPrice;
        const multiplier = listPrice > 0 ? parseFloat((unitPrice / listPrice).toFixed(4)) : 0;
        
        const newPurchase = {
            ...purchaseData,
            id: 'pur_' + Date.now(),
            totalPrice,
            multiplier,
            createdAt: new Date().toISOString()
        };
        
        purchases.push(newPurchase);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        return newPurchase;
    },

    update(id, purchaseData) {
        let purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
        const index = purchases.findIndex(p => p.id === id);
        if (index === -1) return null;
        
        const quantity = parseFloat(purchaseData.quantity) || 0;
        const unitPrice = parseFloat(purchaseData.unitPrice) || 0;
        const listPrice = parseFloat(purchaseData.listPrice) || 0;
        
        const totalPrice = quantity * unitPrice;
        const multiplier = listPrice > 0 ? parseFloat((unitPrice / listPrice).toFixed(4)) : 0;
        
        purchases[index] = {
            ...purchases[index],
            ...purchaseData,
            totalPrice,
            multiplier,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        return purchases[index];
    },

    delete(id) {
        let purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
        const filtered = purchases.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(filtered));
        return true;
    }
};

// ==========================================================================
// 統計データ (Dashboard Stats) の集計API
// ==========================================================================

const StatsDB = {
    getSummary() {
        const sites = SiteDB.getAll();
        const reports = ReportDB.getAll();
        const purchases = PurchaseDB.getAll();
        
        const activeSitesCount = sites.filter(s => s.status === 'active').length;
        
        const currentMonthPrefix = '2026-06';
        const currentMonthReports = reports.filter(r => r.date.startsWith(currentMonthPrefix));
        const monthlyReportsCount = currentMonthReports.length;
        
        const currentMonthPurchases = purchases.filter(p => p.date.startsWith(currentMonthPrefix));
        const monthlyPurchasesSum = currentMonthPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
        
        const todayStr = '2026-06-13';
        const todayReports = reports.filter(r => r.date === todayStr);
        let todayWorkersCount = 0;
        
        const countWorkers = (rep) => {
            let count = 1;
            if (rep.companions) {
                const list = rep.companions.split(/[、,，\s\+]+/);
                const validList = list.filter(name => name.trim().length > 0);
                count += validList.length;
            }
            return count;
        };
        
        if (todayReports.length > 0) {
            todayWorkersCount = todayReports.reduce((sum, r) => sum + countWorkers(r), 0);
        } else {
            const latestReports = reports.slice(0, 1);
            if (latestReports.length > 0) {
                todayWorkersCount = countWorkers(latestReports[0]);
            }
        }
        
        const siteChartData = sites.map(site => {
            const siteReports = reports.filter(r => r.siteId === site.id);
            const totalDays = siteReports.length;
            const totalManPower = siteReports.reduce((sum, r) => sum + countWorkers(r), 0);
            
            const sitePurchases = purchases.filter(p => p.siteId === site.id);
            const totalPurchaseAmount = sitePurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
            
            return {
                name: site.name,
                days: totalDays,
                manpower: totalManPower,
                purchases: totalPurchaseAmount
            };
        }).filter(d => d.days > 0 || d.purchases > 0);
        
        const activities = [];
        
        sites.forEach(s => {
            activities.push({
                type: 'site_create',
                time: s.createdAt,
                title: '現場登録',
                detail: `現場「<strong>[${s.code}] ${s.name}</strong>」が登録されました。`
            });
        });
        
        reports.forEach(r => {
            const site = sites.find(s => s.id === r.siteId);
            const siteName = site ? site.name : '不明な現場';
            activities.push({
                type: 'report_create',
                time: r.createdAt,
                title: '日報提出',
                detail: `現場「<strong>${siteName}</strong>」の日報が提出されました。(記入者: ${r.writer})`
            });
        });

        purchases.forEach(p => {
            const site = sites.find(s => s.id === p.siteId);
            const siteName = site ? site.name : '不明な現場';
            activities.push({
                type: 'purchase_create',
                time: p.createdAt,
                title: '仕入れ登録',
                detail: `現場「<strong>${siteName}</strong>」に材料「<strong>${p.itemName}</strong>」の仕入れが手入力されました。(¥${(p.totalPrice || 0).toLocaleString()})`
            });
        });
        
        const recentActivities = activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5);
            
        return {
            activeSitesCount,
            monthlyReportsCount,
            monthlyPurchasesSum,
            todayWorkersCount,
            sitesCount: sites.length,
            siteChartData,
            recentActivities
        };
    }
};

// CORS制限回避のため、 window オブジェクト配下にグローバルエクスポート
window.initDatabase = initDatabase;
window.SiteDB = SiteDB;
window.ReportDB = ReportDB;
window.PurchaseDB = PurchaseDB;
window.StatsDB = StatsDB;

// ==========================================================================
// 5. 暗号化 ＆ Firebase (クラウド中継) 連携モジュール
// ==========================================================================

const ENCRYPTION_KEY = 'TokoroDailyReportSecretKeyToken2026';

// AES-256 共通鍵暗号化/復号化ユーティリティ
window.CryptoUtil = {
    encrypt: function(data) {
        if (!window.CryptoJS) {
            console.error('CryptoJS is not loaded.');
            return null;
        }
        try {
            const jsonStr = JSON.stringify(data);
            return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_KEY).toString();
        } catch (e) {
            console.error('Encryption failed:', e);
            return null;
        }
    },
    decrypt: function(encryptedStr) {
        if (!window.CryptoJS) {
            console.error('CryptoJS is not loaded.');
            return null;
        }
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedStr, ENCRYPTION_KEY);
            const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedStr) return null;
            return JSON.parse(decryptedStr);
        } catch (e) {
            console.error('Decryption failed:', e);
            return null;
        }
    }
};

// Cloudflare Workers (クラウド中継) 接続 ＆ 同期コントロール
window.CloudSync = {
    config: null,
    isMock: false,
    getConfig: function() {
        const saved = localStorage.getItem('cloudflare_config');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    saveConfig: function(config) {
        localStorage.setItem('cloudflare_config', JSON.stringify(config));
        this.config = config;
    },
    init: function() {
        if (this.config) return true;
        const config = this.getConfig();
        if (!config || !config.url || !config.token) {
            this.isMock = true;
            return true;
        }
        this.config = config;
        this.isMock = false;
        return true;
    },
    isEnabled: function() {
        this.init();
        return true; // 常にモックまたは本番が動くため有効
    },
    collection: function(name) {
        this.init();
        const self = this;
        const config = this.config;
        
        if (!this.isMock && config && config.url) {
            // Tencent EdgeOne Makers 本番API接続
            return {
                get: async function() {
                    const headers = { 'Authorization': `Bearer ${config.token}` };
                    
                    if (name === 'sites') {
                        // 現場リストの取得 (一括)
                        const res = await fetch(`${config.url}/api/sites`, { headers });
                        if (!res.ok) throw new Error('API error on GET sites');
                        const encryptedText = await res.text();
                        if (!encryptedText || encryptedText === '[]') return [];
                        const decryptedList = window.CryptoUtil.decrypt(encryptedText);
                        if (Array.isArray(decryptedList)) {
                            return decryptedList.map(s => ({
                                id: s.id,
                                data: () => ({ encrypted: window.CryptoUtil.encrypt(s) })
                            }));
                        }
                        return [];
                    } else {
                        // 未処理日報リストの取得
                        const res = await fetch(`${config.url}/api/reports`, { headers });
                        if (!res.ok) throw new Error('API error on GET reports');
                        const list = await res.json();
                        return list.map(item => ({
                            id: item.id,
                            data: () => item.data
                        }));
                    }
                },
                add: async function(data) {
                    // 日報の送信 (POST)
                    const res = await fetch(`${config.url}/api/reports`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) throw new Error('API error on POST report');
                    return await res.json();
                },
                doc: function(docId) {
                    return {
                        set: async function(data) {
                            if (name === 'sites') {
                                // 現場リストのアップロード (一括POST)
                                const allSites = window.SiteDB.getAll();
                                const encryptedAll = window.CryptoUtil.encrypt(allSites);
                                const res = await fetch(`${config.url}/api/sites`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${config.token}`,
                                        'Content-Type': 'text/plain'
                                    },
                                    body: encryptedAll
                                });
                                if (!res.ok) throw new Error('API error on POST sites');
                                return true;
                            }
                            return false;
                        },
                        delete: async function() {
                            if (name === 'sites') {
                                // 現場削除時のアップロード (一括POST)
                                const allSites = window.SiteDB.getAll();
                                const encryptedAll = window.CryptoUtil.encrypt(allSites);
                                const res = await fetch(`${config.url}/api/sites`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${config.token}`,
                                        'Content-Type': 'text/plain'
                                    },
                                    body: encryptedAll
                                });
                                if (!res.ok) throw new Error('API error on POST sites');
                                return true;
                            } else {
                                // 同期完了した日報を消去 (DELETE)
                                const res = await fetch(`${config.url}/api/reports`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${config.token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ ids: [docId] })
                                });
                                if (!res.ok) throw new Error('API error on DELETE report');
                                return true;
                            }
                        }
                    };
                }
            };
        } else {
            // 疑似クラウド（同一ブラウザ内 LocalStorage 中継）
            const storageKey = `cloud_mock_${name}`;
            return {
                get: async function() {
                    const saved = localStorage.getItem(storageKey);
                    const list = saved ? JSON.parse(saved) : [];
                    return list.map(item => ({
                        id: item.id,
                        data: () => item.data
                    }));
                },
                add: async function(data) {
                    const saved = localStorage.getItem(storageKey);
                    const list = saved ? JSON.parse(saved) : [];
                    const newId = 'mock_doc_' + String(Math.random()).slice(2, 10);
                    list.push({ id: newId, data: data });
                    localStorage.setItem(storageKey, JSON.stringify(list));
                    return { id: newId };
                },
                doc: function(docId) {
                    return {
                        set: async function(data) {
                            const saved = localStorage.getItem(storageKey);
                            const list = saved ? JSON.parse(saved) : [];
                            const existIndex = list.findIndex(item => item.id === docId);
                            if (existIndex >= 0) {
                                list[existIndex].data = data;
                            } else {
                                list.push({ id: docId, data: data });
                            }
                            localStorage.setItem(storageKey, JSON.stringify(list));
                            return true;
                        },
                        delete: async function() {
                            const saved = localStorage.getItem(storageKey);
                            const list = saved ? JSON.parse(saved) : [];
                            const filtered = list.filter(item => item.id !== docId);
                            localStorage.setItem(storageKey, JSON.stringify(filtered));
                            return true;
                        }
                    };
                }
            };
        }
    }
};
