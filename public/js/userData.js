// 用户数据管理 - localStorage
const UserData = {
    key: 'visaGame',
    // 存档结构版本。题干文本是 seenQuestions / questionCounts 的键，改动或删除题目
    // 会让老记录对不上，所以每次改题干就把它 +1，读取时清掉这两项重建。
    version: 2,
    
    getData() {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return this.getDefaultData();
            const parsed = JSON.parse(raw);
            // 版本号必须取原始存档的，normalize 会用默认值把它盖掉
            return this.migrate(this.normalize(parsed), parsed.version);
        } catch (e) {
            console.error('读取数据失败:', e);
            return this.getDefaultData();
        }
    },
    
    // 老版本存档只清按题干做键的答题记录，金币/成就/统计/设置原样保留
    migrate(data, storedVersion) {
        if (typeof storedVersion === 'number' && storedVersion >= this.version) return data;
        data.seenQuestions = [];
        data.questionCounts = {};
        data.version = this.version;
        this.saveData(data);
        return data;
    },
    
    // 老存档缺少后来新增的字段，读取时一律按默认值补齐
    normalize(data) {
        const base = this.getDefaultData();
        return {
            ...base,
            ...data,
            stats: { ...base.stats, ...(data.stats || {}) },
            settings: { ...base.settings, ...(data.settings || {}) },
            achievements: Array.isArray(data.achievements) ? data.achievements : [],
            seenQuestions: Array.isArray(data.seenQuestions) ? data.seenQuestions : [],
            seenEvents: Array.isArray(data.seenEvents) ? data.seenEvents : [],
            purchasedItems: Array.isArray(data.purchasedItems) ? data.purchasedItems : [],
            questionCounts: (data.questionCounts && typeof data.questionCounts === 'object') ? data.questionCounts : {}
        };
    },
    
    saveData(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },
    
    getDefaultData() {
        return {
            version: UserData.version,
            clientId: 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            coins: 200,
            achievements: [],
            // 跨局累计的收集进度
            seenQuestions: [],
            seenEvents: [],
            purchasedItems: [],
            questionCounts: {},
            stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                asOfficer: 0,
                asApplicant: 0,
                correctJudgments: 0,
                successfulDeceptions: 0,
                fraudstersCaught: 0,
                randomEvents: 0,
                officerStreak: 0,
                applicantStreak: 0,
                chatMessages: 0
            },
            settings: {
                soundEnabled: true,
                bgmEnabled: true,
                volume: 80
            }
        };
    },
    
    // 更新金币
    updateCoins(amount) {
        const data = this.getData();
        data.coins = Math.max(0, data.coins + amount);
        this.saveData(data);
        return data.coins;
    },
    
    // 更新统计
    updateStats(updates) {
        const data = this.getData();
        Object.assign(data.stats, updates);
        this.saveData(data);
    },
    
    // 添加成就
    addAchievement(id) {
        const data = this.getData();
        if (!data.achievements.includes(id)) {
            data.achievements.push(id);
            this.saveData(data);
            return true;
        }
        return false;
    },
    
    // 检查成就
    hasAchievement(id) {
        const data = this.getData();
        return data.achievements.includes(id);
    },
    
    // 记录一条收集进度（seenQuestions / seenEvents / purchasedItems），返回去重后的总数
    recordSeen(field, value) {
        if (!value) return 0;
        const data = this.getData();
        if (!data[field].includes(value)) {
            data[field].push(value);
            this.saveData(data);
        }
        return data[field].length;
    },
    
    // 累计某道题被作答的次数，返回最新次数
    countQuestion(question) {
        if (!question) return 0;
        const data = this.getData();
        data.questionCounts[question] = (data.questionCounts[question] || 0) + 1;
        this.saveData(data);
        return data.questionCounts[question];
    },
    
    // 获取设置
    getSettings() {
        const data = this.getData();
        return data.settings;
    },
    
    // 更新设置
    updateSettings(settings) {
        const data = this.getData();
        Object.assign(data.settings, settings);
        this.saveData(data);
    },
    
    // 重置数据
    reset() {
        localStorage.removeItem(this.key);
    }
};
