/**
 * ============================================================
 * 宇宙科技风个人作品展示站 - 项目详情页逻辑
 * 功能: 加载作品详情 | 渲染图文 | 外部链接跳转
 * ============================================================
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const dom = {
    loading: $('#detailLoading'),
    content: $('#detailContent'),
    error: $('#detailError'),
  };

  /** 从 URL 获取作品 ID */
  function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  /** 渲染详情页 */
  function renderDetail(project) {
    if (!project) {
      dom.loading.style.display = 'none';
      dom.error.style.display = 'block';
      return;
    }

    // 生成标签 HTML
    const tags = (project.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    // 生成截图画廊
    const screenshots = (project.screenshots || []).map(url =>
      `<img src="${url}" alt="项目截图" loading="lazy" onclick="window.open('${url}','_blank')">`
    ).join('');

    // 生成按钮
    let actionsHtml = '';
    if (project.live) {
      actionsHtml += `<a href="${project.live}" class="btn-live" target="_blank" rel="noopener">🚀 在线演示</a>`;
    }
    if (project.github) {
      actionsHtml += `<a href="${project.github}" class="btn-github" target="_blank" rel="noopener">🔗 源代码</a>`;
    }

    dom.content.innerHTML = `
      <div class="detail-header">
        <h1>${project.title || '未命名项目'}</h1>
        <div class="detail-meta">
          ${project.date ? `<span>📅 ${project.date}</span>` : ''}
          ${tags ? `<span>🏷 ${tags}</span>` : ''}
        </div>
        <div class="detail-desc">${project.desc || '暂无详细介绍'}</div>
      </div>

      ${project.cover ? `<img src="${project.cover}" alt="${project.title}" class="detail-cover">` : ''}

      ${screenshots ? `<div class="detail-gallery">${screenshots}</div>` : ''}

      ${actionsHtml ? `<div class="detail-actions">${actionsHtml}</div>` : ''}

      <div style="margin-top:40px;">
        <a href="/" class="btn btn-secondary" style="text-decoration:none;display:inline-block;">← 返回首页</a>
      </div>
    `;

    dom.loading.style.display = 'none';
    dom.content.style.display = 'block';
  }

  /** 初始化 */
  async function init() {
    // 启动星空
    if (window.Starfield) Starfield.start('dark');

    const id = getProjectId();
    if (!id) {
      dom.loading.style.display = 'none';
      dom.error.style.display = 'block';
      dom.error.querySelector('p').textContent = '😅 缺少作品 ID';
      return;
    }
    try {
      const project = await API.getProject(id);
      renderDetail(project);
    } catch (err) {
      dom.loading.style.display = 'none';
      dom.error.style.display = 'block';
      dom.error.querySelector('p').textContent = '😅 作品不存在或加载失败';
      console.error(err);
    }
  }

  init();
})();
