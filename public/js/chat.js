// 聊天模块 - AI对话系统
const Chat = {
    messages: [],
    isOpen: false,
    
    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('chatPanel');
        panel.classList.toggle('active', this.isOpen);
    },
    
    addMessage(type, content) {
        const container = document.getElementById('ChatMessages');
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.innerHTML = `
            <div>${content}</div>
            <div class="chat-time">${time}</div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        this.messages.push({ type, content, time });
        
        // 只保留最近50条消息
        if (this.messages.length > 50) {
            this.messages.shift();
        }
    },
    
    // 开局前清空上一局的聊天记录：addMessage 只追加，50 条上限也只裁数组不删 DOM，
    // 页面不再整页刷新，所以必须显式清一次，否则新局里还看得到上局的对话
    reset() {
        this.messages = [];
        const container = document.getElementById('ChatMessages');
        if (container) container.innerHTML = '';
    },
    
    send() {
        const input = document.getElementById('ChatInput');
        const content = input.value.trim();
        
        if (!content) return;
        
        this.addMessage('player', content);
        input.value = '';

        // 成就 chat-master 依赖这个计数
        const stats = UserData.getData().stats;
        UserData.updateStats({ chatMessages: (stats.chatMessages || 0) + 1 });

        // AI自动回复
        setTimeout(() => {
            this.aiReply(content);
        }, 1000 + Math.random() * 2000);
    },
    
    aiReply(playerMessage) {
        const replies = [
            '嗯，我听到了',
            '继续说下去',
            '这个解释有点奇怪',
            '让我想想...',
            '你确定吗？',
            '好吧，继续下一个问题',
            '有意思',
            '我不太相信你的话',
            '你需要给我更多证据',
            '这个问题过去了，我们看下一一个'
        ];
        
        // 根据游戏状态调整回复
        let reply;
        if (Game.state.screen === 'dialogue') {
            reply = replies[Math.floor(Math.random() * replies.length)];
            this.addMessage('ai', reply);
        } else {
            reply = `收到，${Game.state.playerRole === 'officer' ? '申请人' : '签证官'}。`;
            this.addMessage('ai', reply);
        }
    }
};
