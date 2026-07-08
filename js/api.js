/**
 * ============================================================
 * 宇宙科技风个人作品展示站 - API 通信层
 * 封装所有后端接口调用，统一处理认证与错误
 * ============================================================
 */

const API = (() => {
  const BASE = '';

  /** 通用 fetch 封装 */
  async function request(url, options = {}) {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };
    // 如果是 FormData，删除自动的 Content-Type 让浏览器设置
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    try {
      const res = await fetch(BASE + url, config);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查服务器是否运行');
      }
      throw err;
    }
  }

  return {
    // ---- 认证 ----
    login(password) {
      return request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },
    logout() {
      return request('/api/logout', { method: 'POST' });
    },
    checkAuth() {
      return request('/api/check-auth');
    },

    // ---- 作品 CRUD ----
    getProjects() {
      return request('/api/projects');
    },
    getProject(id) {
      return request(`/api/projects/${id}`);
    },
    createProject(data) {
      return request('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateProject(id, data) {
      return request(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteProject(id) {
      return request(`/api/projects/${id}`, { method: 'DELETE' });
    },
    reorderProjects(ids) {
      return request('/api/projects/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
      });
    },

    // ---- 文件上传 ----
    uploadFile(file) {
      const formData = new FormData();
      formData.append('file', file);
      return request('/api/upload', {
        method: 'POST',
        body: formData,
      });
    },
    uploadImage(url) {
      return request('/api/upload-by-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },
  };
})();
