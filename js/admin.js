/**
 * ============================================================
 * 宇宙科技风个人作品展示站 - 管理后台逻辑
 * 功能: 登录验证 | 作品CRUD | 拖拽排序 | 图片上传
 * ============================================================
 */

(function () {
  'use strict';

  let projects = [];
  let dragSrcEl = null;

  const $ = (sel) => document.querySelector(sel);
  const dom = {
    loginPage: $('#loginPage'),
    adminPanel: $('#adminPanel'),
    loginPassword: $('#loginPassword'),
    loginError: $('#loginError'),
    projectList: $('#projectList'),
    emptyState: $('#emptyState'),
    viewList: $('#viewList'),
    viewForm: $('#viewForm'),
    formTitle: $('#formTitle'),
    editId: $('#editId'),
    pTitle: $('#pTitle'),
    pDate: $('#pDate'),
    pTags: $('#pTags'),
    pDesc: $('#pDesc'),
    pCover: $('#pCover'),
    pCoverFile: $('#pCoverFile'),
    pScreenshots: $('#pScreenshots'),
    pGithub: $('#pGithub'),
    pLive: $('#pLive'),
    screenshotPreview: $('#screenshotPreview'),
    adminSidebar: $('#adminSidebar'),
  };

  /* ========== 登录 ========== */
  window.handleLogin = async function () {
    const pw = dom.loginPassword.value.trim();
    if (!pw) { dom.loginError.textContent = '请输入密码'; return; }
    dom.loginError.textContent = '';
    try {
      const res = await API.login(pw);
      if (res.success) {
        dom.loginPage.style.display = 'none';
        dom.adminPanel.style.display = 'flex';
        loadProjects();
        showToast('登录成功', 'success');
      }
    } catch (err) {
      dom.loginError.textContent = err.message;
    }
  };

  dom.loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') window.handleLogin();
  });

  /* ========== 检查登录状态 ========== */
  async function checkAuth() {
    try {
      const res = await API.checkAuth();
      if (res.isAdmin) {
        dom.loginPage.style.display = 'none';
        dom.adminPanel.style.display = 'flex';
        loadProjects();
      }
    } catch (_) { /* 未登录，显示登录页 */ }
  }

  /* ========== 退出 ========== */
  window.handleLogout = async function () {
    try {
      await API.logout();
    } catch (_) {}
    location.reload();
  };

  /* ========== 视图切换 ========== */
  window.showView = function (view) {
    dom.viewList.style.display = view === 'list' ? 'block' : 'none';
    dom.viewForm.style.display = view === 'add' ? 'block' : 'none';
    if (view === 'add') {
      dom.formTitle.textContent = '➕ 新增作品';
      resetForm();
    }
    // 移动端自动关闭侧边栏
    if (window.innerWidth <= 768) {
      dom.adminSidebar.style.display = 'none';
    }
  };

  window.toggleSidebar = function () {
    const sidebar = dom.adminSidebar;
    sidebar.style.display = sidebar.style.display === 'none' ? '' : 'none';
  };

  /* ========== 加载作品列表 ========== */
  async function loadProjects() {
    try {
      const data = await API.getProjects();
      projects = data.projects || data || [];
      renderList();
    } catch (err) {
      showToast('加载失败: ' + err.message, 'error');
    }
  }

  function renderList() {
    dom.projectList.innerHTML = '';
    if (!projects.length) {
      dom.emptyState.style.display = 'block';
      return;
    }
    dom.emptyState.style.display = 'none';
    projects.forEach((p, index) => {
      const li = document.createElement('li');
      li.className = 'admin-list-item';
      li.draggable = true;
      li.dataset.index = index;
      li.innerHTML = `
        <span class="drag-handle" title="拖拽排序">⠿</span>
        <img class="item-cover" src="${p.cover || ''}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><rect fill=%22%23333%22 width=%2260%22 height=%2260%22/><text fill=%22%23666%22 font-size=%2220%22 x=%2220%22 y=%2238%22>📦</text></svg>'">
        <div class="item-info">
          <h4>${p.title || '未命名'}</h4>
          <div class="item-date">${p.date || ''} ${(p.tags||[]).join(', ')}</div>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary btn-sm" onclick="editProject('${p.id}')">✏️ 编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProject('${p.id}')">🗑 删除</button>
        </div>
      `;
      // 拖拽事件
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragend', handleDragEnd);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('dragenter', handleDragEnter);
      li.addEventListener('dragleave', handleDragLeave);
      li.addEventListener('drop', handleDrop);
      dom.projectList.appendChild(li);
    });
  }

  /* ========== 拖拽排序 ========== */
  function handleDragStart(e) {
    dragSrcEl = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.index);
  }
  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.admin-list-item').forEach(el => el.classList.remove('drag-over'));
  }
  function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  function handleDragEnter(e) { e.preventDefault(); this.classList.add('drag-over'); }
  function handleDragLeave() { this.classList.remove('drag-over'); }
  async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
    const toIdx = parseInt(this.dataset.index);
    if (fromIdx === toIdx) return;
    // 重新排序数组
    const item = projects.splice(fromIdx, 1)[0];
    projects.splice(toIdx, 0, item);
    renderList();
    // 持久化新顺序
    try {
      await API.reorderProjects(projects.map(p => p.id));
      showToast('排序已保存', 'success');
    } catch (err) {
      showToast('排序保存失败', 'error');
    }
  }

  /* ========== 表单操作 ========== */
  function resetForm() {
    dom.editId.value = '';
    dom.pTitle.value = '';
    dom.pDate.value = '';
    dom.pTags.value = '';
    dom.pDesc.value = '';
    dom.pCover.value = '';
    dom.pCoverFile.value = '';
    dom.pScreenshots.value = '';
    dom.pGithub.value = '';
    dom.pLive.value = '';
    dom.screenshotPreview.innerHTML = '';
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.editProject = function (id) {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    dom.formTitle.textContent = '✏️ 编辑作品';
    dom.editId.value = p.id;
    dom.pTitle.value = p.title || '';
    dom.pDate.value = p.date || '';
    dom.pTags.value = (p.tags || []).join(', ');
    dom.pDesc.value = p.desc || '';
    dom.pCover.value = p.cover || '';
    dom.pGithub.value = p.github || '';
    dom.pLive.value = p.live || '';
    dom.screenshotPreview.innerHTML = (p.screenshots || [])
      .map(url => `<img src="${url}" style="width:100px;height:70px;object-fit:cover;border-radius:6px;border:1px solid var(--glass-border);">`)
      .join('');
    showView('form');
  };

  window.handleSave = async function () {
    const title = dom.pTitle.value.trim();
    if (!title) { showToast('请填写项目名称', 'error'); return; }

    const data = {
      title,
      date: dom.pDate.value || '',
      tags: dom.pTags.value.split(',').map(s => s.trim()).filter(Boolean),
      desc: dom.pDesc.value.trim() || '',
      cover: dom.pCover.value.trim() || '',
      github: dom.pGithub.value.trim() || '',
      live: dom.pLive.value.trim() || '',
    };

    // 如果有上传封面文件
    if (dom.pCoverFile.files.length > 0) {
      try {
        const uploadRes = await API.uploadFile(dom.pCoverFile.files[0]);
        data.cover = uploadRes.url;
      } catch (err) {
        showToast('封面上传失败: ' + err.message, 'error');
        return;
      }
    }

    // 上传截图文件
    if (dom.pScreenshots.files.length > 0) {
      const urls = [];
      for (const file of dom.pScreenshots.files) {
        try {
          const res = await API.uploadFile(file);
          urls.push(res.url);
        } catch (err) {
          showToast('截图上传失败: ' + err.message, 'error');
          return;
        }
      }
      data.screenshots = urls;
    }

    const editId = dom.editId.value;
    try {
      if (editId) {
        await API.updateProject(editId, data);
        showToast('作品已更新', 'success');
      } else {
        await API.createProject(data);
        showToast('作品已添加', 'success');
      }
      showView('list');
      loadProjects();
    } catch (err) {
      showToast('保存失败: ' + err.message, 'error');
    }
  };

  window.deleteProject = async function (id) {
    if (!confirm('确定要删除这个作品吗？此操作不可撤销。')) return;
    try {
      await API.deleteProject(id);
      showToast('作品已删除', 'success');
      loadProjects();
    } catch (err) {
      showToast('删除失败: ' + err.message, 'error');
    }
  };

  /* ========== Toast 通知 ========== */
  function showToast(msg, type) {
    const el = document.createElement('div');
    el.className = `toast toast-${type || 'success'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ========== 初始化 ========== */
  // 启动星空
  if (window.Starfield) Starfield.start('dark');
  checkAuth();
})();
