/**
 * 宇宙科技风个人作品展示站 - 后端服务
 * Express + express-session + multer + 文件持久化
 */

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin888';
const DATA_FILE = path.join(__dirname, '..', 'data', 'projects.json');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cosmic-portfolio-secret-key-2024',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(UPLOAD_DIR));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg','.jpeg','.png','.gif','.webp','.svg','.bmp'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10*1024*1024 } });

// ========== 数据持久化 ==========
function loadProjects() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return d.projects || [];
    }
  } catch (e) { console.error('读取失败:', e.message); }
  return [];
}
function saveProjects(projects) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let pw = ADMIN_PASSWORD;
    try {
      const ex = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (ex.adminPassword) pw = ex.adminPassword;
    } catch (_) {}
    fs.writeFileSync(DATA_FILE, JSON.stringify({ projects, adminPassword: pw }, null, 2), 'utf-8');
  } catch (e) { console.error('保存失败:', e.message); }
}

// ========== 认证中间件 ==========
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ success: false, message: '未登录' });
}

// ========== 认证接口 ==========
app.post('/api/login', (req, res) => {
  let pw = ADMIN_PASSWORD;
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (d.adminPassword) pw = d.adminPassword;
  } catch (_) {}
  if (req.body.password === pw) {
    req.session.isAdmin = true;
    res.json({ success: true, message: '登录成功' });
  } else {
    res.status(403).json({ success: false, message: '密码错误' });
  }
});
app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/api/check-auth', (req, res) => res.json({ success: true, isAdmin: !!req.session.isAdmin }));

// ========== 作品 CRUD ==========
app.get('/api/projects', (req, res) => {
  const projects = loadProjects().sort((a,b) => (a.order||999)-(b.order||999));
  // 同时返回作品列表（兼容主页直接消费）
  res.json({ success: true, projects });
});
app.get('/api/projects/:id', (req, res) => {
  const p = loadProjects().find(x => x.id === req.params.id);
  p ? res.json({ success: true, project: p }) : res.status(404).json({ success: false, message: '不存在' });
});
app.post('/api/projects', requireAdmin, (req, res) => {
  const { title, desc, cover, screenshots, github, live, tags, date } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ success: false, message: '名称不能为空' });
  const projects = loadProjects();
  const np = {
    id: uuidv4(), title: title.trim(), desc: desc || '', cover: cover || '',
    screenshots: screenshots || [], github: github || '', live: live || '',
    tags: tags || [], date: date || '', order: projects.length,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  projects.push(np);
  saveProjects(projects);
  res.json({ success: true, message: '新增成功', project: np });
});
app.put('/api/projects/:id', requireAdmin, (req, res) => {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: '不存在' });
  const { title, desc, cover, screenshots, github, live, tags, date } = req.body;
  if (title !== undefined) projects[idx].title = title.trim();
  if (desc !== undefined) projects[idx].desc = desc;
  if (cover !== undefined) projects[idx].cover = cover;
  if (screenshots !== undefined) projects[idx].screenshots = screenshots;
  if (github !== undefined) projects[idx].github = github;
  if (live !== undefined) projects[idx].live = live;
  if (tags !== undefined) projects[idx].tags = tags;
  if (date !== undefined) projects[idx].date = date;
  projects[idx].updatedAt = new Date().toISOString();
  saveProjects(projects);
  res.json({ success: true, message: '更新成功', project: projects[idx] });
});
app.delete('/api/projects/:id', requireAdmin, (req, res) => {
  let projects = loadProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: '不存在' });
  const p = projects[idx];
  // 删除关联文件
  if (p.cover && p.cover.startsWith('/uploads/')) {
    const fp = path.join(__dirname, '..', p.cover);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  (p.screenshots || []).forEach(img => {
    if (img.startsWith('/uploads/')) {
      try { fs.unlinkSync(path.join(__dirname, '..', img)); } catch(_) {}
    }
  });
  projects.splice(idx, 1);
  projects.forEach((p, i) => p.order = i);
  saveProjects(projects);
  res.json({ success: true, message: '已删除' });
});
app.put('/api/projects/reorder', requireAdmin, (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: '参数错误' });
  const projects = loadProjects();
  const reordered = [];
  ids.forEach((id, i) => {
    const p = projects.find(x => x.id === id);
    if (p) { p.order = i; reordered.push(p); }
  });
  projects.forEach(p => { if (!reordered.find(r => r.id === p.id)) { p.order = reordered.length; reordered.push(p); } });
  saveProjects(reordered);
  res.json({ success: true, message: '排序已更新' });
});

// ========== 图片上传 ==========
app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: '上传失败: ' + err.message });
    if (!req.file) return res.status(400).json({ success: false, message: '请选择文件' });
    res.json({ success: true, url: '/uploads/' + req.file.filename });
  });
});

// ========== 启动 ==========
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  Cosmic Portfolio Server Started');
  console.log('============================================');
  console.log('  http://localhost:' + PORT);
  console.log('  Admin password: ' + ADMIN_PASSWORD);
  console.log('============================================');
});
