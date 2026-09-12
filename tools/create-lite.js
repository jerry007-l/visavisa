#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 轻量版打包 - 只内联HTML/CSS/JS,保留外部媒体文件引用
const BASE = path.join(__dirname, '..', 'public');

function read(f) { return fs.readFileSync(path.join(BASE, f), 'utf-8'); }

console.log('🚀 开始打包面签3分钟游戏 (轻量版)...\n');

// 读取所有文件
let html = read('index.html');
const cssFiles = ['css/game.css', 'css/shop.css', 'css/itemQuickUse.css', 'css/result.css'];
const jsFiles = [
    'js/userData.js', 'js/questionBank.js', 'js/identityPool.js', 'js/materialPool.js',
    'js/items.js', 'js/randomEvents.js', 'js/achievements.js', 'js/soundManager.js',
    'js/audioInit.js', 'js/roleSelect.js', 'js/shop.js', 'js/itemQuickUse.js',
    'js/drawMaterials.js', 'js/materialReview.js', 'js/dialogue.js', 'js/decision.js',
    'js/result.js', 'js/randomEventHandle.js', 'js/achievement.js', 'js/selfCheck.js',
    'js/main.js'
];

console.log('📦 正在读取' + (cssFiles.length + jsFiles.length) + '个资源文件...\n');

// 合并CSS (只内联SVG背景,不处理MP3)
console.log('🎨 合并CSS样式...');
let allCss = '';
for (const f of cssFiles) {
    console.log('  ├─ ' + f);
    let css = read(f);
    
    // 将SVG背景图转成Base64内联
    const svgData = fs.readFileSync(path.join(BASE, 'assets/flag-background.svg'));
    const svgBase64 = Buffer.from(svgData).toString('base64');
    css = css.replace(
        /url\(['"]?\.\.\/assets\/flag-background\.svg['"]?\)/g,
        `url("data:image/svg+xml;base64,${svgBase64}")`
    );
    
    allCss += css + '\n';
}

// 合并JS (不注入BGM)
console.log('\n📜 合并JavaScript代码...');
let allJs = '';
for (const f of jsFiles) {
    console.log('  ├─ ' + f);
    allJs += read(f) + '\n';
}

// 提取head和body内容
const headStart = html.indexOf('<head>') + 6;
const headEnd = html.indexOf('</head>');
const bodyStart = html.indexOf('<body') + html.substring(html.indexOf('<body')).indexOf('>') + 1;
const bodyEnd = html.lastIndexOf('</body>');
const beforeHead = html.substring(0, headStart);
const afterBody = html.substring(bodyEnd);

let headHtml = html.substring(headStart, headEnd);
let bodyHtml = html.substring(bodyStart, bodyEnd);

// 清除所有外部CSS引用
console.log('\n⚙️  清理外部引用...');
headHtml = headHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
headHtml = headHtml.replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

// 添加file://协议支持
headHtml = headHtml.replace(
    /location\.protocol\.startsWith\('http'\)/,
    "location.protocol.startsWith('http') || location.protocol === 'file:'"
);

// 内联CSS
headHtml += '\n<style>\n' + allCss + '</style>';

// 清除所有外部JS引用 (in head)
console.log('📝 清理外部JS引用(head)...');
headHtml = headHtml.replace(/<script\s+src=["']js\/[^"]*["'][^>]*><\/script>/gi, '');

// 清除所有外部JS引用 (in body)
console.log('📝 清理外部JS引用(body)...');
const scriptTagPattern = '<script src="js/';
let newBody = '';
let remaining = bodyHtml;

while (remaining.length > 0) {
    const index = remaining.indexOf(scriptTagPattern);
    if (index === -1) {
        newBody += remaining;
        break;
    }
    
    newBody += remaining.substring(0, index);
    remaining = remaining.substring(index + scriptTagPattern.length);
    
    const closeIndex = remaining.indexOf('</script>');
    if (closeIndex === -1) {
        newBody += scriptTagPattern + remaining;
        break;
    }
    
    remaining = remaining.substring(closeIndex + '</script>'.length);
}

bodyHtml = newBody;

// 添加内联JS
bodyHtml += '\n<script>\n' + allJs + '</script>';

// 构建最终HTML
console.log('🔧 生成最终文件...');
const finalHtml = beforeHead + headHtml + '</head>' + bodyHtml + '</body>' + afterBody;

// 输出
const outputPath = path.join(__dirname, '..', '面签3分钟_轻量版.html');
fs.writeFileSync(outputPath, finalHtml, 'utf-8');

const sizeKB = (Buffer.byteLength(finalHtml, 'utf-8') / 1024).toFixed(2);

console.log('\n✅ 轻量版打包完成！');
console.log(`📁 文件位置：${outputPath}`);
console.log(`📏 文件大小：${sizeKB} KB (~${(sizeKB/1024).toFixed(2)} MB)`);
console.log(`📄 HTML行数：${finalHtml.split('\n').length} 行`);
console.log('\n💡 提示：需要将此文件与 assets/ 文件夹放在同一目录使用');
console.log('   或者复制 public/assets/ 文件夹到与此HTML相同的目录下\n');
