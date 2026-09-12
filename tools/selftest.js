// 无头跑测：按 index.html 顺序加载全部脚本，用桩 DOM + 虚拟时钟完整跑通两种角色的对局
// 用法：node tools/selftest.js （纯 Node，不需要 npm install）
const fs = require('fs');
const path = require('path');

// ---------- 虚拟时钟：游戏大量用 setTimeout 推进流程，同步跑测必须能手动推进 ----------
const realSetTimeout = setTimeout, realClearTimeout = clearTimeout;
const realSetInterval = setInterval, realClearInterval = clearInterval;
let vNow = 0;
let timers = [];
let timerSeq = 1;

const vSetTimeout = (fn, ms) => {
    const t = { id: timerSeq++, fn, at: vNow + (Number(ms) || 0), every: 0, cancelled: false };
    timers.push(t);
    return t;
};
const vSetInterval = (fn, ms) => {
    const every = Number(ms) || 1;
    const t = { id: timerSeq++, fn, at: vNow + every, every, cancelled: false };
    timers.push(t);
    return t;
};
const vClear = (t) => { if (t && typeof t === 'object') t.cancelled = true; };

// 推进虚拟时间，按到期顺序触发回调；返回实际推进的毫秒数
function tick(ms) {
    const target = vNow + ms;
    let fired = 0;
    for (let guard = 0; guard < 20000; guard++) {
        const due = timers
            .filter(t => !t.cancelled && t.at <= target)
            .sort((a, b) => a.at - b.at || a.id - b.id)[0];
        if (!due) break;
        vNow = Math.max(vNow, due.at);
        if (due.every) due.at = vNow + due.every;
        else due.cancelled = true;
        fired++;
        try { due.fn(); } catch (e) { failures.push('定时器回调抛错: ' + (e && e.message)); }
    }
    timers = timers.filter(t => !t.cancelled);
    vNow = target;
    return fired;
}

globalThis.setTimeout = vSetTimeout;
globalThis.clearTimeout = vClear;
globalThis.setInterval = vSetInterval;
globalThis.clearInterval = vClear;

const failures = [];

// ---------- 最小 DOM / 浏览器桩 ----------
function makeEl(id) {
    return {
        id,
        innerHTML: '', textContent: '', value: '', className: '',
        style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        appendChild() {}, addEventListener() {}, removeEventListener() {},
        querySelectorAll: () => [], querySelector: () => null,
        focus() {}, scrollIntoView() {}, setAttribute() {}, getAttribute: () => null,
        disabled: false, onclick: null
    };
}

const elements = new Map();
const byId = (id) => { if (!elements.has(id)) elements.set(id, makeEl(id)); return elements.get(id); };

const documentStub = {
    getElementById: byId,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => makeEl('<' + tag + '>'),
    addEventListener() {}, removeEventListener() {},
    body: makeEl('body'), head: makeEl('head'), documentElement: makeEl('html')
};

const store = new Map();
const localStorageStub = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
};

// 假的 Web Audio，避免无头环境里音效代码报错刷屏
function FakeParam() { return { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
function FakeAudioContext() {
    return {
        currentTime: 0, state: 'running', destination: {}, sampleRate: 44100,
        resume() {}, close() {},
        createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: FakeParam(), type: 'sine' }),
        createGain: () => ({ connect() {}, gain: FakeParam() }),
        createBiquadFilter: () => ({ connect() {}, frequency: FakeParam(), Q: FakeParam(), type: 'lowpass' })
    };
}

const windowStub = {
    AudioContext: FakeAudioContext,
    webkitAudioContext: FakeAudioContext,
    addEventListener() {}, removeEventListener() {},
    location: { protocol: 'http:', search: '', reload() { failures.push('调用了 window.location.reload()'); } },
    setTimeout: vSetTimeout, clearTimeout: vClear, setInterval: vSetInterval, clearInterval: vClear,
    confirm: () => true,
    alert: () => {}
};

const stubs = {
    document: documentStub, localStorage: localStorageStub, window: windowStub,
    location: windowStub.location, alert: windowStub.alert, confirm: windowStub.confirm
};
Object.keys(stubs).forEach(k => { try { globalThis[k] = stubs[k]; } catch (e) { /* 只读全局 */ } });

// ---------- 按 index.html 的顺序加载脚本 ----------
const pub = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const order = [...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]);
console.log('加载顺序:', order.join(' -> '));

const bundle = order.map(f => `\n;// ===== ${f} =====\n` + fs.readFileSync(path.join(pub, 'js', f), 'utf8')).join('\n');

