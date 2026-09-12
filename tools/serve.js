// 零依赖静态服务器：node tools/serve.js [端口]
// 游戏是纯前端的，不需要 express；有了这个脚本，没跑 npm install 也能直接玩。
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public');
const PORT = Number(process.argv[2]) || 3000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json'
};

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const filePath = path.join(ROOT, relative);

    // 拦住 ../ 穿越，只允许访问 public/ 里的文件
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 ' + urlPath);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            // 开发时禁用缓存，否则改完代码刷新看到的还是旧的
            'Cache-Control': 'no-store'
        }).end(data);
    });
}).listen(PORT, () => {
    console.log(`🎮 面签三分钟 已启动: http://localhost:${PORT}`);
    console.log(`   自检页面:      http://localhost:${PORT}/?selfcheck`);
    console.log('   按 Ctrl+C 停止');
});
