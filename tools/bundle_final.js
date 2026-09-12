#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'public');

// 读取文本文件
function read(f) { return fs.readFileSync(path.join(BASE, f), 'utf-8'); }

// 读取二进制文件并转Base64
function readBinary(f) {
    const data = fs.readFileSync(path.join(BASE, f));
    return Buffer.from(data, 'binary').toString('base64');
}

console.log('🚀 开始打包面签3分钟游戏...\n');

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

console.log('📦 正在读取' + (cssFiles.length + jsFiles.length) + '个资源文件...');

// 合并CSS
console.log('🎨 合并CSS样式...');
let allCss = '';
for (const f of cssFiles) {
    console.log('  ├─ ' + f);
    let css = read(f);
    
    // 将SVG背景图转成Base64内联
    const svgBase64 = readBinary('assets/flag-background.svg');
    css = css.replace(
        /url\(['"]?\.\.\/assets\/flag-background\.svg['"]?\)/g,
        `url("data:image/svg+xml;base64,${svgBase64}")`
    );
    
    allCss += css + '\n';
}

// 合并JS
console.log('📜 合并JavaScript代码...');
let allJs = '';
for (const f of jsFiles) {
    console.log('  ├─ ' + f);
    let js = read(f);
    
    // 将背景音乐文件转成Base64并替换soundManager中的路径
    if (f === 'js/soundManager.js') {
        const mp3Base64 = readBinary('assets/bgm.mp3');
        const dataUri = `data:audio/mpeg;base64,${mp3Base64}`;
        console.log('  └─ 注入背景音乐(BGM)到代码中...');
        
        // 替换bgmSrc的赋值
        js = js.replace(
            /bgmSrc:\s*'assets\/bgm\.mp3'/,
            `bgmSrc: '${dataUri}'`
        );
    }
    
    allJs += js + '\n';
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
console.log('⚙️  清理外部引用...');
headHtml = headHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
headHtml = headHtml.replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

// 清除所有外部JS引用 (in head)
console.log('📝 清理外部JS引用(head)...');
headHtml = headHtml.replace(/<script\s+src=["']js\/[^"]*["'][^>]*><\/script>/gi, '');

// 添加file://协议支持
headHtml = headHtml.replace(
    /location\.protocol\.startsWith\('http'\)/,
    "location.protocol.startsWith('http') || location.protocol === 'file:'"
);

// 内联CSS
headHtml += '\n<style>\n' + allCss + '</style>';

// 清除所有外部JS引用
console.log('📝 清理外部JS引用...');
const scriptTagPattern = '<script src="js/';
let newBody = '';
let remaining = bodyHtml;

while (remaining.length > 0) {
    const index = remaining.indexOf(scriptTagPattern);
    if (index === -1) {
        // 没有更多需要移除的脚本
        newBody += remaining;
        break;
    }
    
    // 添加脚本标签之前的内容
    newBody += remaining.substring(0, index);
    remaining = remaining.substring(index + scriptTagPattern.length);
    
    // 找到闭合标签 </script>
    const closeIndex = remaining.indexOf('</script>');
    if (closeIndex === -1) {
        // 没找到闭合标签,添加回来
        newBody += scriptTagPattern + remaining;
        break;
    }
    
    // 跳过这个脚本标签(不包含它)
    remaining = remaining.substring(closeIndex + '</script>'.length);
}

bodyHtml = newBody;

// 添加内联JS
bodyHtml += '\n<script>\n' + allJs + '</script>';

// 构建最终HTML
console.log('🔧 生成最终文件...');
const finalHtml = beforeHead + headHtml + '</head>' + bodyHtml + '</body>' + afterBody;

// 输出
const outputPath = path.join(__dirname, '..', '面签3分钟_单机版.html');
fs.writeFileSync(outputPath, finalHtml, 'utf-8');

const sizeKB = (Buffer.byteLength(finalHtml, 'utf-8') / 1024).toFixed(2);
console.log('\n✅ 打包完成！');
console.log('📁 文件位置：' + outputPath);
console.log('📏 文件大小：' + sizeKB + ' KB');
console.log('📄 代码行数：' + finalHtml.split('\n').length);
console.log('\n🎮 现在可以直接分享这个HTML文件了！');
