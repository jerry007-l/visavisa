#!/usr/bin/env node
/**
 * 将面签三分钟游戏打包成单个HTML文件
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'public');

// 读取文件
function read(file) {
    return fs.readFileSync(path.join(BASE_DIR, file), 'utf-8');
}

// 获取所有JS文件列表
const jsFiles = [
    'js/userData.js',
    'js/questionBank.js',
    'js/identityPool.js',
    'js/materialPool.js',
    'js/items.js',
    'js/randomEvents.js',
    'js/achievements.js',
    'js/soundManager.js',
    'js/audioInit.js',
    'js/roleSelect.js',
    'js/shop.js',
    'js/itemQuickUse.js',
    'js/drawMaterials.js',
    'js/materialReview.js',
    'js/dialogue.js',
    'js/decision.js',
    'js/result.js',
    'js/randomEventHandle.js',
    'js/achievement.js',
    'js/selfCheck.js',
    'js/main.js'
];

// CSS文件列表
const cssFiles = [
    'css/game.css',
    'css/shop.css',
    'css/itemQuickUse.css',
    'css/result.css'
];

// 读取主HTML
const html = read('index.html');

// 提取body内容（去掉script标签内的代码）
const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
if (!bodyMatch) {
    console.error('❌ 无法找到<body>标签');
    process.exit(1);
}

let bodyContent = bodyMatch[1];

// 将所有JS文件内联到body末尾
const inlineScriptStart = '<script>';
const inlineScriptEnd = '</script>';

// 构建内联脚本
let combinedJs = '';
for (const jsFile of jsFiles) {
    console.log(`📦 打包: ${jsFile}`);
    const jsContent = read(jsFile);
    combinedJs += jsContent + '\n';
}

// 移除原有的外部script引用
bodyContent = bodyContent.replace(/<script src="js\/[^"]*"><\/script>/g, '');

// 创建内联脚本
const innerHtmlForScripts = `
    <!-- 所有游戏代码已内联 -->
    <script>
        //<![CDATA[
        ${combinedJs}
        //]]>
    </script>
`;

// 在原来script标签的位置插入内联脚本
bodyContent = bodyContent.replace(
    /<!-- \S+所有JS文件已内联\s-->/,
    innerHtmlForScripts
);

// 如果没有找到占位符，就在末尾添加前插入
if (!bodyContent.includes('所有游戏代码已内联')) {
    // 找到最后一个</script>标签，在其后插入
    const lastScriptIndex = bodyContent.lastIndexOf('</script>');
    if (lastScriptIndex !== -1) {
        bodyContent = bodyContent.substring(0, lastScriptIndex + '</script>'.length) + 
                      '\n    ' + innerHtmlForScripts + 
                      bodyContent.substring(lastScriptIndex + '</script>'.length);
    } else {
        // 实在找不到就放在<body>末尾
        bodyContent = bodyContent.replace(/<\/body>/, innerHtmlForScripts + '\n    </body>');
    }
}

// 处理CSS：将所有CSS内联到<head>中
let newHead = html.match(/<head>([\s\S]*)<\/head>/)[1];

// 移除外部CSS链接
newHead = newHead.replace(/<link rel="stylesheet" href="css\/[^"]*">/g, '');

// 构建内联CSS
let combinedCss = '';
for (const cssFile of cssFiles) {
    console.log(`🎨 打包CSS: ${cssFile}`);
    const cssContent = read(cssFile);
    combinedCss += cssContent + '\n';
}

// 在<head>末尾插入内联CSS
const inlineStyle = `<style>\n${combinedCss}\n</style>`;
newHead = newHead.replace(/<\/head>/, inlineStyle + '\n    </head>');

// 处理PWA manifest和icon引用（改为条件加载）
// 修改manifest加载逻辑，使其对file://协议也生效
newHead = newHead.replace(
    /if \(location\.protocol\.startsWith\('http'\)\)/,
    "if (location.protocol.startsWith('http') || location.protocol === 'file:')"
);

// 移除不存在的资源引用
newHead = newHead.replace(/<link rel="icon"[^>]*>/g, '');

// 构建最终HTML
const finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
${newHead}
</head>
<body>
${bodyContent}
</body>
</html>`;

// 输出文件
const outputPath = path.join(__dirname, '..', '面签3分钟_单机版.html');
fs.writeFileSync(outputPath, finalHtml, 'utf-8');

console.log('\n✅ 打包完成！');
console.log(`📁 输出文件: ${outputPath}`);
console.log(`📏 文件大小: ${(Buffer.byteLength(finalHtml, 'utf-8') / 1024).toFixed(2)} KB`);