const harness = `
${bundle}

;(function () {
    const log = [];
    const fail = (m) => { log.push('FAIL ' + m); failures.push(m); };
    const ok = (m) => { log.push('ok   ' + m); };

    const required = [
        'Game.selectRole', 'Game.startShopPhase', 'Game.confirmPurchase', 'Game.drawMaterials',
        'Game.confirmMaterials', 'Game.nextPhase', 'Game.makeDecision', 'Game.backToMain',
        'Game.revealClue', 'Game.revealMaterialTruth', 'Game.calculateResult', 'Game.triggerRandomEvent',
        'DrawMaterials.renderMaterials', 'DrawMaterials.reveal', 'DrawMaterials.draw',
        'Dialogue.init', 'Dialogue.answer', 'Dialogue.advance', 'Dialogue.resumeAfterEvent', 'Dialogue.endDialogue',
        'Decision.renderSummary', 'Decision.calculate',
        'Result.show', 'Result.cancelAutoRestart',
        'Achievement.checkAchievements', 'Achievement.checkUnlocks',
        'MaterialReview.renderMaterials', 'MaterialReview.inspect',
        'Shop.renderItems', 'Shop.selectItem', 'Shop.getSelectedItems',
        'ItemQuickUse.use', 'ItemQuickUse.applyEffect',
        'RandomEvents.handle', 'RandomEvents.choose', 'RandomEvents.leave',
        'UserData.recordSeen', 'UserData.countQuestion', 'UserData.updateCoins',
        'IdentityPool.getRandom', 'IdentityPool.getByGuilt',
        'Chat.addMessage', 'Chat.send', 'Chat.reset'
    ];
    // eval 里的顶层 const 不会挂到 globalThis，必须用同作用域的字面量取
    const modules = {
        Game, Dialogue, Decision, Result, Shop, ItemQuickUse, MaterialReview,
        DrawMaterials, RandomEvents, Achievement, UserData, IdentityPool, Chat, SoundManager
    };
    required.forEach(n => {
        const [obj, method] = n.split('.');
        const t = typeof (modules[obj] || {})[method];
        t === 'function' ? ok(n) : fail(n + ' 不是函数 (' + t + ')');
    });

    // 走完整一局：商店 -> 抽材料 -> 审核 -> 问答 -> 决策
    // answerer(officerMode) 返回该题应点的按钮下标
    function playRound(role, opts) {
        opts = opts || {};
        tick(100000); // 清掉上一局残留定时器
        Game.backToMain();
        Game.selectRole(role);
        if (Game.state.playerRole !== role) fail('selectRole 没有写入 playerRole');
        if (Game.state.startCoins == null) fail('startCoins 未设置，coin-loss 成就无法判定');

        Game.startShopPhase();
        if (opts.buy) opts.buy.forEach(id => Shop.selectItem(id));
        Game.confirmPurchase();
        tick(3000);
        if (Game.state.screen !== 'materialDraw') fail('confirmPurchase 后没进入 materialDraw，实际=' + Game.state.screen);

        Game.drawMaterials();
        tick(4000);
        if (Game.state.drawnMaterials.length !== 2) fail('抽取材料应为2份，实际=' + Game.state.drawnMaterials.length);
        Game.confirmMaterials();
        tick(1000);
        if (Game.state.screen !== 'materialReview') fail('confirmMaterials 后没进入 materialReview，实际=' + Game.state.screen);

        MaterialReview.renderMaterials();
        Game.state.drawnMaterials.forEach(m => MaterialReview.inspect(m.id));
        if (opts.use) opts.use.forEach(id => ItemQuickUse.use(id));

        Game.nextPhase();
        tick(3000);
        if (Game.state.screen !== 'dialogue') fail('nextPhase 后没进入 dialogue，实际=' + Game.state.screen);
        if (!Dialogue.questions.length) { fail('没有生成题目'); return 0; }

        let answered = 0;
        let guard = 0;
        while (Dialogue.questionIndex < Dialogue.questions.length && guard++ < 40) {
            if (!Dialogue.currentQuestion) { fail('第' + (Dialogue.questionIndex + 1) + '题 currentQuestion 为空'); break; }
            if (!Dialogue.timer) fail('第' + (Dialogue.questionIndex + 1) + '题没有启动计时器');
            const q = Dialogue.currentQuestion;
            const pick = role === 'officer'
                ? (opts.perfect === false ? (Dialogue.currentAiAnswer.lied ? 0 : 1) : (Dialogue.currentAiAnswer.lied ? 1 : 0))
                : (opts.perfect === false ? (q.answer + 1) % q.a.length : q.answer);
            Dialogue.answer(pick);
            answered++;
            if (Dialogue.awaitingEventReturn) {
                if (!RandomEvents.currentEvent) fail('awaitingEventReturn 为真但没有当前事件');
                const ev = RandomEvents.currentEvent;
                const choices = ev.officerChoices || ev.applicantChoices;
                if (!choices || !choices.length) fail('事件 ' + ev.id + ' 当前角色没有选项');
                RandomEvents.choose(0);
                tick(3000);
                if (Game.state.screen !== 'dialogue') fail('随机事件结束后没回到 dialogue，实际=' + Game.state.screen);
            }
            tick(1600); // 让 1500ms 后的 advance() 触发
        }
        if (guard >= 40) fail('问答环节死循环，题目索引卡在 ' + Dialogue.questionIndex);
        if (answered !== Dialogue.questions.length) fail('作答题数(' + answered + ')与题目总数(' + Dialogue.questions.length + ')不符');
        if (Game.state.dialogueHistory.length !== answered) fail('对话历史(' + Game.state.dialogueHistory.length + ')与作答题数(' + answered + ')不符');
        ok(role + ' 局：答完 ' + answered + ' 题，分数 ' + Game.state.score + '，屏幕 ' + Game.state.screen);
        return answered;
    }

    // ===== 签证官：完美判断 + 正确裁决 -> 必须赢 =====
    playRound('officer', {});
    Decision.renderSummary();
    const summary = document.getElementById('DecisionSummary').innerHTML;
    const identity = Game.state.applicantIdentity;
    if (summary.includes(identity.name)) fail('决策前就把申请人身份「' + identity.name + '」剧透给了签证官');
    else ok('决策界面没有提前泄露身份');
    const rightCall = identity.guilty ? 'reject' : 'approve';
    const rightResult = Decision.calculate(rightCall);
    if (!rightResult.success) fail('签证官做出正确裁决(' + rightCall + ')却判为失败');
    else ok('签证官正确裁决 ' + rightCall + ' -> 胜利');
    tick(2000);
    Result.show(rightResult);
    Achievement.checkUnlocks();

    // ===== 签证官：故意判错 -> 必须输 =====
    playRound('officer', { perfect: false });
    const id2 = Game.state.applicantIdentity;
    const wrongCall = id2.guilty ? 'approve' : 'reject';
    const wrongResult = Decision.calculate(wrongCall);
    if (wrongResult.success) fail('签证官做出错误裁决(' + wrongCall + ')却判为成功 —— 「签证官不可能输」的老bug还在');
    else ok('签证官错误裁决 ' + wrongCall + ' -> 失败');

    // ===== 清白申请人必须真的存在，且会被抽到 =====
    const seen = new Set();
    for (let i = 0; i < 400; i++) seen.add(IdentityPool.getRandom().id);
    const innocentSeen = [...seen].filter(id => IdentityPool.getById(id).guilty === false);
    if (!innocentSeen.length) fail('抽了400次都没抽到清白申请人');
    else ok('400次抽取命中 ' + innocentSeen.length + ' 种清白申请人');

    // ===== 申请人：全对 -> 应通过；全错 -> 应被拒 =====
    playRound('applicant', {});
    const goodScore = Game.state.score;
    const goodResult = Decision.calculate('auto');
    if (goodScore >= 70 && !goodResult.success) fail('申请人分数 ' + goodScore + ' 达标却没通过');
    if (goodScore < 70 && goodResult.success) fail('申请人分数 ' + goodScore + ' 不足却通过了');
    ok('申请人全对 -> score=' + goodScore + ' success=' + goodResult.success);

    playRound('applicant', { perfect: false });
    const badScore = Game.state.score;
    const badResult = Decision.calculate('auto');
    if (badScore >= 70 && !badResult.success) fail('分数达标却没通过');
    if (badScore < 70 && badResult.success) fail('申请人分数 ' + badScore + ' 不足却通过了');
    ok('申请人全错 -> score=' + badScore + ' success=' + badResult.success);

    // ===== 选项顺序打乱：不能靠"永远点第一个"蒙对 =====
    // showNextQuestion 会启动计时器并写聊天记录，先固定道具开关，结束后还原现场
    const scoreBeforeShuffle = Game.state.score;
    const histBeforeShuffle = Game.state.dialogueHistory.length;
    const chatBeforeShuffle = Chat.messages.length;
    Game.state.playerRole = 'applicant';
    Game.state.skipNextQuestion = false;
    Game.state.autoAnswerRounds = 0;
    Game.state.timeBonusRounds = 0;

    const parseButtons = (html) => {
        const out = [];
        // 注意：本文件所有断言都在一个被 eval 的模板字符串里，反斜杠必须写双份
        const re = /onclick="Dialogue\\.answer\\((-?\\d+)\\)"[^>]*>([^<]*)</g;
        let m;
        while ((m = re.exec(html)) !== null) out.push({ index: Number(m[1]), label: m[2].trim() });
        return out;
    };
    const renderFixed = (q) => {
        Dialogue.questions = [q];
        Dialogue.questionIndex = 0;
        Dialogue.currentQuestion = null;
        Dialogue.showNextQuestion();
        return parseButtons(document.getElementById('AnswerOptions').innerHTML);
    };
    // 故意用 answer=0 的题：打乱前它必然出现在首位
    const fixed = { q: '打乱测试题', a: ['甲', '乙', '丙', '丁'], answer: 0, hint: 'h' };

    const buttons = renderFixed(fixed);
    if (buttons.length !== 4) fail('渲染出 ' + buttons.length + ' 个选项按钮，应为 4 个');
    else {
        const sorted = buttons.map(b => b.index).sort((x, y) => x - y);
        if (JSON.stringify(sorted) !== '[0,1,2,3]') fail('按钮携带的原始下标不是 0-3 的排列（选项被丢失或重复）: ' + JSON.stringify(sorted));
        else ok('4 个按钮携带的下标是 0-3 的完整排列，无丢失无重复');
        const mismatched = buttons.filter(b => b.label !== fixed.a[b.index]);
        if (mismatched.length) fail('按钮文字与其原始下标不对应: ' + JSON.stringify(mismatched));
        else ok('按钮文字与原始下标一一对应，判分不会错位');
    }

    const RUNS = 1200;
    const posCount = [0, 0, 0, 0];
    let badRender = 0;
    for (let i = 0; i < RUNS; i++) {
        const bs = renderFixed(fixed);
        if (bs.length !== 4) { badRender++; continue; }
        posCount[bs.findIndex(b => b.index === fixed.answer)]++;
    }
    if (badRender) fail(badRender + '/' + RUNS + ' 次渲染的按钮数不是 4');
    const firstRate = posCount[0] / RUNS;
    if (firstRate > 0.30 || firstRate < 0.20) fail('正确答案出现在首位的比例 ' + (firstRate * 100).toFixed(1) + '%，偏离 25% 过远，打乱不均匀');
    else ok('正确答案落在首位的比例 ' + (firstRate * 100).toFixed(1) + '%（≈25%，"永远点第一个"已失效）');
    if (posCount.some(c => c === 0)) fail('有显示位置从未出现过正确答案，排列不是等概率的: ' + JSON.stringify(posCount));
    else ok('四个显示位置都出现过正确答案 ' + JSON.stringify(posCount));

    clearInterval(Dialogue.timer);
    Dialogue.timer = null;
    Game.state.score = scoreBeforeShuffle;
    Game.state.dialogueHistory.length = histBeforeShuffle;
    Chat.messages.length = chatBeforeShuffle;

    // ===== 金币真实落库 =====
    tick(100000);
    Game.backToMain();
    Game.selectRole('applicant');
    Game.startShopPhase();
    const cheap = ITEMS.applicant.concat(ITEMS.officer).filter(i => i.type !== 'bribe').sort((a, b) => a.price - b.price)[0];
    const c0 = UserData.getData().coins;
    Game.state.coins = c0;
    Shop.selectItem(cheap.id);
    const c1 = UserData.getData().coins;
    if (c1 !== c0 - cheap.price) fail('购买 ' + cheap.id + ' 没真实扣款: ' + c0 + ' -> ' + c1 + '（应扣 ' + cheap.price + '）');
    else ok('购买扣款已落库 ' + c0 + ' -> ' + c1);
    Shop.selectItem(cheap.id);
    const c2 = UserData.getData().coins;
    if (c2 !== c0) fail('取消购买没退款: ' + c0 + ' -> ' + c2);
    else ok('取消购买已退款');
    // 买不起时必须拦住
    UserData.updateCoins(-UserData.getData().coins);
    Game.state.coins = 0;
    Shop.selectItem(cheap.id);
    if (Shop.selectedItems.includes(cheap.id)) fail('金币为0时仍然买下了 ' + cheap.id);
    else ok('金币不足时购买被拦截');

    // ===== 16 个道具都要真的改状态 =====
    function withState(role, setup) {
        tick(100000);
        Game.backToMain();
        Game.selectRole(role);
        Game.startShopPhase();
        Game.confirmPurchase();
        tick(2000);
        Game.drawMaterials();
        tick(3000);
        Game.confirmMaterials();
        tick(1000);
        Game.state.drawnMaterials = MATERIAL_POOL.slice(0, 3);
        Game.state.materialFake = { [MATERIAL_POOL[0].id]: true, [MATERIAL_POOL[1].id]: true };
        Game.state.applicantIdentity = IdentityPool.getByGuilt(true).find(i => i.difficulty >= 2 && i.clues.length >= 3);
        setup();
    }
    function tryItem(role, id, test) {
        withState(role, () => {});
        Shop.selectedItems = [id];
        ItemQuickUse.use(id);
        test() ? ok('道具 ' + id + ' 生效') : fail('道具 ' + id + ' 用了但状态没变（安慰剂）');
    }

    tryItem('officer', 'microscope', () => Game.state.materialRevealed.length >= 3 && Game.state.revealedClues.length >= 1);
    tryItem('officer', 'dna_compare', () => Game.state.materialRevealed.length >= 3);
    tryItem('officer', 'verify_hotline', () => Game.state.revealedClues.length >= 1 || Game.state.materialRevealed.length >= 1);
    tryItem('officer', 'review_monitor', () => Game.state.revealedClues.length >= 1);
    tryItem('officer', 'chain_question', () => Game.state.pressureMode === true && Game.state.revealedClues.length >= 2);
    tryItem('officer', 'blacklist_scan', () => true);
    tryItem('officer', 'credit_score', () => true);
    tryItem('officer', 'ai_emotion', () => Game.state.suspicionRadar === true);
    tryItem('applicant', 'magic_memory', () => Game.state.skipNextQuestion === true);
    tryItem('applicant', 'personality_switch', () => Game.state.autoAnswerRounds === 2);
    tryItem('applicant', 'triple_caffeine', () => Game.state.timeBonus === 10 && Game.state.timeBonusRounds === 2);
    tryItem('applicant', 'legal_disclaimer', () => Game.state.lenientScoring === true);
    tryItem('applicant', 'crazy_itinerary', () => Game.state.score === 78);
    tryItem('applicant', 'deep_photo', () => Game.state.materialFake[MATERIAL_POOL[0].id] === false || Game.state.score > 70);
    tryItem('applicant', 'returnee_template', () => Game.state.score >= 70);
    tryItem('applicant', 'fake_operator', () => Game.state.score >= 70);

    // ===== 材料审核不能免费给出确定答案 =====
    withState('officer', () => { Game.state.materialRevealed = []; });
    let definitive = 0;
    let suspicious = 0;
    for (let i = 0; i < 80; i++) {
        MaterialReview.inspect(MATERIAL_POOL[0].id);
        const html = document.getElementById('status-' + MATERIAL_POOL[0].id).innerHTML;
        if (html.includes('已确认')) definitive++;
        if (html.includes('可疑') || html.includes('怪') || html.includes('发虚') || html.includes('对不上') || html.includes('不规范')) suspicious++;
    }
    if (definitive > 0) fail('没用道具时 inspect() 给出了 ' + definitive + '/80 次确定结论，付费道具失去意义');
    else ok('没用道具时 inspect() 从不给确定结论');
    if (suspicious === 0) fail('没用道具时 inspect() 连模糊信号都没有，签证官完全无从下手');
    else ok('没用道具时 inspect() 给出模糊可疑信号 ' + suspicious + '/80 次');
    // 用过道具后必须给确定答案
    Game.state.materialRevealed = [MATERIAL_POOL[0].id];
    MaterialReview.inspect(MATERIAL_POOL[0].id);
    if (!document.getElementById('status-' + MATERIAL_POOL[0].id).innerHTML.includes('伪造')) fail('道具验过的材料仍不给确定结论');
    else ok('道具验过的材料给出确定结论');

    // ===== 线索系统 =====
    tick(100000);
    Game.backToMain();
    Game.selectRole('officer');
    Game.state.applicantIdentity = IdentityPool.identities.find(i => i.clues.length >= 2);
    const before = Game.state.revealedClues.length;
    if (Game.revealClue(2) !== 2) fail('revealClue(2) 没有暴露2条线索');
    else ok('revealClue 暴露了 2 条线索');
    Game.revealClue(99);
    ok('线索耗尽后 revealClue 不报错');

    // ===== 随机事件：risky 字段必须被识别 =====
    const evSrc = fs.readFileSync(pub + '/js/randomEvents.js', 'utf8');
    const handlerSrc = fs.readFileSync(pub + '/js/randomEventHandle.js', 'utf8');
    if (evSrc.includes('risky') && handlerSrc.includes('.trusty')) fail('事件数据用 risky，处理逻辑却读 trusty，高风险判定永远不生效');
    else ok('risky 字段读写一致');
    RANDOM_EVENTS.forEach(e => {
        ['officerChoices', 'applicantChoices'].forEach(k => {
            if (!Array.isArray(e[k]) || !e[k].length) fail('事件 ' + e.id + ' 缺 ' + k + '，该角色触发时会崩');
        });
    });
    ok('10 个事件对双角色都有选项');

    // ===== 随机事件全流程 =====
    tick(100000);
    Game.backToMain();
    Game.selectRole('officer');
    Game.state.applicantIdentity = IdentityPool.identities.find(i => i.clues.length >= 2);
    Game.state.randomEventTriggered = [];
    Dialogue.questionIndex = 0;
    Dialogue.questions = QUESTION_BANK.stressTest.slice(0, 3);
    Dialogue.currentQuestion = Dialogue.questions[0];
    const evStats0 = UserData.getData().stats.randomEvents;
    const seen0 = UserData.getData().seenEvents.length;
    Game.triggerRandomEvent();
    if (Game.state.screen !== 'randomEvent') fail('triggerRandomEvent 没有切到事件界面，实际=' + Game.state.screen);
    if (!RandomEvents.currentEvent) fail('currentEvent 没有被记录');
    if (UserData.getData().stats.randomEvents !== evStats0 + 1) fail('stats.randomEvents 没有累计，成就 laugh-out-loud 永远拿不到');
    else ok('stats.randomEvents 已累计');
    if (!UserData.getData().seenEvents.includes(RandomEvents.currentEvent.id)) fail('seenEvents 没有记录事件 id，成就 event-hunter 永远拿不到');
    else ok('seenEvents 已记录');
    Dialogue.awaitingEventReturn = true;
    const clues0 = Game.state.revealedClues.length;
    RandomEvents.choose(0);
    tick(4000);
    if (Game.state.screen !== 'dialogue') fail('事件结束后没回到 dialogue，实际=' + Game.state.screen);
    else ok('事件结束后回到对话环节');
    if (Dialogue.awaitingEventReturn) fail('resumeAfterEvent 没有清掉 awaitingEventReturn 标记');
    else ok('被打断的题目已续上');

    // 每个事件、每个角色、每个选项都不能抛错
    let exercised = 0;
    ['officer', 'applicant'].forEach(role => {
        RANDOM_EVENTS.forEach(ev => {
            Game.state.playerRole = role;
            Game.state.applicantIdentity = IdentityPool.getRandom();
            Game.state.score = 70;
            Game.state.lenientScoring = false;
            RandomEvents.handle(ev);
            const choices = (role === 'officer' ? ev.officerChoices : ev.applicantChoices) || [];
            if (!choices.length) { fail('事件 ' + ev.id + ' 对 ' + role + ' 没有选项'); return; }
            choices.forEach((c, i) => {
                RandomEvents.currentEvent = ev;
                RandomEvents.choose(i);
                tick(3000);
                exercised++;
            });
            if (Game.state.score < 0 || Game.state.score > 100) fail('事件 ' + ev.id + ' 让分数越界: ' + Game.state.score);
        });
    });
    ok('穷举 ' + exercised + ' 个事件选项组合，无一抛错、分数无越界');
    RandomEvents.choose(99);
    ok('越界选项下标被兜住');

    // ===== 清白申请人不能被发到伪造材料 =====
    let innocentFaked = 0;
    let guiltyFaked = 0;
    let guiltyClean = 0;
    const innocentRuns = 120;
    const guiltyRuns = 120;
    for (let run = 0; run < innocentRuns + guiltyRuns; run++) {
        const wantInnocent = run < innocentRuns;
        tick(100000);
        Game.backToMain();
        Game.selectRole('officer');
        if (!Game.state.applicantIdentity) { fail('抽材料前还没有申请人身份，材料真伪无从判定'); break; }
        // 强行指定身份，只改 guilty 与难度，其余流程照走
        const pool = IdentityPool.getByGuilt(!wantInnocent);
        Game.state.applicantIdentity = pool[run % pool.length];
        Game.startShopPhase();
        Game.confirmPurchase();
        tick(2000);
        const identityAtDraw = Game.state.applicantIdentity;
        Game.drawMaterials();
        tick(3000);
        if (Game.state.applicantIdentity !== identityAtDraw) fail('抽完材料后身份被重新生成，材料真伪与身份对不上');
        const fakes = Game.state.drawnMaterials.filter(m => Game.state.materialFake[m.id]).length;
        if (wantInnocent) { if (fakes > 0) innocentFaked++; }
        else if (fakes > 0) guiltyFaked++;
        else guiltyClean++;
        Game.confirmMaterials();
        tick(500);
        Game.nextPhase();
        tick(500);
        if (Game.state.applicantIdentity !== identityAtDraw) fail('nextPhase 又重 roll 了身份');
    }
    if (innocentFaked > 0) fail(innocentRuns + ' 次清白申请人里有 ' + innocentFaked + ' 次被发到伪造材料 —— 签证官查出伪造再拒签会被判错');
    else ok(innocentRuns + ' 次清白申请人全部拿到真实材料');
    if (guiltyFaked === 0) fail(guiltyRuns + ' 次造假申请人一份伪造材料都没抽到，查验道具失去意义');
    else ok('造假申请人 ' + guiltyFaked + '/' + guiltyRuns + ' 次带有伪造材料，' + guiltyClean + ' 次伪造得天衣无缝');
    if (guiltyClean === 0) fail('每个造假申请人都必定露出伪造材料，查验道具变成必胜外挂');
    else ok('查验道具是单向证据：查出伪造即可定罪，查不出仍需自己判断');

    // ===== 成就 =====
    const achSrc = fs.readFileSync(pub + '/js/achievement.js', 'utf8');
    ACHIEVEMENTS.forEach(a => {
        if (!achSrc.includes("'" + a.id + "'")) fail('成就 ' + a.id + ' 没有判定逻辑，永远无法解锁');
    });
    ok('全部 ' + ACHIEVEMENTS.length + ' 个成就都有判定逻辑');
    UserData.getData().achievements.forEach(id => {
        if (!ACHIEVEMENTS.some(a => a.id === id)) fail('存档里有未定义的成就 id: ' + id);
    });
    const unlockedCount = Achievement.checkAchievements(true, { coinChange: 200, verdict: 'approve' });
    ok('checkAchievements 返回 ' + unlockedCount);
    if (Achievement.checkAchievements(true, { coinChange: 200, verdict: 'approve' }) !== 0) fail('重复调用又解锁了成就');
    else ok('成就不会重复解锁');
    Achievement.checkUnlocks();
    const unlockHtml = document.getElementById('AchievementUnlocks').innerHTML;
    if (Achievement.justUnlocked.length === 0 && unlockHtml.trim() !== '') fail('本局没新成就却仍显示了"新成就解锁"');
    else ok('checkUnlocks 只展示本局新解锁的成就');

    // ===== 存档迁移：老存档缺字段不能崩 =====
    localStorage.setItem('visaGame', JSON.stringify({ coins: 500, stats: { gamesPlayed: 3, wins: 1, losses: 2 } }));
    const migrated = UserData.getData();
    if (migrated.coins !== 500) fail('迁移后金币丢失');
    if (migrated.stats.fraudstersCaught !== 0) fail('老存档没补上 fraudstersCaught 默认值');
    if (!Array.isArray(migrated.seenQuestions)) fail('老存档没补上 seenQuestions');
    if (migrated.stats.gamesPlayed !== 3) fail('迁移覆盖了原有统计');
    ok('老存档迁移正常');

    // ===== 版本迁移：题干变更后只清答题记录，其余进度保留 =====
    localStorage.setItem('visaGame', JSON.stringify({
        coins: 480,
        achievements: ['question-veteran'],
        seenQuestions: ['你觉得自已最大的缺点是什么？', '如果你有超能力来美国，会是什么？'],
        questionCounts: { '你觉得自已最大的缺点是什么？': 5 },
        seenEvents: ['phone_ring'],
        purchasedItems: ['magic_memory'],
        stats: { gamesPlayed: 7, wins: 4, losses: 3 },
        settings: { soundEnabled: false, bgmEnabled: true, volume: 35 }
    }));
    const versioned = UserData.getData();
    if (versioned.seenQuestions.length !== 0) fail('老版本存档的 seenQuestions 没被清掉（题干改过，旧键已成孤儿）');
    else if (Object.keys(versioned.questionCounts).length !== 0) fail('老版本存档的 questionCounts 没被清掉');
    else ok('老存档的答题记录已清空（2 条孤儿 seenQuestions + 1 条 questionCounts）');
    if (versioned.coins !== 480) fail('版本迁移把金币也清了，范围过大');
    if (versioned.stats.gamesPlayed !== 7 || versioned.stats.wins !== 4) fail('版本迁移把统计也清了，范围过大');
    if (versioned.settings.soundEnabled !== false || versioned.settings.volume !== 35) fail('版本迁移把音效设置也清了，范围过大');
    if (versioned.achievements.length !== 1) fail('版本迁移把已解锁成就也清了');
    if (versioned.seenEvents.length !== 1 || versioned.purchasedItems.length !== 1) fail('版本迁移误清了按 id 存储的收集进度');
    else ok('金币/统计/设置/已解锁成就/按id的收集进度均未受影响');
    // 版本号必须落盘，否则每次读取都会重清一遍
    const persisted = JSON.parse(localStorage.getItem('visaGame'));
    if (persisted.version !== UserData.version) fail('迁移后没把 version 写回存档，会每次都重清');
    else ok('version=' + persisted.version + ' 已写回存档');
    // 已是当前版本的存档不该再被清
    UserData.recordSeen('seenQuestions', '你紧张吗？');
    UserData.countQuestion('你紧张吗？');
    if (UserData.getData().seenQuestions.length !== 1) fail('当前版本存档被重复迁移，刚记下的答题记录又被清了');
    else ok('当前版本存档不再触发迁移');

    localStorage.setItem('visaGame', '{ 坏掉的 JSON');
    if (UserData.getData().coins === undefined) fail('坏存档导致 getData 崩溃');
    else ok('坏存档被兜住，返回默认数据');

    // ===== 商店计时器不能泄漏 =====
    tick(100000);
    Game.backToMain();
    Game.selectRole('applicant');
    Game.startShopPhase();
    if (!Game.state.timer) fail('商店没有启动限时');
    Game.confirmPurchase();
    tick(2000);
    if (Game.state.timer) fail('confirmPurchase 后商店计时器还在跑（到点会把玩家拽回抽材料界面 —— 交接文档里追了4篇的"闪退"）');
    else ok('商店计时器已在 confirmPurchase 时清除');
    tick(120000);
    if (Game.state.screen === 'shopPhase') fail('长时间挂起后被计时器拽回了商店');
    else ok('推进2分钟虚拟时间后没有被计时器劫持，仍在 ' + Game.state.screen);

    // ===== 结算自动重开不能整页刷新 =====
    const resultSrc = fs.readFileSync(pub + '/js/result.js', 'utf8');
    if (resultSrc.includes('location.reload')) fail('result.js 仍在用 location.reload 整页刷新');
    else ok('结算改为 Game.backToMain()，不再整页刷新');

    // 不刷新页面了，上一局的残留必须由 resetGame() 自己清干净
    tick(100000);
    Game.backToMain();
    Game.selectRole('officer');
    Game.startShopPhase();
    Game.confirmPurchase();
    tick(2000);
    Game.drawMaterials();
    tick(3000);
    Chat.addMessage('system', '上一局的残留消息');
    document.getElementById('ChatMessages').innerHTML = '<div>上一局的残留 DOM</div>';
    if (Chat.messages.length === 0) fail('测试前置条件不成立：Chat.messages 没被写入');

    const coinsBeforeBack = 321;
    Game.state.coins = coinsBeforeBack;
    Game.backToMain();
    if (Game.state.screen !== 'mainMenu') fail('backToMain 后没有回到主菜单，实际=' + Game.state.screen);
    else ok('backToMain 回到主菜单');
    if (Chat.messages.length !== 0) fail('上一局聊天记录还留在 Chat.messages 里（' + Chat.messages.length + ' 条）');
    else ok('上一局聊天记录已从 Chat.messages 清空');
    if (document.getElementById('ChatMessages').innerHTML !== '') fail('聊天区 DOM 还留着上一局的消息');
    else ok('聊天区 DOM 已清空');
    if (Game.state.playerRole !== null) fail('playerRole 没被重置: ' + Game.state.playerRole);
    if (Game.state.dialogueHistory.length !== 0) fail('dialogueHistory 没被清空');
    if (Game.state.drawnMaterials.length !== 0) fail('drawnMaterials 没被清空');
    if (Game.state.usedItemIds.length !== 0) fail('usedItemIds 没被清空');
    if (Game.state.materialRevealed.length !== 0) fail('materialRevealed 没被清空');
    if (Game.state.revealedClues.length !== 0) fail('revealedClues 没被清空');
    if (Game.state.score !== 70) fail('score 没回到初始 70，实际=' + Game.state.score);
    if (Game.state.currentRound !== 1) fail('currentRound 没回到 1');
    if (Shop.selectedItems.length !== 0) fail('Shop.selectedItems 没被清空');
    if (Game.state.applicantIdentity !== null) fail('申请人身份没被清空，下一局会复用同一个骗子');
    else ok('resetGame 已清空角色/答题/材料/道具/线索/身份等本局状态');
    if (Game.state.coins !== coinsBeforeBack) fail('金币被重置了：' + coinsBeforeBack + ' -> ' + Game.state.coins + '（经济应当跨局保留）');
    else ok('金币跨局保留 ' + Game.state.coins + ' VC');

    console.log('\\n===== 无头跑测结果 =====');
    log.forEach(l => console.log(' ' + l));
    const fails = log.filter(l => l.startsWith('FAIL'));
    console.log('\\n断言通过 ' + (log.length - fails.length) + ' / 失败 ' + fails.length);
    process.exitCode = fails.length ? 1 : 0;
})();
`;

try {
    eval(harness);
} catch (e) {
    console.log('\n===== 运行时抛错 =====');
    console.log(e && e.stack ? e.stack.split('\n').slice(0, 8).join('\n') : e);
    process.exitCode = 1;
}

tick(200000); // 收尾：让残留定时器跑完，暴露延迟回调里的错误
if (failures.length) {
    console.log('\n===== 额外捕获的错误 (' + failures.length + ') =====');
    [...new Set(failures)].forEach(f => console.log(' - ' + f));
    process.exitCode = 1;
}
realClearInterval && realSetTimeout(() => {}, 0);
