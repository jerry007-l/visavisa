// 结算界面模块
const Result = {
    AUTO_RESTART_MS: 8000,
    
    show(result) {
        const title = document.getElementById('ResultTitle');
        const content = document.getElementById('ResultContent');
        if (!title || !content) return;
        
        const isOfficer = Game.state.playerRole === 'officer';
        const approved = result.verdict === 'approve';
        
        if (isOfficer) {
            title.textContent = result.success ? '🎉 判断正确！' : '❌ 判断失误';
        } else {
            title.textContent = approved ? '🎉 签证通过！' : '😢 签证被拒';
        }
        title.className = result.success ? 'result-success' : 'result-failure';
        
        const accuracy = Game.state.dialogueHistory.length > 0
            ? ((Game.state.dialogueHistory.filter(r => r.correct).length / Game.state.dialogueHistory.length) * 100).toFixed(1)
            : 0;
        
        // 决策之后才公开申请人的真实身份
        const identity = result.identity;
        const identityReveal = identity ? `
            <div class="identity-reveal" style="margin-top: 18px; padding: 14px; background: #F8F9FA; border-left: 4px solid ${identity.guilty ? '#E74C3C' : '#27AE60'}; border-radius: 8px; text-align: left;">
                <div style="font-size: 0.9em; color: #7F8C8D;">申请人的真实身份</div>
                <div style="font-size: 1.2em; font-weight: bold; margin: 6px 0;">
                    ${identity.icon} ${identity.name}
                    <span style="font-size: 0.75em; color: ${identity.guilty ? '#E74C3C' : '#27AE60'};">
                        ${identity.guilty ? '（应当拒签）' : '（可以放行）'}
                    </span>
                </div>
                <div style="font-size: 0.95em;">${identity.reason}</div>
                <div style="font-size: 0.85em; color: #7F8C8D; margin-top: 6px;">${identity.description}</div>
            </div>
        ` : '';
        
        content.innerHTML = `
            <div class="result-message">${result.message}</div>
            
            ${isOfficer ? `
                <div class="result-message" style="font-size: 0.95em; color: #7F8C8D;">
                    你的裁决：${approved ? '✅ 通过签证' : '❌ 拒绝签证'}
                </div>
            ` : ''}
            
            <div class="coin-change">
                ${result.coinChange > 0 ? '+' : ''}${result.coinChange} VC
            </div>
            
            <div class="result-details">
                <p>${isOfficer ? '判断表现' : '最终信任度'}: ${Game.state.score}/100</p>
                <p>面谈问题: ${Game.state.dialogueHistory.length} 个</p>
                <p>${isOfficer ? '判断正确率' : '回答正确率'}: ${accuracy}%</p>
                <p>剩余金币: ${result.newCoins} VC</p>
            </div>
            
            ${identityReveal}
            
            <div class="auto-refresh-timer" style="margin-top: 20px; text-align: center;">
                <p style="color: #7F8C8D; font-size: 0.9em;">🔄 <span id="RestartCountdown">${this.AUTO_RESTART_MS / 1000}</span> 秒后自动返回主菜单…</p>
                <div style="width: 200px; height: 6px; background: #ECF0F1; border-radius: 3px; margin: 10px auto;">
                    <div id="refreshProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3C3B6E 0%, #B22234 100%); border-radius: 3px;"></div>
                </div>
                <button class="btn-primary" onclick="Game.backToMain()" style="margin-top: 15px;">
                    🏠 立即返回主菜单
                </button>
            </div>
        `;
        
        // 只显示本局新解锁的成就
        Achievement.checkUnlocks();
        
        Game.updateCoinDisplay();
        SoundManager.play(result.success ? 'success' : 'fail');
        
        this.startAutoRestart();
    },
    
    // 倒计时结束后回主菜单；进度条与倒计时同步走完
    startAutoRestart() {
        clearInterval(this.restartInterval);
        clearTimeout(this.restartTimeout);
        
        const total = this.AUTO_RESTART_MS;
        const startedAt = Date.now();
        const progressBar = document.getElementById('refreshProgressBar');
        const countdown = document.getElementById('RestartCountdown');
        
        this.restartInterval = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const ratio = Math.min(1, elapsed / total);
            if (progressBar) progressBar.style.width = `${ratio * 100}%`;
            if (countdown) countdown.textContent = Math.max(0, Math.ceil((total - elapsed) / 1000));
            if (ratio >= 1) clearInterval(this.restartInterval);
        }, 50);
        
        this.restartTimeout = setTimeout(() => {
            console.log('🔄 结算结束，返回主菜单');
            Game.backToMain();
        }, total);
    },
    
    // 离开结算界面时取消自动重开，避免玩家回到主页后又被弹走
    cancelAutoRestart() {
        clearInterval(this.restartInterval);
        clearTimeout(this.restartTimeout);
    }
};
