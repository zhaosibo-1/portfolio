# 🌌 宇宙科技风个人作品展示站

一套可公网部署的个人作品展示双页面独立网站，整体风格为**简约炫酷科技宇宙风**，全页面电脑、手机端完全响应式自适应，技术栈采用 **HTML + CSS + 原生 JavaScript**，搭配轻量化 **Node.js + Express** 后端架构，采用 **JSON 文件** 持久化存储方案。

---

## 📋 目录结构

```
portfolio/
├── index.html              # 公开访客作品集前台主页
├── admin.html              # 管理员私密作品上传后台页面
├── detail.html             # 作品独立详情页
├── start.bat               # Windows 一键启动脚本
├── package.json            # 项目依赖配置
│
├── css/
│   ├── theme.css           # 全局主题变量、基础重置、排版
│   ├── components.css      # 作品卡片、个人简介、技能、联系区
│   ├── filter-detail.css   # 筛选标签栏、详情页样式
│   └── admin.css           # 管理后台登录、面板、表单样式
│
├── js/
│   ├── starfield.js        # ★ 核心: 全屏宇宙星空粒子特效引擎
│   ├── api.js              # API 通信层封装
│   ├── main.js             # 前台主页逻辑(加载作品/筛选/渲染)
│   ├── admin.js            # 管理后台逻辑(登录/CRUD/排序)
│   └── detail.js           # 详情页逻辑(加载渲染作品)
│
├── server/
│   └── index.js            # Express 后端服务
│
├── data/
│   └── projects.json       # 作品数据持久化文件(JSON)
│
└── uploads/
    └── .gitkeep            # 上传图片存储目录
```

---

## 🚀 本地一键启动

### 前置要求

- 安装 **Node.js** (v16 或更高版本)
- 下载地址: https://nodejs.org/ (选择 LTS 版本)

### 启动步骤

**Windows 用户：**
```bash
# 双击 start.bat 即可一键启动
# 或者打开终端执行：
cd portfolio
npm install
node server/index.js
```

**macOS / Linux 用户：**
```bash
cd portfolio
npm install
node server/index.js
```

启动后终端输出：
```
============================================
  🌌 宇宙科技风个人作品展示站 已启动
============================================
  本地访问: http://localhost:3000
  前台主页: http://localhost:3000
  管理后台: http://localhost:3000/admin.html
  管理员密码: admin888
============================================
```

---

## 📖 使用说明书

### 一、管理员后台操作

#### 1. 登录后台
- 浏览器打开 `http://localhost:3000/admin.html`
- 输入默认密码: **admin888**
- 登录成功后自动进入管理面板

#### 2. 新增作品
- 点击左侧「新增作品」
- 填写项目名称（必填）、完成时间、分类标签（用逗号分隔）
- 填写项目详细介绍文案
- 上传/输入封面图 URL
- 上传多张项目截图
- 填写 GitHub 源码地址、在线演示链接
- 点击「保存作品」

#### 3. 编辑作品
- 在作品列表面板中，点击目标作品的「编辑」按钮
- 修改任意字段后点击「保存作品」

#### 4. 删除作品
- 在作品列表中点击目标作品的「删除」按钮
- 确认删除后，该作品及关联的上传文件将被永久移除

#### 5. 拖拽排序
- 在作品列表中直接拖拽任意作品卡片
- 松开后自动保存新的排序顺序

#### 6. 修改管理员密码
- 编辑 `data/projects.json` 文件
- 修改 `adminPassword` 字段的值
- 保存文件后生效，无需重启服务

#### 7. 退出登录
- 点击左侧「退出登录」

### 二、前台主页操作

#### 1. 查看作品
- 主页展示全部作品的流式科技发光卡片
- 卡片展示封面、项目名称、简短简介、分类标签、完工时间

#### 2. 标签筛选
- 点击筛选栏中的标签，快速筛选对应分类的全部作品
- 点击「全部」恢复显示全部作品

#### 3. 作品详情
- 点击任意作品卡片，跳转至独立详情页
- 详情页展示全部图文资料、GitHub 源码跳转、在线演示跳转

#### 4. 主题切换
- 点击页面右上角的 🌙/☀️ 按钮一键切换深色/浅色模式
- 主题切换后星空背景色温自动适配

### 三、静态资源存储方案

- 所有上传的图片存储在 `uploads/` 目录下
- 图片通过 URL 路径 `/uploads/文件名` 访问
- 部署后建议将 `uploads/` 目录替换为云存储（如阿里云 OSS、腾讯云 COS）
- 如需迁移已有数据，将 `uploads/` 目录和 `data/projects.json` 一起备份

### 四、自定义修改指南

#### 修改个人资料
- 编辑 `index.html` 中 `#profile` 区域的默认文本
- 或通过后端 API 返回 profile 对象动态填充（高级用法）

#### 修改技能列表
- 编辑 `index.html` 中 `#skillsGrid` 内的默认 skill-badge
- 或通过后端 API 返回 skills 数组动态填充

