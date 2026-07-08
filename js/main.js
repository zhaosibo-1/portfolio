/**
 * 宇宙科技风 - 前台主页逻辑
 * 功能: 星空启动 | 打字动画 | 作品加载 | 筛选 | 主题切换
 */
(function () {
  'use strict';

  let allProjects = [];
  let currentFilter = '全部';

  const dom = {
    projectsGrid: document.querySelector('#projectsGrid'),
    filterBar: document.querySelector('#filterBar'),
    skillsGrid: document.querySelector('#skillsGrid'),
    themeToggle: document.querySelector('#themeToggle'),
    avatarImg: document.querySelector('#avatarImg'),
    profileName: document.querySelector('#profileName'),
    profileTitle: document.querySelector('#profileTitle'),
    profileBio: document.querySelector('#profileBio'),
    githubLink: document.querySelector('#githubLink'),
    emailLink: document.querySelector('#emailLink'),
    footerGithub: document.querySelector('#footerGithub'),
    footerEmail: document.querySelector('#footerEmail'),
    footerYear: document.querySelector('#footerYear'),
    typingText: document.querySelector('#typingText'),
  };

  dom.footerYear.textContent = new Date().getFullYear();

  /* ========== 打字动画 ========== */
  const TYPING_WORDS = [
    '全栈开发者',
    '创意工程师',
    'UI/UX 设计师',
    '开源爱好者',
    '科技极客',
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const word = TYPING_WORDS[wordIndex];
    if (isDeleting) {
      dom.typingText.textContent = word.substring(0, charIndex--);
    } else {
      dom.typingText.textContent = word.substring(0, charIndex++);
    }
    if (!isDeleting && charIndex === word.length) {
      setTimeout(() => isDeleting = true, 2000);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % TYPING_WORDS.length;
    }
    setTimeout(typeEffect, isDeleting ? 60 : 120);
  }

  /* ========== 主题 ========== */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);
    dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (window.Starfield) Starfield.setTheme(theme);
  }

  function toggleTheme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  /* ========== 个人资料 ========== */
  function loadProfile(profile) {
    if (!profile) return;
    if (profile.avatar) dom.avatarImg.src = profile.avatar;
    if (profile.name) dom.profileName.textContent = profile.name;
    if (profile.title) dom.profileTitle.textContent = profile.title;
    if (profile.bio) dom.profileBio.textContent = profile.bio;
    if (profile.github) {
      dom.githubLink.href = profile.github;
      dom.footerGithub.href = profile.github;
    }
    if (profile.email) {
      dom.emailLink.href = `mailto:${profile.email}`;
      dom.footerEmail.href = `mailto:${profile.email}`;
    }
  }

  /* ========== 技能 ========== */
  function renderSkills(skills) {
    if (!skills || !skills.length) return;
    dom.skillsGrid.innerHTML = skills.map(s =>
      `<span class="skill-badge" style="animation-delay:${Math.random()*0.5}s">${s}</span>`
    ).join('');
  }

  /* ========== 作品卡片 ========== */
  function renderProjects(projects) {
    if (!projects || projects.length === 0) {
      dom.projectsGrid.innerHTML = '<div class="empty-state"><p>暂无作品展示</p></div>';
      return;
    }
    dom.projectsGrid.innerHTML = projects.map((p, i) => {
      const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      const date = p.date ? `<span class="card-date">${p.date}</span>` : '';
      const desc = (p.desc || '').substring(0, 120);
      return `<div class="project-card" onclick="location.href='/detail.html?id=${p.id}'"
                  style="animation:fadeInUp 0.6s ease-out ${i*0.1}s backwards">
          <img class="card-cover" src="${p.cover || ''}" alt="${p.title}" loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22340%22 height=%22220%22><rect fill=%22%2311182a%22 width=%22340%22 height=%22220%22/><text fill=%22%233a5a8a%22 font-size=%2224%22 x=%22140%22 y=%22115%22>✦</text></svg>'">
          <div class="card-body">
            <h3>${p.title || '未命名项目'}</h3>
            <div class="card-desc">${desc || '暂无简介'}</div>
            <div class="card-tags">${tags}${date}</div>
          </div>
        </div>`;
    }).join('');
  }

  /* ========== 筛选 ========== */
  function renderFilters(projects) {
    const tagSet = new Set();
    projects.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    const tags = ['全部', ...Array.from(tagSet).sort()];
    dom.filterBar.innerHTML = tags.map(t =>
      `<button class="filter-btn${t === currentFilter ? ' active' : ''}" data-tag="${t}">${t}</button>`
    ).join('');
    dom.filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        currentFilter = this.dataset.tag;
        dom.filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        applyFilter();
      });
    });
  }

  function applyFilter() {
    const filtered = currentFilter === '全部'
      ? allProjects
      : allProjects.filter(p => (p.tags || []).includes(currentFilter));
    renderProjects(filtered);
  }

  /* ========== 初始化 ========== */
  async function init() {
    // 启动星空
    const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
    if (window.Starfield) Starfield.start(savedTheme);

    // 主题切换
    dom.themeToggle.addEventListener('click', toggleTheme);
    setTheme(savedTheme);

    // 启动打字动画
    setTimeout(typeEffect, 1000);

    // 加载数据
    try {
      const data = await API.getProjects();
      if (data.profile) loadProfile(data.profile);
      if (data.skills) renderSkills(data.skills);
      allProjects = data.projects || data || [];
      if (Array.isArray(allProjects)) {
        renderFilters(allProjects);
        applyFilter();
      }
    } catch (err) {
      console.error('加载失败:', err);
      dom.projectsGrid.innerHTML =
        `<div class="empty-state"><p>😅 加载失败，请确保服务器已启动</p></div>`;
    }
  }

  init();
})();
