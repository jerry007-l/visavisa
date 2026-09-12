// 面签三分钟 - 单机版主游戏逻辑
const Game = {
    state: {
        screen: 'mainMenu',
        playerRole: null, // 'officer' or 'applicant'
        coins: 200,
        startCoins: 200,
        currentRound: 1,
        totalRounds: 4,
        applicantIdentity: null,
        drawnMaterials: [],
        questionIndex: 0,
        score: 70, // 签证官初始信任度
        timer: null,
        dialogueHistory: [],
        materialFake: {}, // 记录哪些材料是假的
        randomEventTriggered: [],
        gameStartTime: null,

        // 道具系统状态
        usedItemIds: [],      // 本局已使用的道具
        itemHistory: [],      // 使用流水
        skipNextQuestion: false,   // 记忆魔法：跳过下一题
        autoAnswerRounds: 0,       // 人格切换：剩余自动答对轮数
        timeBonus: 0,              // 咖啡因：单轮额外秒数
        timeBonusRounds: 0,        // 咖啡因：剩余生效轮数
        lenientScoring: false,     // 法律免责声明：扣分打八折
        suspicionRadar: false,     // AI情绪分析：每轮显示可疑度
        pressureMode: false,       // 连环追问：持续施压，提高说谎暴露率

        // 线索系统
        revealedClues: [],
        materialRevealed: []       // 已被道具验出真伪的材料 id
    },
    
    // 初始化
    init() {
        console.log('🎮 面签三分钟 单机版启动!');
        const userData = UserData.getData();
        this.state.coins = userData.coins;
        
        // 更新主菜单金币显示
        this.updateCoinDisplay();
        
        // 加载音效设置
        if (!UserData.getSettings().soundEnabled) {
            SoundManager.mute();
        } else {
            // 尝试初始化音频（可能因浏览器策略而失败）
            setTimeout(() => {
                SoundManager.init();
            }, 500);
        }
        
        // 添加欢迎消息
    },
    
    // 切换屏幕
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        this.state.screen = screenId;
        
        // 根据环节显示/隐藏道具背包按钮
        // 所有游戏环节都显示道具背包
        const itemBtn = document.getElementById('ItemQuickUseBtn');
        if (itemBtn) {
            const gameScreens = ['materialDraw', 'materialReview', 'dialogue', 'randomEvent', 'finalDecision'];
            itemBtn.style.display = gameScreens.includes(screenId) ? 'block' : 'none';
        }
        
        // 如果返回对话环节，重新初始化 Dialogue（确保状态正确）
        if (screenId === 'dialogue' && typeof Dialogue !== 'undefined') {
            console.log('🎤 返回对话环节，确保 Dialogue 状态正确');
            // 不重新init，只确保状态
            if (typeof Dialogue.ensureState === 'function') {
                Dialogue.ensureState();
            }
        }
    },
    
    // 开始角色选择
    startRoleSelect() {
        this.showScreen('roleSelect');
    },
    
    // 选择角色
    selectRole(role) {
        this.state.playerRole = role;
        this.state.gameStartTime = Date.now();
        this.state.startCoins = this.state.coins;
        
        // 添加系统消息
        
        // 申请人身份必须在抽材料之前就位：材料真伪要根据他是否清白来决定
        if (role === 'officer') {
            this.generateApplicantIdentity();
        }
        
        // 进入道具购买阶段
        this.startShopPhase();
    },
    
    // 道具购买阶段
    startShopPhase() {
        this.clearTimer();
        this.showScreen('shopPhase');
        Shop.renderItems();
        Shop.startTimer(60);
    },
    
    // 确认购买
    confirmPurchase() {
        // 商店倒计时必须在这里终止，否则它会在后续环节继续跑，
        // 到点后再次调用 confirmPurchase() 把玩家拽回抽材料界面
        this.clearTimer();

        SoundManager.init();
        SoundManager.play('success');
            
        this.showScreen('materialDraw');
        DrawMaterials.renderMaterials();
    },
    
    // 清除全局计时器
    clearTimer() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
    },
    
    // 材料抽奖
    drawMaterials() {
        SoundManager.init(); // 初始化音频
        SoundManager.play('item'); // 播放道具音效
            
        const materials = DrawMaterials.draw();
        this.state.drawnMaterials = materials;
        DrawMaterials.reveal(materials);
            
        // 确定哪些是伪造的：清白申请人不会带假材料，否则签证官查出伪造再拒签反而被判错
        const identity = this.state.applicantIdentity;
        const guilty = !identity || identity.guilty !== false;
        // 难度越高的骗子伪造手艺越好，查出来的概率越低
        const skill = guilty ? (identity && identity.difficulty >= 3 ? 0.6 : identity && identity.difficulty === 2 ? 0.8 : 1) : 0;

        materials.forEach(mat => {
            this.state.materialFake[mat.id] = guilty && Math.random() < mat.fakeChance * skill;
        });

        // 抽完即锁定：隐藏"开始抽奖"，防止本局重复抽取刷新材料；
        // 下一局进入本环节时由 DrawMaterials.renderMaterials() 复位重新显示
        const drawBtn = document.querySelector('#materialDraw .btn-primary');
        if (drawBtn) drawBtn.style.display = 'none';

        // 显示确认按钮
        const confirmBtn = document.querySelector('#materialDraw .btn-secondary');
        if (confirmBtn) {
            confirmBtn.style.display = 'block';
            confirmBtn.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    confirmMaterials() {
        SoundManager.init(); // 初始化音频
        SoundManager.play('click');
            
        this.showScreen('materialReview');
        MaterialReview.renderMaterials();
    },
    
    // 进入对话环节
    nextPhase() {
        try {
            SoundManager.init(); // 初始化音频
            SoundManager.play('success');
                
            console.log('🔍 Game.nextPhase() 被调用');
            console.log('当前角色:', this.state.playerRole);
            console.log('drawnMaterials:', this.state.drawnMaterials);
                
            this.showScreen('dialogue');
                
            // 确保 Dialogue 对象存在
            if (typeof Dialogue !== 'undefined' && Dialogue.init) {
                // 稍微延迟确保 DOM 已经渲染
                setTimeout(() => {
                    Dialogue.init();
                    console.log('✅ Dialogue.init() 已调用');
                }, 100);
            } else {
                console.error('❌ Dialogue 对象不存在或没有 init 方法');
            }
        } catch (error) {
            console.error('❌ nextPhase 错误:', error);
            alert('发生错误:' + error.message);
        }
    },
    
    // 生成申请人身份
    generateApplicantIdentity() {
        const identity = IdentityPool.getRandom();
        this.state.applicantIdentity = identity;
        // 身份的真实信息必须对签证官保密，否则等于直接剧透答案
    },
    
    // 揭露线索（供随机事件与签证官道具调用）
    revealClue(count = 1) {
        const identity = this.state.applicantIdentity;
        if (!identity || !identity.clues) return 0;
        
        const hidden = identity.clues.filter(c => !this.state.revealedClues.includes(c));
        const revealed = hidden.slice(0, count);
        
        revealed.forEach(clue => {
            this.state.revealedClues.push(clue);
        });
        
        if (revealed.length === 0) {
        }
        
        return revealed.length;
    },
    
    // 公开材料真伪（供签证官查验类道具调用）
    revealMaterialTruth(ids, toolLabel) {
        const targets = this.state.drawnMaterials.filter(mat => !ids || ids.includes(mat.id));
        
        targets.forEach(mat => {
            const isFake = this.state.materialFake[mat.id];
            if (!this.state.materialRevealed.includes(mat.id)) {
                this.state.materialRevealed.push(mat.id);
            }
        });
        
        return targets.length;
    },
    
    // 触发随机事件
    triggerRandomEvent() {
        const available = RANDOM_EVENTS.filter(e => !this.state.randomEventTriggered.includes(e.id));
        if (available.length === 0) return;
        
        const event = available[Math.floor(Math.random() * available.length)];
        this.state.randomEventTriggered.push(event.id);

        // 跨局累计，成就 laugh-out-loud / event-hunter 依赖这两个数据
        UserData.updateStats({ randomEvents: UserData.getData().stats.randomEvents + 1 });
        UserData.recordSeen('seenEvents', event.id);

        SoundManager.play('event'); // 播放事件音效
        this.showScreen('randomEvent');
        RandomEvents.handle(event);
    },
    
    // 进入最终决策
    goToFinalDecision() {
        if (Game.state.playerRole === 'applicant') {
            // 申请人模式：自动给出结果
            setTimeout(() => {
                const result = Decision.calculate('auto');
                this.showScreen('resultScreen');
                Result.show(result);
            }, 1500);
        } else {
            // 签证官模式：手动选择决策
            this.showScreen('finalDecision');
            Decision.renderSummary();
        }
    },
    
    // 做出决策
    makeDecision(decision) {
        const result = Decision.calculate(decision);
        this.showScreen('resultScreen');
        Result.show(result);
    },
    
    // 回到主页
    backToMain() {
        if (typeof Result !== 'undefined' && Result.cancelAutoRestart) {
            Result.cancelAutoRestart();
        }
        if (typeof Dialogue !== 'undefined') {
            clearInterval(Dialogue.timer);
            Dialogue.timer = null;
        }
        this.resetGame();
        this.showScreen('mainMenu');
        this.updateCoinDisplay();
    },
    
    // 重置游戏
    resetGame() {
        Object.assign(this.state, {
            playerRole: null,
            currentRound: 1,
            applicantIdentity: null,
            drawnMaterials: [],
            questionIndex: 0,
            score: 70,
            dialogueHistory: [],
            materialFake: {},
            randomEventTriggered: [],
            gameStartTime: null,

            usedItemIds: [],
            itemHistory: [],
            skipNextQuestion: false,
            autoAnswerRounds: 0,
            timeBonus: 0,
            timeBonusRounds: 0,
            lenientScoring: false,
            suspicionRadar: false,
            pressureMode: false,
            revealedClues: [],
            materialRevealed: []
        });
        
        this.clearTimer();
        
        // 重置商店道具选择
        Shop.selectedItems = [];
        
        // 整页刷新已经换成 backToMain()，这些残留得自己清
        if (typeof ItemQuickUse !== 'undefined' && ItemQuickUse.hide) {
            ItemQuickUse.hide();
        }
        
        console.log('🔄 游戏已重置');
    },
    
    // 更新金币显示
    updateCoinDisplay() {
        const coinElements = document.querySelectorAll('[id$="Coins"]');
        coinElements.forEach(el => {
            el.textContent = this.state.coins;
        });
    },
    
    // 计算结算
    calculateResult(success, detail = {}) {
        const isOfficer = this.state.playerRole === 'officer';
        const coinChange = detail.coinChange !== undefined
            ? detail.coinChange
            : (success ? 80 : -50);
        const data = UserData.getData();
        const stats = data.stats;
        
        const updates = {
            gamesPlayed: stats.gamesPlayed + 1,
            wins: stats.wins + (success ? 1 : 0),
            losses: stats.losses + (success ? 0 : 1)
        };
        
        if (isOfficer) {
            updates.asOfficer = stats.asOfficer + 1;
            updates.applicantStreak = 0;
            if (success) {
                updates.correctJudgments = (stats.correctJudgments || 0) + 1;
                updates.officerStreak = (stats.officerStreak || 0) + 1;
                const caught = this.state.applicantIdentity && this.state.applicantIdentity.guilty;
                if (caught && detail.verdict === 'reject') {
                    updates.fraudstersCaught = (stats.fraudstersCaught || 0) + 1;
                }
            } else {
                updates.officerStreak = 0;
            }
        } else {
            updates.asApplicant = stats.asApplicant + 1;
            updates.officerStreak = 0;
            if (success) {
                updates.successfulDeceptions = (stats.successfulDeceptions || 0) + 1;
                updates.applicantStreak = (stats.applicantStreak || 0) + 1;
            } else {
                updates.applicantStreak = 0;
            }
        }
        
        const newCoins = UserData.updateCoins(coinChange);
        UserData.updateStats(updates);
        this.state.coins = newCoins;
        
        const verdict = detail.verdict || (success ? 'approve' : 'reject');
        
        let message;
        if (detail.message) {
            message = detail.message;
        } else if (isOfficer) {
            message = success
                ? `判断正确！${detail.reason || ''}`
                : `判断失误。${detail.reason || ''}`;
        } else {
            message = success ? '恭喜！签证通过！' : '很遗憾，签证被拒了';
        }
        
        // 检查成就
        Achievement.checkAchievements(success, { coinChange, verdict });
        
        return {
            success,
            coinChange,
            newCoins,
            verdict,
            message,
            // 决策结束后才向签证官公开申请人的真实身份
            identity: isOfficer ? this.state.applicantIdentity : null,
            wasCorrectCall: isOfficer ? success : null
        };
    },
    
    // 显示商店（从主页）
    showShop() {
    },
    
    // 显示成就
    showAchievements() {
        Achievement.showList();
    },
    
    // 显示统计
    showStats() {
        const data = UserData.getData();
        alert(`📊 数据统计\n\n游戏次数: ${data.stats.gamesPlayed}\n胜利: ${data.stats.wins}\n失败: ${data.stats.losses}\n胜率: ${data.stats.gamesPlayed > 0 ? ((data.stats.wins/data.stats.gamesPlayed)*100).toFixed(1) : 0}%\n\n当前金币: ${data.coins} VC`);
    },
    
    // 切换音效
    toggleSound() {
        SoundManager.toggle();
    }
};

// 页面加载后初始化
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
