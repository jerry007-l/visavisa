// 面签三分钟 - 本地服务器（仅用于提供静态资源）
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🎮 面签三分钟 单机版运行在:`);
    console.log(`  本机: http://localhost:${PORT}`);
    console.log(`  本地局域网: http://YOUR_IP:${PORT}`);
});
