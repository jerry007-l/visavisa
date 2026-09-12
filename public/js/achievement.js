// 成就系统模块
const Achievement = {
    justUnlocked: [],

    checkAchievements(success, detail = {}) {
        this.justUnlocked = [];

        const data = UserData.getData();
        const stats = data.stats;
        const state = Game.state;
        const isOfficer = state.playerRole === 'officer';

        const usedItems = (state.usedItemIds || []).length;
        const coinChange = detail.coinChange || 0;
        const roundLoss = (state.startCoins != null) ? state.startCoins - data.coins : 0;
        const durationMs = state.gameStartTime ? Date.now() - state.gameStartTime : Infinity;
        const history = state.dialogueHistory || [];
        const noMiss = history.length > 0 && history.every(record => record.correct);

        const fakes = (state.drawnMaterials || [])
            .filter(mat => state.materialFake[mat.id])
            .map(mat => mat.id);
        const allFakesCaught = fakes.length > 0 && fakes.every(id => (state.materialRevealed || []).includes(id));

        const checks = [
            { id: 'first-game', condition: stats.gamesPlayed >= 1 },
            { id: 'god-deceiver', condition: success && !isOfficer },
            { id: 'fire-eyed', condition: (stats.fraudstersCaught || 0) >= 5 },
            { id: 'tuhao', condition: usedItems >= 3 },
            { id: 'zero-items', condition: success && usedItems === 0 },
            { id: 'coin-gain', condition: coinChange > 150 },
            { id: 'coin-loss', condition: roundLoss > 100 },
            { id: 'rich-list', condition: data.coins >= 1000 },
            { id: 'perfect-clear', condition: success && noMiss && durationMs <= 8 * 60 * 1000 },
            { id: 'laugh-out-loud', condition: (stats.randomEvents || 0) >= 10 },
            { id: 'officer-legend', condition: isOfficer && (stats.officerStreak || 0) >= 5 },
            { id: 'applicant-legend', condition: !isOfficer && (stats.applicantStreak || 0) >= 5 },
            { id: 'material-master', condition: isOfficer && success && allFakesCaught },
            { id: 'question-veteran', condition: data.seenQuestions.length >= 50 },
            { id: 'event-hunter', condition: data.seenEvents.length >= RANDOM_EVENTS.length },
            { id: 'item-collector', condition: data.purchasedItems.length >= 8 },
            { id: 'replay-king', condition: Object.values(data.questionCounts).some(count => count >= 5) },
            { id: 'chat-master', condition: (stats.chatMessages || 0) >= 100 }
        ];

        let unlocked = 0;
        checks.forEach(({ id, condition }) => {
            if (condition && !UserData.hasAchievement(id)) {
                if (UserData.addAchievement(id)) {
                    this.justUnlocked.push(id);
                    this.unlockNotification(id);
                    unlocked++;
                }
            }
        });

        if (unlocked > 0) {
            setTimeout(() => SoundManager.play('achievement'), 500);
        }
        return unlocked;
    },

    // 结算界面只展示本局真正新解锁的成就，而不是历史上所有已解锁的
    checkUnlocks() {
        const container = document.getElementById('AchievementUnlocks');
        if (!container) return;

        const newlyUnlocked = this.justUnlocked
            .map(id => ACHIEVEMENTS.find(achievement => achievement.id === id))
            .filter(Boolean);

        if (newlyUnlocked.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="achievement-unlocks">
                <h3>🏆 新成就解锁！</h3>
                <div class="achievement-list">
                    ${newlyUnlocked.map(a => `
                        <div class="achievement-item">${a.icon} ${a.name}</div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    unlockNotification(id) {
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (!achievement) return;
        Chat.addMessage('system', `🏆 成就解锁：${achievement.name} - ${achievement.desc}`);
        SoundManager.play('success');
    },

    showList() {
        const data = UserData.getData();
        const unlocked = ACHIEVEMENTS.filter(a => data.achievements.includes(a.id)).length;

        let html = `🏆 成就系统 (${unlocked}/${ACHIEVEMENTS.length})\n\n`;
        ACHIEVEMENTS.forEach(achievement => {
            const isUnlocked = data.achievements.includes(achievement.id);
            html += `${isUnlocked ? '✅' : '⬜'} ${achievement.name}\n   ${achievement.desc}\n\n`;
        });

        alert(html);
    }
};
