// 道具商店模块
const Shop = {
    selectedItems: [],
    
    renderItems() {
        SoundManager.init(); // 初始化音频
        
        const container = document.getElementById('ShopItems');
        if (!container) {
            console.error('找不到 ShopItems 容器');
            return;
        }
        
        let html = '';
        
        // 渲染角色道具
        const roleItems = ITEMS[Game.state.playerRole === 'officer' ? 'officer' : 'applicant'];
        html += '<div class="item-category">🛒 辅助道具</div>';
        html += roleItems.map(item => `
            <div class="shop-item" onclick="Shop.selectItem('${item.id}')" id="item-${item.id}">
                <div class="item-icon">${item.name.split(' ')[0]}</div>
                <div class="item-name">${item.name.split(' ').slice(1).join(' ')}</div>
                <div class="item-desc">${item.desc}</div>
                <div class="item-price">💰 ${item.price} VC</div>
            </div>
        `).join('');
        
        // 渲染特殊道具（只有申请人能看到贿赂）
        if (Game.state.playerRole === 'applicant') {
            const specialItems = ITEMS.special.filter(i => i.type === 'bribe');
            html += '<div class="item-category">⚠️ 高风险操作</div>';
            html += specialItems.map(item => `
                <div class="shop-item bribe-item" onclick="Shop.selectItem('${item.id}')" id="item-${item.id}">
                    <div class="item-icon">${item.name.split(' ')[0]}</div>
                    <div class="item-name">${item.name.split(' ').slice(1).join(' ')}</div>
                    <div class="item-desc">${item.desc}</div>
                    <div class="item-price">💰 ${item.price} VC</div>
                    <div class="bribe-warning">⚡ 50%通过 / 50%拒签拉黑 ⚡</div>
                </div>
            `).join('');
        }
        
        container.innerHTML = html;
    },
    
    selectItem(itemId) {
        SoundManager.init();
            
        // 检查是否是贿赂道具
        const specialItem = ITEMS.special.find(i => i.id === itemId);
        if (specialItem && specialItem.type === 'bribe') {
            this.selectBribe(specialItem);
            return;
        }
            
        const item = ITEMS[Game.state.playerRole === 'officer' ? 'officer' : 'applicant']
            .find(i => i.id === itemId);
            
        if (!item) return;
            
        const index = this.selectedItems.indexOf(itemId);
        const buying = index === -1;
        
        if (buying && Game.state.coins < item.price) {
            SoundManager.play('fail');
            return;
        }
        
        // 消费必须真实落库，否则重开一局钱又全回来了
        Game.state.coins = UserData.updateCoins(buying ? -item.price : item.price);
        
        // 成就 item-collector 统计的是"买过的不同道具种类"，跨局累计
        if (buying) {
            UserData.recordSeen('purchasedItems', itemId);
        }
        
        const card = document.getElementById(`item-${itemId}`);
        if (buying) {
            this.selectedItems.push(itemId);
            if (card) card.classList.add('selected');
            SoundManager.play('coin');
        } else {
            this.selectedItems.splice(index, 1);
            if (card) card.classList.remove('selected');
            SoundManager.play('click');
        }
        
        Game.updateCoinDisplay();
    },
    
    // 贿赂逻辑
    selectBribe(bribeItem) {
        if (Game.state.coins < bribeItem.price) {
            SoundManager.play('fail');
            return;
        }
        
        // 200 VC 是全部初始资金，而且会直接跳过整局游戏，必须先确认
        const confirmed = window.confirm(
            `⚠️ 确认贿赂签证官？\n\n` +
            `花费：${bribeItem.price} VC（你当前 ${Game.state.coins} VC）\n` +
            `成功（50%）：直接过签，并返还 100 VC\n` +
            `败露（50%）：当场拒签并列入关注名单\n\n` +
            `注意：这会立刻结束本局，跳过材料审核和问答环节。`
        );
        if (!confirmed) return;
        
        // 先真实扣款落库，避免玩家在等待期间把钱花到别处
        Game.state.coins = UserData.updateCoins(-bribeItem.price);
        Game.updateCoinDisplay();
        SoundManager.play('alert');
        
        
        setTimeout(() => {
            const won = Math.random() < 0.5;
            
            if (won) {
                Game.state.score = 100;
                SoundManager.play('success');
            } else {
                Game.state.score = 0;
                SoundManager.play('fail');
            }
            
            setTimeout(() => {
                const result = Game.calculateResult(won, {
                    verdict: won ? 'approve' : 'reject',
                    // 成功：100 贿赂回报 + 80 通关奖励；失败：常规 -50
                    coinChange: won ? 180 : -50,
                    message: won
                        ? '贿赂成功!签证官欣然接受了好处，直接把章盖了下去…'
                        : '贿赂败露!签证官当场翻脸，把你的申请扔了回来…'
                });
                Game.showScreen('resultScreen');
                Result.show(result);
            }, 1200);
        }, 1000);
    },
    
    startTimer(seconds) {
        let timeLeft = seconds;
        const timerEl = document.getElementById('ShopTimer');
        timerEl.textContent = timeLeft;
        
        Game.state.timer = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(Game.state.timer);
                Game.confirmPurchase();
            }
        }, 1000);
    },
    
    getSelectedItems() {
        const roleItems = ITEMS[Game.state.playerRole === 'officer' ? 'officer' : 'applicant'];
        return this.selectedItems.map(id => roleItems.find(i => i.id === id));
    }
};
