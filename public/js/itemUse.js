// 道具使用模块
const ItemUse = {
    usedItems: [],
    
    // 渲染可用道具列表
    renderAvailableItems() {
        SoundManager.init();
        
        const container = document.getElementById('ItemList');
        if (!container) {
            console.error('找不到 ItemList 容器');
            return;
        }
        
        const purchasedItems = Shop.getSelectedItems();
        
        if (purchasedItems.length === 0) {
            container.innerHTML = '<p class="hint-text">你还没有购买任何道具</p>';
            return;
        }
        
        container.innerHTML = purchasedItems.map(item => {
            const isUsed = this.usedItems.includes(item.id);
            return `
                <div class="shop-item ${isUsed ? 'used' : ''}" onclick="${isUsed ? '' : `ItemUse.toggleUse('${item.id}')`}">
                    <div class="item-icon">${item.name.split(' ')[0]}</div>
                    <div class="item-name">${item.name.split(' ').slice(1).join(' ')}</div>
                    <div class="item-desc">${item.desc}</div>
                    <div class="item-effect">✨ ${item.effect}</div>
                    <div class="use-status">${isUsed ? '✅ 已使用' : '⭕ 未使用'}</div>
                </div>
            `;
        }).join('');
    },
    
    // 切换道具使用状态
    toggleUse(itemId) {
        SoundManager.init();
        
        const index = this.usedItems.indexOf(itemId);
        if (index > -1) {
            // 取消使用
            this.usedItems.splice(index, 1);
            Chat.addMessage('system', `已取消使用 ${this.getItemName(itemId)}`);
        } else {
            // 标记为使用
            this.usedItems.push(itemId);
            Chat.addMessage('system', `标记使用 ${this.getItemName(itemId)}`);
        }
        
        // 重新渲染
        this.renderAvailableItems();
    },
    
    // 获取道具名称
    getItemName(itemId) {
        const items = ITEMS[Game.state.playerRole === 'officer' ? 'officer' : 'applicant'];
        const item = items.find(i => i.id === itemId);
        return item ? item.name : itemId;
    },
    
    // 应用使用道具的效果
    applyUsedEffects() {
        if (this.usedItems.length === 0) {
            Chat.addMessage('system', '没有道具被使用');
            return;
        }
        
        Chat.addMessage('system', `使用了 ${this.usedItems.length} 个道具！效果将在游戏中生效`);
        
        // TODO: 根据道具ID应用不同的效果到游戏状态
        // 这里先记录已使用的道具，在后续环节中检查
        Game.state.usedItemIds = this.usedItems;
    },
    
    // 清除使用记录（重新开始时使用）
    clearUsedItems() {
        this.usedItems = [];
    }
};
