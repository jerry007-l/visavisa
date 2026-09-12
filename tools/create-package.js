#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('📦 创建面签3分钟游戏分享包...\n');

const OUT_DIR = path.join(__dirname, '..', '面签3分钟_分享包');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// 清理旧目录
if (fs.existsSync(OUT_DIR)) {
    console.log('🗑️  清理旧的分享包...');
    fs.rmSync(OUT_DIR, { recursive: true });
}

// 创建新目录
console.log('📁 创建分享包目录...');
fs.mkdirSync(OUT_DIR, { recursive: true });

// 运行轻量版打包
console.log('\n🚀 开始打包...\n');
const { execSync } = require('child_process');
execSync('node tools/create-lite.js', { stdio: 'inherit' });

// 复制assets文件夹
console.log('\n📂 复制媒体资源文件...');
const assetsSrc = path.join(PUBLIC_DIR, 'assets');
const assetsDst = path.join(OUT_DIR, 'assets');

if (!fs.existsSync(assetsSrc)) {
    console.log('⚠️  警告: assets文件夹不存在');
    process.exit(0);
}

fs.cpSync(assetsSrc, assetsDst, { recursive: true });
console.log('   ✅ 已复制 assets/ 文件夹');

// 复制HTML文件
const liteHtml = path.join(__dirname, '..', '面签3分钟_轻量版.html');
const mainHtml = path.join(OUT_DIR, 'index.html');

if (fs.existsSync(liteHtml)) {
    const htmlContent = fs.readFileSync(liteHtml, 'utf-8');
    
    // 修改引用路径为相对路径
    const modifiedHtml = htmlContent.replace(
        /assets\/flag-background\.svg/g,
        'assets/flag-background.svg'
    );
    
    fs.writeFileSync(mainHtml, modifiedHtml, 'utf-8');
    console.log('   ✅ 已生成 index.html');
} else {
    console.log('❌ 错误: 轻量版HTML文件不存在');
    process.exit(0);
}

// 创建README.txt
console.log('\n📝 创建使用说明...');
const readme = `
===============================================
    面签3分钟 - 单机版游戏
===============================================

📦 安装与使用
--------------
1. 解压此文件夹到任意位置
2. 双击 "index.html" 即可开始游戏
3. 无需安装,无需联网

✅ 游戏特色
--------------
• 双角色系统 (签证官 / 申请人)
• 道具商店与金币系统
• 材料审核与搞笑问答
• 随机事件与成就解锁
• 背景音乐与音效

💡 使用提示
--------------
• 首次打开请点击页面启用音效
• 支持手机/平板/电脑浏览器
• 可添加到手机主屏幕快捷方式

🎮 游戏流程
--------------
1. 选择角色 (签证官或申请人)
2. 限时60秒购买道具
3. 抽卡获取材料
4. 审核材料真伪
5. 回答搞笑问题 (8轮)
6. 触发随机事件
7. 做出最终决策

📱 手机端使用
--------------
Chrome/Edge: 点击菜单 → "添加到主屏幕"
Safari: 点击分享按钮 → "添加到主屏幕"

⚙️ 技术支持
--------------
如遇到任何问题,请查看同目录下的 README.txt
或联系开发者

---

版本: v3.0.0 单机分享版
日期: 2026-09-13
大小: ~5MB (含媒体资源)

🎮 祝你游戏愉快!
`;

fs.writeFileSync(path.join(OUT_DIR, 'README.txt'), readme, 'utf-8');

// 统计信息
const totalFiles = fs.readdirSync(OUT_DIR, { recursive: true }).length;
const stats = fs.statSync(OUT_DIR);
let totalSize = 0;

function calcDirSize(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            calcDirSize(filePath);
        } else {
            totalSize += fs.statSync(filePath).size;
        }
    });
}
calcDirSize(OUT_DIR);
const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

console.log('\n✅ 分享包创建完成！\n');
console.log(`📁 位置: ${OUT_DIR}`);
console.log(`📄 文件数: ${totalFiles}`);
console.log(`📏 总大小: ${sizeMB} MB`);
console.log(`\n🎮 使用方法:`);
console.log(`   1. 将整个 "面签3分钟_分享包" 文件夹发送给好友`);
console.log(`   2. 好友解压后双击 index.html 即可游玩`);
console.log(`   3. 无需安装任何软件`);
console.log(`   4. 完全离线可用\n`);
