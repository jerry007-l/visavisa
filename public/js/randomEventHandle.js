// 随机事件处理 - 支持双角色视角
const RandomEvents = {
    currentEvent: null, // 保存当前事件
    
    handle(event) {
        this.currentEvent = event;
        
        const isOfficer = Game.state.playerRole === 'officer';
        const description = (isOfficer ? event.officerDesc : event.applicantDesc) || event.content || '';
        const choices = (isOfficer ? event.officerChoices : event.applicantChoices) || [];
        
        if (choices.length === 0) {
            console.error('❌ 事件缺少当前角色的选项:', event.id);
            document.getElementById('EventTitle').textContent = event.title;
            document.getElementById('EventContent').innerHTML = '<div class="event-description">⚡ 事件一闪而过，没有造成任何影响</div>';
            setTimeout(() => this.leave(), 1200);
            return;
        }
        
        document.getElementById('EventTitle').textContent = event.title;
        document.getElementById('EventContent').innerHTML = `
            <div class="event-description">${description}</div>
        `;
        
        document.getElementById('EventChoices').innerHTML = choices.map((choice, index) => `
            <button class="btn-event-choice" onclick="RandomEvents.choose(${index})">
                ${choice.text}
                <small>${choice.consequence || ''}</small>
            </button>
        `).join('');
    },
    
    choose(choiceIndex) {
        if (!this.currentEvent) {
            console.error('❌ 没有当前事件');
            return;
        }
        
        const isOfficer = Game.state.playerRole === 'officer';
        const choices = (isOfficer ? this.currentEvent.officerChoices : this.currentEvent.applicantChoices) || [];
        const choice = choices[choiceIndex];
        
        if (!choice) {
            console.error('❌ 选项不存在:', choiceIndex);
            return;
        }
        
        SoundManager.play('click');
        
        // 📜 法律免责声明：负面效果打八折
        const soften = (amount) => (Game.state.lenientScoring && amount < 0)
            ? Math.round(amount * 0.8)
            : amount;
        
        const scoreWord = isOfficer ? '准确度' : '信任度';
        
        if (choice.risky) {
            // 高风险选择：五五开
            if (Math.random() < 0.5) {
                Game.state.score += 10;
                this.note(`✅ 赌赢了！${scoreWord}+10`);
                SoundManager.play('success');
            } else {
                Game.state.score += soften(-15);
                this.note(`❌ 赌输了！${scoreWord}${soften(-15)}`);
                SoundManager.play('fail');
            }
        } else if (choice.trustChange) {
            const delta = soften(choice.trustChange);
            Game.state.score += delta;
            SoundManager.play(delta > 0 ? 'success' : delta < 0 ? 'fail' : 'click');
        }
        
        Game.state.score = Math.max(0, Math.min(100, Game.state.score));
        
        // 暴露线索：从申请人身份里挖出一条真实线索，而不是只发一句空提示
        if (choice.clueReveal) {
            if (isOfficer) {
                Game.revealClue(1);
            } else {
                this.note('💡 你说漏了嘴，暴露了一些线索！');
            }
            SoundManager.play('alert');
        }
        
        setTimeout(() => this.leave(), 2000);
    },
    
    // 事件结果就地写进事件面板：选择后界面只停留约 2 秒，这是玩家看到结果的唯一窗口
    note(text) {
        const box = document.getElementById('EventContent');
        if (box) box.insertAdjacentHTML('beforeend', `<div class="event-outcome">${text}</div>`);
    },

    // 离开事件界面，回到对话环节并把被打断的那一题续上
    leave() {
        Game.showScreen('dialogue');
        if (typeof Dialogue !== 'undefined' && Dialogue.resumeAfterEvent) {
            Dialogue.resumeAfterEvent();
        }
    }
};
