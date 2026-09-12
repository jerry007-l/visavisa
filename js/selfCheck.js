// 游戏功能自检 - 控制台输入 selfCheck() 手动运行，或用 ?selfcheck 打开页面自动运行
// 注意：这些模块都是脚本顶层的 const，只存在于全局词法环境里，
// 不是 window 的属性，所以不能用 window[name] 探测，必须直接引用。
window.selfCheck = function selfCheck() {
    console.log('========== 🎮 游戏功能自检开始 ==========');

    let passed = 0;
    let failed = 0;

    const report = (ok, label, detail) => {
        console.log(`${ok ? '✅' : '❌'} ${label}${detail !== undefined && detail !== '' ? ': ' + detail : ''}`);
        if (ok) passed++; else failed++;
    };

    // ---------- 模块检查 ----------
    console.log('\n📦 模块检查:');
    const modules = {
        Game, SoundManager, AudioInit, UserData, RoleSelect,
        Shop, DrawMaterials, MaterialReview, Dialogue, Decision, Result,
        RandomEvents, Achievement, ItemQuickUse, IdentityPool
    };
    Object.keys(modules).forEach(name => {
        const value = modules[name];
        report(value && typeof value === 'object', name, value ? '已加载' : '未加载');
    });

    // ---------- 数据检查 ----------
    console.log('\n📊 数据检查:');
    const questionCount = Object.values(QUESTION_BANK).reduce((sum, list) => sum + list.length, 0);
    const itemCount = ITEMS.applicant.length + ITEMS.officer.length + ITEMS.special.length;

    report(questionCount > 0, '题目数量', questionCount);
    report(IDENTITY_POOL.length > 0, '应拒签身份', IDENTITY_POOL.length);
    report(INNOCENT_POOL.length > 0, '可过签身份', INNOCENT_POOL.length);
    report(IdentityPool.identities.length === IDENTITY_POOL.length + INNOCENT_POOL.length,
        '身份池合并', IdentityPool.identities.length);
    report(MATERIAL_POOL.length > 0, '材料数量', MATERIAL_POOL.length);
    report(itemCount > 0, '道具数量', itemCount);
    report(RANDOM_EVENTS.length > 0, '随机事件数量', RANDOM_EVENTS.length);
    report(ACHIEVEMENTS.length > 0, '成就数量', ACHIEVEMENTS.length);

    // ---------- 关键方法检查 ----------
    console.log('\n🔧 关键方法检查:');
    [
        ['Game.selectRole', Game.selectRole],
        ['Game.startShopPhase', Game.startShopPhase],
        ['Game.confirmPurchase', Game.confirmPurchase],
        ['Game.goToFinalDecision', Game.goToFinalDecision],
        ['Game.revealClue', Game.revealClue],
        ['Game.revealMaterialTruth', Game.revealMaterialTruth],
        ['Game.backToMain', Game.backToMain],
        ['SoundManager.play', SoundManager.play],
        ['IdentityPool.getRandom', IdentityPool.getRandom],
        ['DrawMaterials.draw', DrawMaterials.draw],
        ['DrawMaterials.renderMaterials', DrawMaterials.renderMaterials],
        ['MaterialReview.renderMaterials', MaterialReview.renderMaterials],
        ['Dialogue.init', Dialogue.init],
        ['Dialogue.resumeAfterEvent', Dialogue.resumeAfterEvent],
        ['Decision.calculate', Decision.calculate],
        ['Result.show', Result.show],
        ['Result.cancelAutoRestart', Result.cancelAutoRestart],
        ['Shop.renderItems', Shop.renderItems],
        ['ItemQuickUse.use', ItemQuickUse.use],
        ['RandomEvents.handle', RandomEvents.handle],
        ['RandomEvents.leave', RandomEvents.leave],
        ['Achievement.checkAchievements', Achievement.checkAchievements]
    ].forEach(([name, fn]) => report(typeof fn === 'function', name, typeof fn));

    // ---------- 成就可解锁性 ----------
    console.log('\n🏆 成就可达性:');
    const unreachable = ACHIEVEMENTS.filter(a =>
        !Achievement.checkAchievements.toString().includes(`'${a.id}'`));
    report(unreachable.length === 0, '每个成就都有判定逻辑',
        unreachable.length ? '缺判定的: ' + unreachable.map(a => a.id).join(',') : `${ACHIEVEMENTS.length} 个全部可达`);

    // ---------- DOM 锚点检查 ----------
    console.log('\n🖥️ 关键 DOM 元素检查:');
    [
        'mainMenu', 'roleSelect', 'shopPhase', 'materialDraw', 'materialReview',
        'dialogue', 'randomEvent', 'finalDecision', 'resultScreen',
        'ShopItems', 'ShopCoins', 'ShopTimer', 'SlotMachine', 'MaterialCards',
        'OfficerTools', 'QuestionArea', 'AnswerOptions', 'CurrentRound', 'TotalRounds',
        'TimerBar', 'TimerText', 'EventTitle', 'EventContent', 'EventChoices',
        'DecisionSummary', 'ResultTitle', 'ResultContent', 'AchievementUnlocks',
        'ItemQuickUseBtn'
    ].forEach(id => report(!!document.getElementById(id), '#' + id,
        document.getElementById(id) ? '存在' : '缺失'));

    // ---------- 汇总 ----------
    console.log('\n========== 📈 自检结果 ==========');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(failed === 0 ? '🎉 所有检查通过！' : '⚠️ 有检查失败，请对照上面的 ❌ 项排查');
    console.log('=================================\n');
    return failed;
};

if (/[?&]selfcheck\b/.test(window.location.search)) {
    window.selfCheck();
}
