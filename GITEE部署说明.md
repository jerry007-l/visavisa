# 面签三分钟游戏 - Gitee 部署说明

## ✅ 代码已成功推送到 Gitee

**仓库地址**: https://gitee.com/chen-xu-jie/visa-sim

**推送状态**: 
- ✅ 主分支 (main) 已推送
- ✅ 所有文件已上传
- ✅ Git 提交记录完整

## 📌 重要通知: Gitee Pages 服务已停止

⚠️ **Gitee Pages 静态网站托管服务已于 2024 年 5 月正式停止服务**

这意味着无法再通过 Gitee Pages 生成在线访问链接。

## 🚀 推荐的替代部署方案

### 方案 1: Netlify (推荐 - 无需手机验证)

**优点**: 
- 免费套餐够用
- 无需手机验证
- 自动部署
- 提供 HTTPS

**步骤**:
1. 访问 https://www.netlify.com/
2. 使用 GitHub/Gitee 账号登录
3. 点击 "Add new site" → "Deploy from git repository"
4. 选择你的 Gitee 仓库 `chen-xu-jie/visa-sim`
5. 构建命令留空,发布目录填写 `public`
6. 点击 Deploy

**完成后获得**: `https://your-site-name.netlify.app`

---

### 方案 2: Vercel

**优点**: 
- 免费版够用
- 自动部署
- 提供 HTTPS

**注意**: 网页版可能需要手机验证

**步骤**:
1. 访问 https://vercel.com/
2. 使用 GitHub/Gitee 账号登录
3. 点击 "Add New..." → "Deploy Project"
4. 选择你的 Gitee 仓库
5. 点击 Deploy

**完成后获得**: `https://your-project.vercel.app`

---

### 方案 3: Cloudflare Pages

**优点**: 
- 全球 CDN 加速
- 免费版充足
- 可靠稳定

**步骤**:
1. 访问 https://pages.cloudflare.com/
2. 注册并登录
3. 创建新站点,连接 Gitee 仓库
4. 配置构建设置

**完成后获得**: `https://your-site.pages.dev`

---

## 💻 本地运行游戏

如果你只想在本地运行游戏:

```bash
# 启动本地服务器
node server/src/index.js

# 或直接用浏览器打开
open public/index.html
```

或者直接双击打开:
- `public/index.html` - 游戏主页面

---

## 📂 项目结构

```
├── public/              # 前端静态文件
│   ├── index.html      # 游戏主入口
│   ├── css/           # 样式文件
│   ├── js/            # JavaScript 文件
│   └── assets/        # 资源文件(图片、音效等)
├── server/             # Node.js 服务器
│   └── src/index.js   # 服务器入口
├── docs/              # 文档
└── tools/             # 工具脚本
```

---

## 🎮 游戏功能清单

- ✅ 角色选择系统
- ✅ 道具商店
- ✅ 材料审核
- ✅ 随机事件
- ✅ 评估结果
- ✅ 音效系统
- ✅ 成就系统

---

## ❓ 常见问题

### Q: 为什么 Gitee Pages 不能用?
A: Gitee 官方已于 2024 年 5 月停止该服务,建议使用其他静态网站托管平台。

### Q: 哪个平台最简单?
A: Netlify 最推荐,无需手机验证,一键部署。

### Q: 部署后可以获得什么链接?
A: 类似 `https://your-site.netlify.app` 或 `https://your-project.vercel.app`

### Q: 这些平台免费吗?
A: 是的,都有足够的免费套餐供个人项目使用。

---

## 📞 需要帮助?

如果在部署过程中遇到问题,请告诉我具体错误信息,我会帮你解决!
