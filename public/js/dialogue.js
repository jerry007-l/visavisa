// 对话问答模块
const Dialogue = {
    currentQuestion: null,
    currentAiAnswer: null,   // 签证官模式下 AI 给出的回答：{ text, lied }
    timer: null,
    questionIndex: 0,
    questions: [],
    awaitingEventReturn: false,
    optionOrder: [],         // 本题选项的显示顺序：optionOrder[显示位置] = 原始下标
    
    BASE_SECONDS: 30,
    
    init() {
        // 每局都从干净状态开始，避免上一局的题目残留
        this.questionIndex = 0;
        this.questions = [];
        this.currentQuestion = null;
        this.currentAiAnswer = null;
        this.awaitingEventReturn = false;
        this.optionOrder = [];
        
        this.generateQuestions();
        
        if (this.questions.length === 0) {
            console.error('❌ 错误：没有生成任何题目！');
            alert('无法加载题目，请刷新页面重试');
            return;
        }
        
        const totalRoundsEl = document.getElementById('TotalRounds');
        if (totalRoundsEl) {
            totalRoundsEl.textContent = Game.state.totalRounds;
        }
        
        if (Game.state.playerRole === 'officer') {
            Chat.addMessage('system', '👔 你是签证官！听申请人的回答，判断他有没有说谎');
        } else {
            Chat.addMessage('system', '🧳 你是申请人！选出最能骗过签证官的答案');
        }
        
        this.showNextQuestion();
    },
    
    // 确保状态正确（用于从随机事件返回时调用）
    ensureState() {
        if (!this.questions || this.questions.length === 0) {
            this.generateQuestions();
        }
        
        if (!this.currentQuestion) {
            this.showNextQuestion();
        }
    },
    
    generateQuestions() {
        const allQuestions = [
            ...QUESTION_BANK.strangePurpose,
            ...QUESTION_BANK.materialQuestion,
            ...QUESTION_BANK.drinkRelated,
            ...QUESTION_BANK.stressTest,
            ...QUESTION_BANK.funnySituation
        ];
        
        // 随机抽取8题（allQuestions 已是新数组，sort 不会污染题库）
        this.questions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 8);
    },
    
    showNextQuestion() {
        // 🧠 记忆魔法：签证官"忘记"下一个问题
        while (Game.state.skipNextQuestion && this.questionIndex < this.questions.length) {
            Game.state.skipNextQuestion = false;
            const skipped = this.questions[this.questionIndex];
            Chat.addMessage('system', `🧠 记忆魔法生效：签证官忘记了「${skipped.q.slice(0, 12)}…」这个问题`);
            this.questionIndex++;
        }
        
        if (this.questionIndex >= this.questions.length) {
            this.endDialogue();
            return;
        }
        
        this.currentQuestion = this.questions[this.questionIndex];
        Game.state.questionIndex = this.questionIndex;
        
        const isOfficer = Game.state.playerRole === 'officer';
        this.currentAiAnswer = isOfficer ? this.generateAiAnswer() : null;
        this.optionOrder = this.shuffleOptionOrder(this.currentQuestion.a.length);
        
        const currentRoundEl = document.getElementById('CurrentRound');
        if (currentRoundEl) {
            currentRoundEl.textContent = Game.state.currentRound;
        }
        
        const questionArea = document.getElementById('QuestionArea');
        if (!questionArea) {
            console.error('❌ 找不到 QuestionArea 元素');
            return;
        }
        
        questionArea.innerHTML = isOfficer
            ? `
                <div class="question-text">${this.currentQuestion.q}</div>
                <div style="margin-top: 15px; padding: 15px; background: #FFF3CD; border-radius: 10px;">
                    <strong>👤 申请人回答：</strong>
                    <p style="margin: 10px 0; font-size: 1.1em;">${this.currentAiAnswer.text}</p>
                </div>
                ${Game.state.suspicionRadar ? this.renderSuspicionRadar() : ''}
                <div style="margin-top: 10px; color: #7F8C8D;">判断这个回答是否诚实可信</div>
            `
            : `
                <div class="question-text">${this.currentQuestion.q}</div>
                <div class="question-hint">💡 提示：${this.currentQuestion.hint}</div>
            `;
        
        const optionsArea = document.getElementById('AnswerOptions');
        if (optionsArea) {
            if (isOfficer) {
                optionsArea.innerHTML = `
                    <button class="btn-option" onclick="Dialogue.answer(0)" style="background: #27AE60; color: white;">
                        ✅ 认可 - 他说的是实话
                    </button>
                    <button class="btn-option" onclick="Dialogue.answer(1)" style="background: #E74C3C; color: white;">
                        ❌ 不认可 - 他在说谎
                    </button>
                `;
            } else {
                // 按打乱后的顺序渲染，但 onclick 传原始下标：
                // answer() 的判分和 answerText 取值都不用改
                optionsArea.innerHTML = this.optionOrder.map(originalIndex => `
                    <button class="btn-option" onclick="Dialogue.answer(${originalIndex})">${this.currentQuestion.a[originalIndex]}</button>
                `).join('');
            }
        }
        
        Chat.addMessage('system', `问题 ${this.questionIndex + 1}：${this.currentQuestion.q}`);
        
        this.startRoundTimer();
        
        // 🎭 人格切换：本题自动选出最优答案
        if (!isOfficer && Game.state.autoAnswerRounds > 0) {
            Game.state.autoAnswerRounds--;
            Chat.addMessage('system', '🎭 人格切换生效：本题自动选择最优答案');
            setTimeout(() => this.answer(this.currentQuestion.answer), 900);
        }
    },
    
    // Fisher-Yates：返回 0..count-1 的一个等概率随机排列
    shuffleOptionOrder(count) {
        const order = Array.from({ length: count }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        return order;
    },
    
    // 📊 AI情绪分析道具：每轮给出可疑度读数，但有 30% 概率读反
    renderSuspicionRadar() {
        const trueLevel = this.currentAiAnswer.lied ? 80 : 20;
        const flipped = Math.random() >= 0.7;
        const base = flipped ? 100 - trueLevel : trueLevel;
        const reading = Math.max(0, Math.min(100, base + Math.floor(Math.random() * 21) - 10));
        
        return `
            <div style="margin-top: 12px; padding: 10px 15px; background: #EAF2F8; border-radius: 10px; font-size: 0.95em;">
                📊 AI情绪分析：可疑度 <strong>${reading}%</strong>
                <span style="color: #7F8C8D;">（该读数并非绝对可靠）</span>
            </div>
        `;
    },
    
    // AI 根据身份生成回答，并记录这一轮它到底有没有说谎
    generateAiAnswer() {
        const question = this.currentQuestion;
        const identity = Game.state.applicantIdentity;
        const honestAnswer = question.a[question.answer];
        
        let lieChance;
        if (!identity) {
            lieChance = 0.3;
        } else if (!identity.guilty) {
            // 清白申请人基本说实话，但看起来可疑的那几类偶尔也会答岔
            lieChance = identity.difficulty >= 2 ? 0.25 : 0.12;
        } else {
            lieChance = identity.difficulty >= 3 ? 0.75 : identity.difficulty >= 2 ? 0.55 : 0.35;
        }
        
        // ⚡ 连环追问会持续施压，说谎更容易露馅
        if (Game.state.pressureMode) {
            lieChance = Math.min(0.95, lieChance + 0.2);
        }
        
        const wrongAnswers = question.a.filter((_, idx) => idx !== question.answer);
        if (wrongAnswers.length === 0) {
            return { text: honestAnswer, lied: false };
        }
        
        if (Math.random() < lieChance) {
            return {
                text: wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)],
                lied: true
            };
        }
        
        return { text: honestAnswer, lied: false };
    },
    
    answer(index) {
        clearInterval(this.timer);
        this.timer = null;
        SoundManager.play('click');
        
        const isOfficer = Game.state.playerRole === 'officer';
        const timedOut = index < 0;
        let correct;
        let answerText;
        
        if (isOfficer) {
            // 0 = 认可（判定诚实），1 = 不认可（判定说谎）
            const judgedHonest = index === 0;
            const actuallyHonest = !this.currentAiAnswer.lied;
            correct = !timedOut && judgedHonest === actuallyHonest;
            answerText = timedOut ? '（超时未判断）' : (judgedHonest ? '✅ 认可' : '❌ 不认可');
        } else {
            correct = !timedOut && index === this.currentQuestion.answer;
            answerText = timedOut ? '（超时未作答）' : this.currentQuestion.a[index];
        }
        
        if (correct) {
            Game.state.score += 5;
            Chat.addMessage('system', isOfficer ? '✅ 判断正确！准确度+5' : '✅ 回答正确！信任度+5');
            SoundManager.play('success');
        } else {
            // 📜 法律免责声明：扣分打八折
            const penalty = Game.state.lenientScoring ? 8 : 10;
            Game.state.score -= penalty;
            Chat.addMessage('system', `❌ ${isOfficer ? '判断失误' : '回答有问题'}！${isOfficer ? '准确度' : '信任度'}-${penalty}`);
            SoundManager.play('fail');
        }
        
        Game.state.score = Math.max(0, Math.min(100, Game.state.score));
        
        // 跨局累计答题记录，成就 question-veteran / replay-king 依赖这两项
        const questionText = this.currentQuestion.q;
        UserData.recordSeen('seenQuestions', questionText);
        UserData.countQuestion(questionText);
        
        Game.state.dialogueHistory.push({
            question: questionText,
            answer: answerText,
            correct,
            applicantLied: isOfficer ? this.currentAiAnswer.lied : null
        });
        
        // 判断失误时更容易触发随机事件（最多3次）
        if (!correct && Math.random() < 0.3 && Game.state.randomEventTriggered.length < 3) {
            this.awaitingEventReturn = true;
            Game.triggerRandomEvent();
            return;
        }
        
        setTimeout(() => this.advance(), 1500);
    },
    
    // 进入下一题
    advance() {
        this.questionIndex++;
        Game.state.currentRound = Math.min(
            Game.state.totalRounds,
            Math.ceil(this.questionIndex / 2)
        );
        this.showNextQuestion();
    },
    
    // 随机事件结束后回到对话环节时调用
    resumeAfterEvent() {
        if (!this.awaitingEventReturn) return;
        this.awaitingEventReturn = false;
        this.advance();
    },
    
    startRoundTimer() {
        clearInterval(this.timer);
        
        let seconds = this.BASE_SECONDS;
        // ☕ 三倍咖啡因：接下来两轮答题时间延长
        if (Game.state.timeBonusRounds > 0 && Game.state.timeBonus > 0) {
            seconds += Game.state.timeBonus;
            Game.state.timeBonusRounds--;
            Chat.addMessage('system', `☕ 咖啡因生效：本题答题时间 +${Game.state.timeBonus} 秒`);
        }
        
        const timerBar = document.getElementById('TimerBar');
        const timerText = document.getElementById('TimerText');
        if (!timerBar || !timerText) return;
        
        const total = seconds;
        // 清掉上一题留下的红色告警样式
        timerBar.style.background = '';
        timerBar.style.width = '100%';
        timerText.textContent = `${seconds}s`;
        
        this.timer = setInterval(() => {
            seconds--;
            timerText.textContent = `${seconds}s`;
            timerBar.style.width = `${Math.max(0, (seconds / total) * 100)}%`;
            
            if (seconds <= 10) {
                timerBar.style.background = 'linear-gradient(90deg, #E74C3C 0%, #C0392B 100%)';
            }
            
            if (seconds <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                Chat.addMessage('system', '⏰ 时间到！');
                this.answer(-1);
            }
        }, 1000);
    },
    
    endDialogue() {
        clearInterval(this.timer);
        this.timer = null;
        Chat.addMessage('system', '对话环节结束！即将进入最终决策');
        setTimeout(() => {
            Game.goToFinalDecision();
        }, 2000);
    }
};
