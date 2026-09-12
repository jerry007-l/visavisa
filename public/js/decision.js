// 最终决策模块
const Decision = {
    renderSummary() {
        const summary = document.getElementById('DecisionSummary');
        if (!summary) return;
        
        const isOfficer = Game.state.playerRole === 'officer';
        
        let html = `
            <div class="summary-section">
                <h3>📊 ${isOfficer ? '判断表现' : '签证官信任度'}</h3>
                <div class="score-display">${Game.state.score}/100</div>
                <p>${isOfficer
                    ? (Game.state.score >= 70 ? '你对申请人的判断相当准确' : '你对申请人的判断偏差较大')
                    : (Game.state.score >= 70 ? '达到通过标准' : '未达通过标准')}</p>
            </div>
            
            <div class="summary-section">
                <h3>📝 面谈记录</h3>
                <div class="answers-list">
        `;
        
        Game.state.dialogueHistory.forEach((record, index) => {
            // 签证官视角不能显示每题的对错，否则等于提前公布答案
            const mark = isOfficer
                ? ''
                : `<span>${record.correct ? '✅' : '❌'}</span>`;
            html += `
                <div class="answer-item ${isOfficer ? '' : (record.correct ? 'correct' : 'wrong')}">
                    <span>Q${index + 1}: ${record.question.slice(0, 30)}… → ${record.answer}</span>
                    ${mark}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        if (isOfficer) {
            const clues = Game.state.revealedClues || [];
            html += `
                <div class="summary-section">
                    <h3>💡 已掌握的线索 (${clues.length})</h3>
                    ${clues.length > 0
                        ? `<ul style="text-align: left; margin: 8px 0; padding-left: 20px; line-height: 1.8;">
                               ${clues.map(clue => `<li>${clue}</li>`).join('')}
                           </ul>`
                        : '<p style="color: #7F8C8D;">没有收集到任何线索，只能凭感觉判断了</p>'}
                </div>
                <div class="summary-section">
                    <h3>⚖️ 做出裁决</h3>
                    <p style="color: #7F8C8D; font-size: 0.9em;">
                        放行不该放行的人会失职，拒签无辜的人同样算失误。<br>
                        「主动结束」表示移交上级，按你本局的判断表现结算。
                    </p>
                </div>
            `;
        }
        
        summary.innerHTML = html;
        
        const officerBtns = document.getElementById('OfficerDecisionBtns');
        const applicantNotice = document.getElementById('ApplicantNotice');
        
        if (!isOfficer) {
            if (officerBtns) officerBtns.style.display = 'none';
            if (applicantNotice) applicantNotice.style.display = 'block';
        } else {
            if (officerBtns) officerBtns.style.display = 'flex';
            if (applicantNotice) applicantNotice.style.display = 'none';
        }
    },
    
    calculate(decision) {
        if (Game.state.playerRole !== 'officer') {
            // 申请人模式：信任度达标即通过
            const success = Game.state.score >= 70;
            return Game.calculateResult(success, {
                verdict: success ? 'approve' : 'reject'
            });
        }
        
        const identity = Game.state.applicantIdentity;
        // 身份缺失时按"应当拒签"处理，避免把未知申请人默认放行
        const shouldReject = !identity || identity.guilty !== false;
        const truth = shouldReject ? '这个人确实不该获签' : '这个人是清白的，本该获签';
        
        let success;
        let reason;
        
        if (decision === 'approve') {
            success = !shouldReject;
            reason = success
                ? `你放行了一个真正的合格申请人。${truth}。`
                : `你放行了一个不该获签的人。${truth}。`;
        } else if (decision === 'reject') {
            success = shouldReject;
            reason = success
                ? `你拦下了一个不合格的申请。${truth}。`
                : `你拒签了一个无辜的申请人。${truth}。`;
        } else {
            // submit / auto：移交上级，按本局判断表现结算
            success = Game.state.score >= 70;
            reason = success
                ? `上级采纳了你的面谈记录。${truth}。`
                : `上级认为你的面谈记录不足以支撑判断。${truth}。`;
        }
        
        return Game.calculateResult(success, {
            verdict: decision === 'approve' ? 'approve' : 'reject',
            reason
        });
    },
    
    makeDecision(decision) {
        const result = this.calculate(decision);
        Game.showScreen('resultScreen');
        Result.show(result);
    }
};