#### 修改主题颜色
- 编辑 `css/theme.css` 中的 CSS 变量 `--accent-primary`、`--accent-secondary` 等
- 深色模式在 `:root {}` 中，浅色模式在 `[data-theme="light"] {}` 中

#### 修改星空特效参数
- 编辑 `js/starfield.js` 中的 `CONFIG` 对象
- 可调整星星数量、闪烁速度、流星频率、鼠标影响半径等

---

## 🌐 公网部署教程

### 方案一：国内云服务器部署（推荐）

#### 前置准备
1. 购买一台云服务器（阿里云/腾讯云/华为云）：
   - 配置建议：1核2G 以上，系统 Ubuntu 20.04 或 CentOS 7+
   - 开放端口：**3000**（或使用 Nginx 反向代理绑定 80/443）

#### 部署步骤

```bash
# 1. 连接服务器（使用 SSH 客户端如 Xshell、Putty）
ssh root@你的服务器IP

# 2. 安装 Node.js（如已安装可跳过）
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 3. 上传项目到服务器（使用 SCP 或 FTP）
# 本地执行：
scp -r portfolio/ root@你的服务器IP:/var/www/

# 4. 安装依赖并启动
cd /var/www/portfolio
npm install
node server/index.js

# 5. 使用 PM2 持久化运行（进程守护，服务器重启自动启动）
npm install -g pm2
pm2 start server/index.js --name portfolio
pm2 save
pm2 startup   # 按提示执行命令，确保开机自启
```

#### Nginx 反向代理（推荐，可选）

```nginx
# /etc/nginx/sites-available/portfolio
server {
    listen 80;
    server_name yourdomain.com;  # 换成你的域名

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件大小限制
    client_max_body_size 20m;
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 可选：配置 SSL 证书（HTTPS）
apt-get install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

#### 域名解析
1. 在域名管理后台（如阿里云万网、腾讯云 DNSPod）添加 **A 记录**
2. 记录类型：A，主机记录：@ 或 www，记录值：你的服务器公网 IP
3. 等待 DNS 生效（通常 10 分钟到 2 小时）

#### 修改管理员密码（部署后务必操作）
```bash
# 编辑数据文件
nano /var/www/portfolio/data/projects.json
# 修改 "adminPassword" 字段为强密码
# Ctrl+X 保存退出，然后重启服务
pm2 restart portfolio
```

---

### 方案二：Vercel / Netlify 免费静态托管

> ⚠️ 注意：免费静态平台不支持 Node.js 后端。
> 如需完整功能（文件上传、数据持久化、管理员登录），需配合后端 API 服务。
> 
> 以下方案提供两种选择：

#### 选择 A：纯前端展示版（无需后端）

1. **修改前端代码，使用 Mock 数据或 localStorage**
   - 编辑 `js/main.js`，将 `API.getProjects()` 替换为本地数据
   - 或使用 localStorage 存储作品数据

2. **部署到 Vercel**
   ```bash
   # 安装 Vercel CLI
   npm install -g vercel
   
   # 在 portfolio 目录下部署
   cd portfolio
   vercel
   ```

3. **部署到 Netlify**
   - 访问 https://app.netlify.com
   - 拖拽 `portfolio/` 目录到上传区域
   - 或连接 GitHub 仓库自动部署

#### 选择 B：全功能版（后端使用免费云服务）

推荐使用 **Railway** 或 **Render** 免费托管后端：

1. ** Railway 部署步骤**：
   - 注册 https://railway.app (GitHub 登录)
   - 创建 New Project → Deploy from GitHub repo
   - 连接包含 `portfolio/` 的仓库
   - Start Command 设为 `node server/index.js`
   - 部署后 Railway 会自动分配域名，如 `portfolio.up.railway.app`

2. **前端部署到 Vercel**：
   - 修改 `js/api.js` 中的 `BASE` 变量为 Railway 域名
   - 部署前端到 Vercel

---

## 🎨 星空特效配置说明

编辑 `js/starfield.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  starCount: 600,           // 星星数量（移动端自动减半）
  starSizes: [0.6, 1.2, 2.2],  // 小、中、大三种尺寸
  twinkleSpeed: [0.008, 0.025], // 闪烁速度范围
  mouseRadius: 150,         // 鼠标影响半径(px)
  mouseGlowScale: 2.0,      // 鼠标光晕放大倍数
  meteorInterval: [3000, 8000], // 流星生成间隔(ms)
  maxFPS: 60,               // 帧率上限
};
```

---

## 📄 开源许可

MIT License

---

## 💡 常见问题

**Q: 忘记管理员密码怎么办？**
A: 编辑 `data/projects.json`，修改 `adminPassword` 字段，保存后刷新页面。

**Q: 上传图片大小有限制吗？**
A: 单文件最大 10MB，支持 jpg/png/gif/webp/svg/bmp 格式。

**Q: 如何备份数据？**
A: 备份 `data/projects.json` 和 `uploads/` 目录即可。

**Q: 服务器重启后为什么需要重新登录？**
A: 登录信息存储在内存中，重启后会话丢失。这是安全设计，每次重启需重新登录。
