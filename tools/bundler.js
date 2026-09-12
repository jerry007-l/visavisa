#!/usr/bin/env node
/**
 * 将面签三分钟游戏打包成单个HTML文件（优化版）
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

// 提取head和body
const headMatch = html.match(/<head>([\s\S]*)<\/head>/);
const bodyMatch = html.match(/<body([\s\S]*?)>([\s\S]*)<\/body>/);

if (!headMatch || !bodyMatch) {
    console.error('❌ HTML结构解析失败');
    process.exit(1);
}

let headContent = headMatch[1];
let bodyContent = bodyMatch[2];

console.log('📦 开始打包游戏...\n');

// 构建内联JS
console.log('📜 打包JavaScript文件...');
let combinedJs = '';
for (const jsFile of jsFiles) {
    const jsContent = read(jsFile);
    combinedJs += '\n' + jsContent;
}

// 移除所有外部<script src="...">标签
// 使用更简单的正则表达式
const scriptRegex = /<script[^>]*src=["'][^"']*["'][^>]*><\/script>/g;
bodyContent = bodyContent.replace(scriptRegex, '');

// 在body末尾添加内联脚本
const inlineScript = `
    <script>
        //<![CDATA[
${combinedJs}
        //]]>
    </script>
`;

// 替换空白的</body>为内联脚本
bodyContent = bodyContent.replace(/<\/body>/, inlineScript + '\n    </body>');

// 处理CSS
console.log('🎨 打包CSS文件...');
let combinedCss = '';
for (const cssFile of cssFiles) {
    const cssContent = read(cssFile);
    combinedCss += '\n' + cssContent;
}

// 移除所有外部<link rel="stylesheet"...>标签
headContent = headContent.replace(/<link\s+rel=["']stylesheet["'][^>]*>/gi, '');

// 在head末尾添加内联CSS
const inlineStyle = `<style>\n${combinedCss}\n</style>`;
headContent = headContent.replace(/<\/head>/, inlineStyle + '\n    </head>');

// 优化PWA配置
console.log('⚙️  优化file://协议兼容性...');
headContent = headContent.replace(
    /if\s*\(\s*location\.protocol\.startsWith\s*\(\s*['"]http['"]\s*\)\s*\)/,
    "if (location.protocol.startsWith('http') || location.protocol === 'file:')"
);

// 移除图标引用（在file://下无法加载）
headContent = headContent.replace(/<link\s+rel=["']icon["'][^>]*>/gi, '');

// 构建最终HTML
console.log('🔧 构建最终文件...');
const finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
${headContent}
</head>
<body${bodyMatch[1]}>
${bodyContent}
</body>
</html>`;

// 输出文件
const outputPath = path.join(__dirname, '..', '面签3分钟_单机版.html');
fs.writeFileSync(outputPath, finalHtml, 'utf-8');

const fileSizeKB = (Buffer.byteLength(finalHtml, 'utf-8') / 1024).toFixed(2);

console.log('\n✅ 打包完成！');
console.log(`📁 输出文件: ${outputPath}`);
console.log(`📏 文件大小: ${fileSizeKB} KB`);
console.log(`📄 HTML行数: ${finalHtml.split('\n').length} 行`);
