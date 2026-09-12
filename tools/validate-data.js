// 数据完整性自检：node tools/validate-data.js
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'js') + path.sep;

const dataFiles = ['questionBank.js', 'identityPool.js', 'materialPool.js', 'items.js', 'randomEvents.js', 'achievements.js'];
const bundle = dataFiles.map(f => fs.readFileSync(dir + f, 'utf8')).join('\n;\n');

const checks = `
;(function () {
    const problems = [];
    const note = (msg) => problems.push(msg);

    // ---------- 身份池 ----------
    const all = [...IDENTITY_POOL, ...INNOCENT_POOL];
    console.log('身份总数:', all.length, '(应拒', IDENTITY_POOL.length, '/ 可过', INNOCENT_POOL.length, ')');
    const ids = all.map(i => i.id);
    ids.forEach((id, i) => { if (ids.indexOf(id) !== i) note('身份 id 重复: ' + id); });
    all.forEach(i => {
        ['id', 'name', 'icon', 'reason', 'description', 'difficulty'].forEach(k => {
            if (i[k] === undefined || i[k] === null || i[k] === '') note('身份 ' + i.id + ' 缺字段 ' + k);
        });
        if (typeof i.difficulty !== 'number') note('身份 ' + i.id + ' difficulty 不是数字: ' + i.difficulty);
        if (!Array.isArray(i.clues) || i.clues.length === 0) note('身份 ' + i.id + ' 没有 clues（签证官无法取证）');
    });

    // ---------- 题库 ----------
    const cats = Object.keys(QUESTION_BANK);
    let total = 0;
    cats.forEach(c => {
        QUESTION_BANK[c].forEach(q => {
            total++;
            if (!q.q || !Array.isArray(q.a)) return note('题目结构异常 @' + c);
            if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.a.length) {
                note('answer 越界 @' + c + ': ' + q.q.slice(0, 20) + ' (answer=' + q.answer + ', 选项数=' + q.a.length + ')');
            }
            if (new Set(q.a).size !== q.a.length) note('选项重复 @' + c + ': ' + q.q.slice(0, 20));
        });
    });
    console.log('题目总数:', total, '分类:', cats.join(','));
    const qs = cats.flatMap(c => QUESTION_BANK[c].map(q => q.q));
    qs.forEach((q, i) => { if (qs.indexOf(q) !== i) note('题目文本重复: ' + q.slice(0, 24)); });

    // ---------- 材料池 ----------
    const mats = MATERIAL_POOL.map(m => m.id);
    mats.forEach((id, i) => { if (mats.indexOf(id) !== i) note('材料 id 重复: ' + id); });
    MATERIAL_POOL.forEach(m => {
        ['id', 'name', 'icon', 'desc'].forEach(k => { if (!m[k]) note('材料 ' + m.id + ' 缺字段 ' + k); });
    });
    console.log('材料总数:', MATERIAL_POOL.length);

    // ---------- 道具 ----------
    const itemGroups = Object.keys(ITEMS);
    const allItems = itemGroups.flatMap(g => ITEMS[g]);
    const itemIds = allItems.map(i => i.id);
    itemIds.forEach((id, i) => { if (itemIds.indexOf(id) !== i) note('道具 id 重复: ' + id); });
    allItems.forEach(i => {
        ['id', 'name', 'price', 'effect'].forEach(k => { if (i[k] === undefined) note('道具 ' + i.id + ' 缺字段 ' + k); });
    });
    console.log('道具分组:', itemGroups.join(','), '总数:', allItems.length);

    // ---------- 随机事件 ----------
    RANDOM_EVENTS.forEach(e => {
        ['id', 'title'].forEach(k => { if (!e[k]) note('事件缺 ' + k); });
        ['officerChoices', 'applicantChoices'].forEach(k => {
            if (!Array.isArray(e[k]) || e[k].length === 0) note('事件 ' + e.id + ' 缺 ' + k);
            else e[k].forEach(c => {
                if (!c.text) note('事件 ' + e.id + ' ' + k + ' 选项缺 text');
                if (c.risky && typeof c.trustChange !== 'number') note('事件 ' + e.id + ' risky 选项没有 trustChange');
            });
        });
        if (!e.officerDesc && !e.applicantDesc && !e.content) note('事件 ' + e.id + ' 没有任何描述文案');
    });
    const eids = RANDOM_EVENTS.map(e => e.id);
    eids.forEach((id, i) => { if (eids.indexOf(id) !== i) note('事件 id 重复: ' + id); });
    console.log('事件总数:', RANDOM_EVENTS.length);

    // ---------- 成就 ----------
    console.log('成就总数:', ACHIEVEMENTS.length);
    const aids = ACHIEVEMENTS.map(a => a.id);
    aids.forEach((id, i) => { if (aids.indexOf(id) !== i) note('成就 id 重复: ' + id); });

    // ---------- 道具效果是否都有实现分支 ----------
    const quick = fs.readFileSync(dir + 'itemQuickUse.js', 'utf8');
    allItems.filter(i => i.type !== 'bribe').forEach(i => {
        if (!quick.includes("case '" + i.id + "'")) note('道具 ' + i.id + ' 在 itemQuickUse.applyEffect 里没有分支');
    });

    console.log('\\n===== 问题 (' + problems.length + ') =====');
    problems.forEach(p => console.log(' - ' + p));
    if (!problems.length) console.log(' 无');
})();
`;

eval(bundle + checks);
