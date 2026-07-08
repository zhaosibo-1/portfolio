/**
 * ============================================================
 * 全屏高级宇宙星空粒子特效引擎
 * 技术: Canvas 2D + requestAnimationFrame
 * 功能: 多层星辰闪烁 | 3D纵深流动 | 光晕波纹 | 流星 | 主题自适应
 * ============================================================
 * 使用方式: 在页面中引用此脚本, 会自动创建 <canvas#starfield>
 * 并挂载到 body 最底层。通过 CSS 设置 #starfield 为 fixed 定位。
 * 主题切换调用 setStarfieldTheme('dark'|'light')。
 * ============================================================
 */

(function () {
  'use strict';

  // ---- 配置参数 ----
  const CONFIG = {
    // 基础星星数量(会根据设备性能自动调整)
    starCount: 600,
    // 星星尺寸层级: [小, 中, 大]
    starSizes: [0.6, 1.2, 2.2],
    // 各尺寸比例(总和=1)
    starRatio: [0.6, 0.3, 0.1],
    // 闪烁速度范围 [最慢, 最快]
    twinkleSpeed: [0.008, 0.025],
    // 闪烁幅度(透明度变化范围)
    twinkleRange: [0.3, 1.0],
    // 纵深流动速度范围
    flowSpeed: [0.08, 0.35],
    // 光晕扩散大小
    glowSize: [4, 20],
    // 鼠标影响半径
    mouseRadius: 150,
    // 鼠标光晕放大倍数
    mouseGlowScale: 2.0,
    // 流星间隔 [最短, 最长] (毫秒)
    meteorInterval: [3000, 8000],
    // 流星速度
    meteorSpeed: [4, 9],
    // 流星球数量上限
    maxMeteors: 3,
    // 帧率上限
    maxFPS: 60,
    // 移动端降级比例
    mobileRatio: 0.5,
  };

  // ---- 主题色配置 ----
  const THEMES = {
    dark: {
      bg: '#0a0e27',
      starColor: '#ffffff',
      glowColor: 'rgba(180, 200, 255, 0.15)',
      meteorColor1: 'rgba(180, 220, 255, 1)',
      meteorColor2: 'rgba(100, 160, 255, 0)',
      mouseGlowColor: 'rgba(150, 190, 255, 0.3)',
    },
    light: {
      bg: '#d6e4f0',
      starColor: '#2a3a5a',
      glowColor: 'rgba(100, 140, 200, 0.1)',
      meteorColor1: 'rgba(160, 200, 230, 1)',
      meteorColor2: 'rgba(200, 220, 240, 0)',
      mouseGlowColor: 'rgba(100, 150, 220, 0.2)',
    },
  };

  // ---- 状态 ----
  let canvas, ctx;
  let stars = [];
  let meteors = [];
  let mouseX = -9999;
  let mouseY = -9999;
  let animId = null;
  let lastFrameTime = 0;
  let nextMeteorTime = 0;
  let currentTheme = 'dark';
  let colors = THEMES.dark;
  let isRunning = false;
  let devicePixelRatio = 1;

  // ---- 工具函数 ----
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

  // ---- 初始化星空 ----
  function initStars(width, height) {
    stars = [];
    // 根据设备性能调整数量
    let count = CONFIG.starCount;
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    if (isMobile) count = Math.floor(count * CONFIG.mobileRatio);
    // 低端设备检测: 内存 < 4GB 或 低端GPU (简单检测)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      count = Math.floor(count * 0.6);
    }

    for (let i = 0; i < count; i++) {
      // 确定尺寸层级
      const r = Math.random();
      let sizeIndex = 0;
      let cum = 0;
      for (let j = 0; j < CONFIG.starRatio.length; j++) {
        cum += CONFIG.starRatio[j];
        if (r <= cum) { sizeIndex = j; break; }
      }

      const size = CONFIG.starSizes[sizeIndex];
      const z = rand(0.2, 1.0); // 深度(0远1近)

      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        z: z,
        size: size,
        baseSize: size,
        // 闪烁相位偏移
        phase: rand(0, Math.PI * 2),
        // 闪烁速度
        twinkleSpeed: rand(CONFIG.twinkleSpeed[0], CONFIG.twinkleSpeed[1]),
        // 基础不透明度
        baseAlpha: rand(0.5, 1.0),
        // 纵深流动速度 (近快远慢)
        flowSpeed: CONFIG.flowSpeed[0] + (1 - z) * (CONFIG.flowSpeed[1] - CONFIG.flowSpeed[0]),
        // 流动方向
        flowAngle: rand(0, Math.PI * 2),
        // 光晕尺寸
        glowSize: size * rand(2, 5),
      });
    }
  }

  // ---- 创建流星 ----
  function spawnMeteor(width, height) {
    if (meteors.length >= CONFIG.maxMeteors) return;
    const fromEdge = randInt(0, 3); // 0上 1右 2下 3左
    let x, y, vx, vy;
    const speed = rand(CONFIG.meteorSpeed[0], CONFIG.meteorSpeed[1]);
    const angle = rand(-0.4, 0.4); // 略微随机角度

    switch (fromEdge) {
      case 0: // 上
        x = rand(0, width);
        y = -10;
        vx = speed * Math.sin(angle);
        vy = speed * Math.cos(angle);
        break;
      case 1: // 右
        x = width + 10;
        y = rand(0, height * 0.6);
        vx = -speed * Math.cos(angle);
        vy = speed * Math.sin(angle);
        break;
      case 2: // 下
        x = rand(0, width);
        y = height + 10;
        vx = speed * Math.sin(angle);
        vy = -speed * Math.cos(angle);
        break;
      case 3: // 左
        x = -10;
        y = rand(0, height * 0.6);
        vx = speed * Math.cos(angle);
        vy = speed * Math.sin(angle);
        break;
    }

    // 尾迹长度
    const tailLength = randInt(40, 120);

    meteors.push({
      x, y, vx, vy,
      tail: tailLength,
      life: 1.0,
      alpha: 1.0,
      width: rand(1.5, 3.0),
    });
  }

  // ---- 更新逻辑 ----
  function update(width, height, deltaSec) {
    // 限制delta防止跳帧
    const dt = Math.min(deltaSec, 0.05);

    // 更新星星位置(纵深流动)
    for (const s of stars) {
      // 星星沿流动方向缓慢移动
      s.x += Math.cos(s.flowAngle) * s.flowSpeed * dt * 30;
      s.y += Math.sin(s.flowAngle) * s.flowSpeed * dt * 30;

      // 边界循环
      const margin = 50;
      if (s.x < -margin) s.x = width + margin;
      if (s.x > width + margin) s.x = -margin;
      if (s.y < -margin) s.y = height + margin;
      if (s.y > height + margin) s.y = -margin;
    }

    // 更新流星
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt * 60;
      m.y += m.vy * dt * 60;
      m.life -= dt * 0.6;
      m.alpha = Math.max(0, m.life);
      if (m.life <= 0) {
        meteors.splice(i, 1);
      }
    }
  }

  // ---- 渲染 ----
  function render(width, height, time) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // ---- 绘制星星 ----
    for (const s of stars) {
      // 闪烁: 根据正弦波计算当前透明度
      const twinkle = Math.sin(time * s.twinkleSpeed + s.phase) * 0.5 + 0.5;
      const alpha = s.baseAlpha * (CONFIG.twinkleRange[0] + twinkle * (CONFIG.twinkleRange[1] - CONFIG.twinkleRange[0]));

      // 计算与鼠标的距离
      const dx = s.x - mouseX;
      const dy = s.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mouseInfluence = Math.max(0, 1 - dist / CONFIG.mouseRadius);

      // 尺寸受鼠标影响略微放大
      const sizeScale = 1 + mouseInfluence * 0.4;
      const drawSize = s.baseSize * sizeScale;

      // ---- 光晕 ----
      if (s.baseSize > 0.8) {
        // 光晕大小受鼠标影响
        const glowScale = 1 + mouseInfluence * CONFIG.mouseGlowScale;
        const glowR = s.glowSize * glowScale;
        const glowAlpha = 0.08 + mouseInfluence * 0.2 + alpha * 0.05;
        const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        if (mouseInfluence > 0) {
          gradient.addColorStop(0, `rgba(180, 200, 255, ${glowAlpha * 0.5})`);
          gradient.addColorStop(0.3, `rgba(160, 190, 255, ${glowAlpha * 0.3})`);
          gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        } else {
          gradient.addColorStop(0, `rgba(200, 210, 255, ${glowAlpha * 0.3})`);
          gradient.addColorStop(1, 'rgba(150, 170, 255, 0)');
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // ---- 星星本体 ----
      ctx.beginPath();
      ctx.arc(s.x, s.y, drawSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${currentTheme === 'dark' ? '255,255,255' : '42,58,90'}, ${alpha})`;
      ctx.fill();

      // 大星星额外高光
      if (s.baseSize >= 1.8) {
        ctx.beginPath();
        ctx.arc(s.x - drawSize * 0.2, s.y - drawSize * 0.2, drawSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
        ctx.fill();
      }

      // ---- 鼠标光拖尾效果 ----
      if (mouseInfluence > 0.3 && s.baseSize > 0.8) {
        const tailLen = mouseInfluence * 20;
        const angle = Math.atan2(s.y - mouseY, s.x - mouseX);
        const tailAlpha = mouseInfluence * 0.15 * alpha;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(angle) * tailLen, s.y + Math.sin(angle) * tailLen);
        ctx.strokeStyle = `rgba(180, 200, 255, ${tailAlpha})`;
        ctx.lineWidth = drawSize * 0.5;
        ctx.stroke();
      }
    }

    // ---- 绘制流星 ----
    for (const m of meteors) {
      const len = m.tail;
      const angle = Math.atan2(m.vy, m.vx);

      ctx.beginPath();
      ctx.moveTo(m.x, m.y);

      // 尾迹终点
      const endX = m.x - Math.cos(angle) * len;
      const endY = m.y - Math.sin(angle) * len;

      ctx.lineTo(endX, endY);

      // 渐变尾迹: 头亮尾淡
      const gradient = ctx.createLinearGradient(m.x, m.y, endX, endY);
      if (currentTheme === 'dark') {
        gradient.addColorStop(0, `rgba(180, 220, 255, ${m.alpha})`);
        gradient.addColorStop(0.3, `rgba(140, 190, 255, ${m.alpha * 0.6})`);
        gradient.addColorStop(1, 'rgba(100, 160, 255, 0)');
      } else {
        gradient.addColorStop(0, `rgba(160, 200, 230, ${m.alpha})`);
        gradient.addColorStop(0.3, `rgba(180, 210, 235, ${m.alpha * 0.6})`);
        gradient.addColorStop(1, 'rgba(200, 220, 240, 0)');
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = m.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 流星头部光晕
      const headGradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
      if (currentTheme === 'dark') {
        headGradient.addColorStop(0, `rgba(200, 230, 255, ${m.alpha * 0.8})`);
        headGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
      } else {
        headGradient.addColorStop(0, `rgba(200, 225, 240, ${m.alpha * 0.6})`);
        headGradient.addColorStop(1, 'rgba(180, 210, 235, 0)');
      }
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = headGradient;
      ctx.fill();
    }
  }

  // ---- 主动画循环 ----
  function animate(timestamp) {
    if (!isRunning) return;

    // 帧率限制
    const maxInterval = 1000 / CONFIG.maxFPS;
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < maxInterval) {
      animId = requestAnimationFrame(animate);
      return;
    }
    const deltaSec = elapsed / 1000;
    lastFrameTime = timestamp;

    const width = canvas.width / devicePixelRatio;
    const height = canvas.height / devicePixelRatio;

    // 设置画布变换(高DPI)
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    // 更新
    update(width, height, deltaSec);

    // 生成流星
    if (timestamp > nextMeteorTime) {
      spawnMeteor(width, height);
      nextMeteorTime = timestamp + rand(CONFIG.meteorInterval[0], CONFIG.meteorInterval[1]);
    }

    // 渲染
    render(width, height, timestamp);

    animId = requestAnimationFrame(animate);
  }

  // ---- 调整大小 ----
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = devicePixelRatio;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // 重设星星(只在首次或尺寸大幅变化时)
    if (stars.length === 0 || Math.abs(w - (stars._prevWidth || 0)) > 100 || Math.abs(h - (stars._prevHeight || 0)) > 100) {
      initStars(w, h);
      stars._prevWidth = w;
      stars._prevHeight = h;
    }
  }

  // ---- 鼠标/触摸事件 ----
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    mouseY = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
  }

  function onMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }

  // ---- 公开API: 启动星空 ----
  function start(theme) {
    if (isRunning) return;
    isRunning = true;

    currentTheme = theme || 'dark';
    colors = THEMES[currentTheme];

    // 创建canvas
    canvas = document.createElement('canvas');
    canvas.id = 'starfield';
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
    document.body.insertBefore(canvas, document.body.firstChild);

    ctx = canvas.getContext('2d');
    devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2); // 限制最高2x防止性能问题

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchmove', onMouseMove, { passive: true });
    window.addEventListener('touchend', onMouseLeave);

    // 设置初始流星计时
    nextMeteorTime = performance.now() + rand(2000, 5000);

    lastFrameTime = performance.now();
    animId = requestAnimationFrame(animate);
  }

  // ---- 公开API: 停止星空 ----
  function stop() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('touchmove', onMouseMove);
    window.removeEventListener('touchend', onMouseLeave);
    stars = [];
    meteors = [];
  }

  // ---- 公开API: 切换主题 ----
  function setTheme(theme) {
    currentTheme = theme;
    colors = THEMES[theme];
    // 更新canvas背景色(通过CSS)
    if (canvas) {
      canvas.style.backgroundColor = colors.bg;
    }
  }

  // ---- 公开API: 获取当前主题 ----
  function getTheme() {
    return currentTheme;
  }

  // ---- 导出到全局 ----
  window.Starfield = {
    start: start,
    stop: stop,
    setTheme: setTheme,
    getTheme: getTheme,
  };

})();
