// 道具快捷使用面板 - 在游戏过程中随时使用道具
const ItemQuickUse = {
    // 显示道具面板
    show() {
        const purchasedItems = Shop.getSelectedItems();
        const usedIds = Game.state.usedItemIds || [];
        
        // 过滤出未使用的道具
        const availableItems = purchasedItems.filter(item => !usedIds.includes(item.id));
        
        if (availableItems.length === 0) {
            return;
        }
        
        // 创建或获取面板
        let panel = document.getElementById('ItemQuickUsePanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'ItemQuickUsePanel';
            panel.className = 'item-quick-use-panel';
            document.body.appendChild(panel);
        }
        
        // 渲染道具列表
        panel.innerHTML = `
            <div class="panel-header">
                <h3>🎒 快捷道具</h3>
                <button class="btn-close" onclick="ItemQuickUse.hide()">×</button>
            </div>
            <div class="panel-content">
                ${availableItems.map(item => `
                    <div class="quick-item-card" onclick="ItemQuickUse.use('${item.id}')">
                        <div class="item-icon">${item.name.split(' ')[0]}</div>
                        <div class="item-info">
                            <div class="item-name">${item.name.split(' ').slice(1).join(' ')}</div>
                            <div class="item-effect">${item.effect}</div>
                        </div>
                        <button class="btn-use">使用</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 显示面板
        panel.classList.add('active');
        SoundManager.init();
    },
    
    // 使用道具（实际效果）
    use(itemId) {
        const purchasedItems = Shop.getSelectedItems();
        const item = purchasedItems.find(i => i.id === itemId);
        
        if (!item) {
            console.error('❌ 道具不存在:', itemId);
            return;
        }
        
        // 检查是否已使用
        const usedIds = Game.state.usedItemIds || [];
        if (usedIds.includes(itemId)) {
            return;
        }
        
        console.log('✨ 使用道具:', item.name, '-', item.effect);
        
        // 记录已使用
        usedIds.push(itemId);
        Game.state.usedItemIds = usedIds;
        Shop.selectedItems = Shop.selectedItems.filter(id => id !== itemId);
        
        // 应用道具效果
        this.applyEffect(item);
        
        // 关闭面板
        this.hide();
        
    },
    
    // 道具效果分组
    EDUCATION_WORK_IDS: ['graduation_cert', 'degree_cert', 'transcript', 'employment_cert', 'resume', 'offer_letter'],
    INVITATION_IDS: ['invitation', 'conference_inv', 'guarantor_letter', 'offer_letter'],
    
    // 应用道具效果
    applyEffect(item) {
        console.log('✨ 应用道具效果:', item.name);
        const isOfficer = Game.state.playerRole === 'officer';
        const state = Game.state;
        
        switch (item.id) {
            // ---------- 申请人道具 ----------
            case 'deep_photo': {
                // 把一份已伪造的材料洗白；如果没有伪造材料，则材料本身足够漂亮，加点信任
                const forged = state.drawnMaterials.filter(m => state.materialFake[m.id]);
                if (forged.length > 0) {
                    const target = forged[0];
                    state.materialFake[target.id] = false;
                } else {
                    state.score = Math.min(100, state.score + 5);
                }
                this.showFeedback('success', '📱 深度P图已生效！');
                this.playVisualEffect('glow-green');
                break;
            }
            
            case 'returnee_template': {
                const fixed = this.EDUCATION_WORK_IDS.filter(id => state.materialFake[id]);
                fixed.forEach(id => { state.materialFake[id] = false; });
                state.score = Math.min(100, state.score + 5);
                this.showFeedback('success', '💼 海归模板已生效！');
                this.playVisualEffect('glow-green');
                break;
            }
            
            case 'fake_operator': {
                const fixed = this.INVITATION_IDS.filter(id => state.materialFake[id]);
                fixed.forEach(id => { state.materialFake[id] = false; });
                state.score = Math.min(100, state.score + 5);
                this.showFeedback('success', '📞 假接线员已就位！');
                this.playVisualEffect('glow-green');
                break;
            }
            
            case 'crazy_itinerary':
                state.score = Math.min(100, state.score + 8);
                this.showFeedback('success', '🗓️ 行程可信度提升！');
                this.playVisualEffect('glow-gold');
                break;
            
            case 'magic_memory':
                state.skipNextQuestion = true;
                this.showFeedback('success', '🧠 下一题将被跳过！');
                this.playVisualEffect('glow-blue');
                break;
            
            case 'personality_switch':
                state.autoAnswerRounds = 2;
                this.showFeedback('success', '🎭 接下来两轮自动答对！');
                this.playVisualEffect('glow-blue');
                break;
            
            case 'triple_caffeine':
                state.timeBonus = 10;
                state.timeBonusRounds = 2;
                this.showFeedback('success', '☕ 答题时间延长！');
                this.playVisualEffect('pulse-orange');
                break;
            
            case 'legal_disclaimer':
                state.lenientScoring = true;
                this.showFeedback('success', '📜 扣分减免已生效！');
                this.playVisualEffect('glow-gold');
                break;
            
            // ---------- 签证官道具 ----------
            case 'microscope': {
                const found = Game.revealMaterialTruth(null, '🔍 显微镜审查：');
                Game.revealClue(1);
                this.showFeedback('success', '🔍 发现可疑点！');
                this.playVisualEffect('glow-green');
                break;
            }
            
            case 'dna_compare':
                Game.revealMaterialTruth(null, '🧬 DNA比对：');
                this.showFeedback('success', '🧬 材料真伪已确认！');
                this.playVisualEffect('glow-green');
                break;
            
            case 'verify_hotline': {
                const found = Game.revealMaterialTruth(this.INVITATION_IDS, '📞 核实热线：');
                if (found === 0) {
                    Game.revealClue(1);
                } else {
                }
                this.showFeedback('success', '📞 核实完成！');
                this.playVisualEffect('glow-blue');
                break;
            }
            
            case 'review_monitor':
                Game.revealClue(1);
                this.showFeedback('success', '🎬 监控回放完成！');
                this.playVisualEffect('glow-blue');
                break;
            
            case 'chain_question':
                state.pressureMode = true;
                Game.revealClue(2);
                this.showFeedback('success', '⚡ 压力测试已启动！');
                this.playVisualEffect('pulse-orange');
                break;
            
            case 'blacklist_scan': {
                const identity = state.applicantIdentity;
                // 黑名单只能查到有正经案底的人；那些动机荒唐的低危身份查不出来
                const hasRecord = !!identity && identity.guilty && identity.difficulty >= 2;
                this.showFeedback(hasRecord ? 'error' : 'info', hasRecord ? '🕵️ 命中黑名单！' : '🕵️ 无不良记录');
                this.playVisualEffect(hasRecord ? 'pulse-orange' : 'glow-blue');
                break;
            }
            
            case 'credit_score': {
                const identity = state.applicantIdentity;
                let rating = '低';
                if (identity) {
                    if (identity.guilty) {
                        rating = identity.difficulty >= 3 ? '高' : identity.difficulty >= 2 ? '中高' : '中';
                    } else {
                        rating = identity.difficulty >= 2 ? '中' : '低';
                    }
                }
                this.showFeedback('info', `📈 风险评级：${rating}`);
                this.playVisualEffect('glow-gold');
                break;
            }
            
            case 'ai_emotion':
                state.suspicionRadar = true;
                this.showFeedback('success', '📊 情绪分析已开启！');
                this.playVisualEffect('glow-blue');
                break;
            
            default:
                this.showFeedback('info', `${item.name} 已激活`);
        }
        
        // 记录到游戏历史
        if (!Game.state.itemHistory) Game.state.itemHistory = [];
        Game.state.itemHistory.push({
            itemId: item.id,
            itemName: item.name,
            role: isOfficer ? 'officer' : 'applicant',
            timestamp: Date.now(),
            description: `${item.name} - ${item.effect}`
        });
    },
    
    // 隐藏面板
    hide() {
        const panel = document.getElementById('ItemQuickUsePanel');
        if (panel) {
            panel.classList.remove('active');
        }
    },
    
    // 显示视觉反馈（屏幕特效）
    playVisualEffect(effectName) {
        try {
            // 创建特效元素
            const effectEl = document.createElement('div');
            effectEl.className = `item-effect-${effectName}`;
            effectEl.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 9999;
                animation: fadeInOut 1s ease-in-out;
            `;
            
            // 根据不同特效应用样式
            switch(effectName) {
                case 'glow-green':
                    effectEl.style.boxShadow = 'inset 0 0 60px rgba(39, 174, 96, 0.5)';
                    break;
                case 'glow-blue':
                    effectEl.style.boxShadow = 'inset 0 0 60px rgba(52, 152, 219, 0.5)';
                    break;
                case 'pulse-orange':
                    effectEl.style.background = 'rgba(243, 156, 18, 0.2)';
                    break;
                case 'glow-gold':
                    effectEl.style.boxShadow = 'inset 0 0 80px rgba(241, 196, 15, 0.5)';
                    break;
            }
            
            document.body.appendChild(effectEl);
            
            // 1秒后移除
            setTimeout(() => {
                if (effectEl.parentNode) {
                    effectEl.parentNode.removeChild(effectEl);
                }
            }, 1000);
        } catch (e) {
            console.warn('视觉特效播放失败:', e);
        }
    },
    
    // 显示反馈消息
    showFeedback(type, message) {
        const colors = { success: '#27AE60', error: '#E74C3C', info: '#3498DB' };
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'item-feedback-toast';
        feedbackEl.textContent = message;
        feedbackEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-size: 1.1em;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: toastIn 0.3s ease, toastOut 0.3s ease 1.2s forwards;
        `;
        
        document.body.appendChild(feedbackEl);
        
        setTimeout(() => {
            if (feedbackEl.parentNode) {
                feedbackEl.parentNode.removeChild(feedbackEl);
            }
        }, 1500);
    },
    
    // 切换面板显示/隐藏
    toggle() {
        const panel = document.getElementById('ItemQuickUsePanel');
        if (panel && panel.classList.contains('active')) {
            this.hide();
        } else {
            this.show();
        }
    }
};
