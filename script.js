// 在脚本开始处添加一个标志，表示已经执行过初始化
let hasInitialized = false;

// 确保DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWebsite);
} else {
  // 如果DOM已经加载完成，直接初始化
  initializeWebsite();
}

function initializeWebsite() {
  console.log('页面加载完成，初始化中...');
  
  // 初始化页脚
  initFooter();
  
  // 启动性能监控
  requestAnimationFrame(monitorPerformance);
  
  // 显示主页元素的动画效果
  setTimeout(() => {
    const avatar = document.querySelector('.page-1 .avatar');
    const intro = document.querySelector('.page-1 .intro');
    if (avatar) avatar.classList.add('visible');
    if (intro) intro.classList.add('visible');
  }, 300);
  
  // 根据URL hash初始化页面
  initPageFromHash();
}

// 页面切换逻辑
const pages = document.querySelectorAll('.page');
let currentPage = 0;

function showPage(idx, direction = 0) {
  // 防止无效索引
  if (idx < 0 || idx >= pages.length) {
    console.warn(`尝试显示无效页面索引: ${idx}`);
    return;
  }
  
  // 如果已经是当前页，不做任何操作
  if (idx === currentPage && hasInitialized) {
    return;
  }
  
  // 标记正在切换
  isScrolling = true;
  
  // 隐藏所有页面
  pages.forEach((page, i) => {
    page.classList.remove('active', 'to-up', 'to-down');
    if (i === idx) {
      page.classList.add('active');
    } else if (i < idx) {
      page.classList.add('to-up');
    } else if (i > idx) {
      page.classList.add('to-down');
    }
  });
  
  // 更新当前页索引
  currentPage = idx;
  
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  
  // 如果切换到摄影作品页，更新背景
  if (idx === 2 && galleryImgs.length > 0) {
    updateGalleryBackground(activeIndex);
  }
  
  // 处理页脚显示
  handleFooterVisibility(idx);
  
  // 一段时间后重置滚动锁定状态
  setTimeout(() => {
    isScrolling = false;
    scrollAccumulator = 0;
  }, 800);
  
  // 更新导航栏激活状态
  updateNavActiveState(idx);
  
  // 标记已经完成初始化
  hasInitialized = true;
}

function nextPage() {
  if (currentPage < pages.length - 1) {
    showPage(currentPage + 1, 1);
  }
}

function prevPage() {
  if (currentPage > 0) {
    showPage(currentPage - 1, -1);
  }
}

// 向下箭头点击
const scrollDown = document.querySelector('.scroll-down');
if (scrollDown) {
  scrollDown.addEventListener('click', nextPage);
}

// 关于我页面的向下箭头
const aboutScrollDown = document.querySelector('.about-scroll-down');
if (aboutScrollDown) {
  aboutScrollDown.addEventListener('click', nextPage);
}

// 鼠标滚轮切换页面
window.addEventListener('wheel', (e) => {
  // 防止连续触发
  if (isScrolling) return;
  
  // 累积滚动距离，以便区分轻微滚动和明显滚动
  scrollAccumulator += e.deltaY;
  
  // 只有当累积滚动量超过阈值时才切换页面
  if (Math.abs(scrollAccumulator) < 50) return;
  
  isScrolling = true;
  setTimeout(() => { 
    isScrolling = false; 
    scrollAccumulator = 0; // 重置累积量
  }, 800); // 更长的冷却时间防止频繁切换
  
  if (scrollAccumulator > 0) nextPage();
  else if (scrollAccumulator < 0) prevPage();
}, { passive: true });

// 滚动累积器
let scrollAccumulator = 0;

// 防止连续滚动的标志
let isScrolling = false;

// 键盘上下键切换页面
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') nextPage();
  if (e.key === 'ArrowUp') prevPage();
});

// 注释掉这一行，因为我们在DOMContentLoaded事件中已经处理了初始页面显示
// showPage(0);

// 第二页图片循环展示，带3D过渡效果
const galleryImgs = document.querySelectorAll('.gallery-img');
const galleryBg = document.querySelector('.gallery-bg');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
let activeIndex = 0;

// 更新背景函数
function updateGalleryBackground(index) {
  if (galleryBg && galleryImgs[index]) {
    // 检查是否真的需要更新背景，避免不必要的操作
    if (galleryBg.src !== galleryImgs[index].src) {
      // 创建一个新的Image对象预加载图片
      const img = new Image();
      img.onload = () => {
        galleryBg.src = galleryImgs[index].src;
        // 添加过渡效果
        galleryBg.style.transition = 'opacity 0.8s';
        galleryBg.style.opacity = 0.2;
        requestAnimationFrame(() => {
          galleryBg.style.opacity = 0.85;
        });
      };
      img.src = galleryImgs[index].src;
    }
  }
}

// 图片预加载函数
function preloadNextImages(currentIndex) {
  // 预加载下一张和下下张图片
  const nextIndex = (currentIndex + 1) % galleryImgs.length;
  const nextNextIndex = (currentIndex + 2) % galleryImgs.length;
  
  // 创建临时Image对象进行预加载
  [nextIndex, nextNextIndex].forEach(idx => {
    if (!galleryImgs[idx].complete) {
      const preloader = new Image();
      preloader.src = galleryImgs[idx].src;
    }
  });
}

// 更新焦点图片函数
function updateGalleryFocus(newIndex, direction = 0) {
  // 使用requestAnimationFrame确保在下一帧渲染前执行，提高性能
  requestAnimationFrame(() => {
    // 计算前一张和后一张的索引
    const prevIndex = (newIndex - 1 + galleryImgs.length) % galleryImgs.length;
    const nextIndex = (newIndex + 1) % galleryImgs.length;
    
    // 更新所有图片的状态 - 只操作需要变化的图片，减少不必要的DOM操作
    galleryImgs.forEach((img, i) => {
      // 创建一个类列表数组，便于比较和修改
      const classList = ['active', 'prev', 'next'];
      let currentClass = null;
      
      if (i === newIndex) {
        currentClass = 'active';
      } else if (i === prevIndex) {
        currentClass = 'prev';
      } else if (i === nextIndex) {
        currentClass = 'next';
      }
      
      // 移除所有状态类
      classList.forEach(cls => {
        if (img.classList.contains(cls) && cls !== currentClass) {
          img.classList.remove(cls);
        }
      });
      
      // 添加新的状态类，仅当需要时
      if (currentClass && !img.classList.contains(currentClass)) {
        img.classList.add(currentClass);
      }
    });
    
    // 更新背景
    updateGalleryBackground(newIndex);
    activeIndex = newIndex;
    
    // 预加载下一张图片
    preloadNextImages(newIndex);
  });
}

// 切换到下一张
function nextGalleryImage() {
  const newIndex = (activeIndex + 1) % galleryImgs.length;
  updateGalleryFocus(newIndex, 1);
}

// 切换到上一张
function prevGalleryImage() {
  const newIndex = (activeIndex - 1 + galleryImgs.length) % galleryImgs.length;
  updateGalleryFocus(newIndex, -1);
}

// 设置画廊
function setupGallery() {
  // 优先预加载前5张图片
  for (let i = 0; i < Math.min(5, galleryImgs.length); i++) {
    preloadImage(galleryImgs[i].src);
  }

  // 为每个图片添加加载事件，确保完全加载后再显示
  galleryImgs.forEach((img, i) => {
    // 如果图片已经加载完成，直接设置类
    if (img.complete) {
      setGalleryImageClass(img, i);
    } else {
      // 否则等待加载完成
      img.onload = () => setGalleryImageClass(img, i);
    }
    
    // 移除所有点击事件
    img.style.pointerEvents = 'none'; // 确保图片完全不可点击
  });
  
  // 初始显示第一张
  updateGalleryBackground(0);
  
  // 设置自动播放 - 使用更长的间隔，减少资源消耗
  let galleryInterval = setInterval(nextGalleryImage, 4000);
  
  // 键盘控制 - 使用节流函数减少频繁触发
  const throttledKeyHandler = throttle((e) => {
    if (e.key === 'ArrowRight') {
      clearInterval(galleryInterval);
      nextGalleryImage();
      galleryInterval = setInterval(nextGalleryImage, 4000);
    } else if (e.key === 'ArrowLeft') {
      clearInterval(galleryInterval);
      prevGalleryImage();
      galleryInterval = setInterval(nextGalleryImage, 4000);
    }
  }, 300);
  
  window.addEventListener('keydown', throttledKeyHandler);
}

// 辅助函数：设置图片类
function setGalleryImageClass(img, index) {
  if (index === 0) {
    img.classList.add('active');
  } else if (index === 1) {
    img.classList.add('next');
  } else if (index === galleryImgs.length - 1) {
    img.classList.add('prev');
  }
}

// 辅助函数：节流函数，限制函数调用频率
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 辅助函数：预加载单个图片
function preloadImage(src) {
  const img = new Image();
  img.src = src;
}

// 初始化画廊
if (galleryImgs.length > 0) {
  setupGallery();
}

// 更新导航栏锚点跳转切换页面
const navLinks = document.querySelectorAll('.nav-link[data-page]');
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const pageIdx = parseInt(this.getAttribute('data-page'));
    if (!isNaN(pageIdx)) {
      // 强制停止所有正在进行的页面切换动画
      isScrolling = false;
      scrollAccumulator = 0;
      
      // 移除所有页面的过渡类，确保立即响应
      pages.forEach(page => {
        page.style.transition = 'none';
        setTimeout(() => {
          page.style.transition = '';
        }, 50);
      });
      
      // 显示目标页面
      showPage(pageIdx);
      
      // 更新URL hash，但不触发hashchange事件
      history.pushState(null, null, this.getAttribute('href'));
    }
  });
});

// 添加hashchange事件监听，处理浏览器前进后退
window.addEventListener('hashchange', function() {
  const hash = window.location.hash;
  let targetIdx = 0; // 默认显示主页
  
  if (hash === '#about') {
    targetIdx = 1;
  } else if (hash === '#gallery') {
    targetIdx = 2;
  }
  
  // 只有当目标页面与当前页面不同时才切换
  if (targetIdx !== currentPage) {
    showPage(targetIdx);
  }
});

// 初始根据URL hash显示对应页面
function initPageFromHash() {
  // 首先强制显示主页
  showPage(0);
  
  // 然后检查URL hash
  const hash = window.location.hash;
  let targetIdx = 0; // 默认显示主页
  
  if (hash === '#about') {
    targetIdx = 1;
  } else if (hash === '#gallery') {
    targetIdx = 2;
  }
  
  // 如果hash指向非主页，等待短暂延迟后再切换，确保主页先显示
  if (targetIdx !== 0) {
    setTimeout(() => {
      showPage(targetIdx);
      updateNavActiveState(targetIdx);
    }, 100);
  } else {
    // 如果是主页，直接更新导航状态
    updateNavActiveState(targetIdx);
  }
}

// 炫酷导航栏滚动阴影
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// 初始化页脚状态
function initFooter() {
  const footer = document.getElementById('footer');
  if (footer) {
    // 页脚初始样式
    footer.style.display = 'none';
    footer.style.position = 'absolute';
    footer.style.bottom = 'auto';
    footer.style.top = '100vh';
    footer.style.left = '0';
    footer.style.zIndex = '1';
  }
}

// 处理页脚显示
function handleFooterVisibility(pageIndex) {
  const footer = document.getElementById('footer');
  const pageCount = document.querySelectorAll('.page').length;
  
  if (footer) {
    if (pageIndex === pageCount - 1) {
      // 在最后一页显示页脚，但确保不影响布局
      footer.style.display = 'block';
      footer.style.position = 'absolute';
      footer.style.top = '100vh';
    } else {
      // 在其他页面隐藏页脚
      footer.style.display = 'none';
    }
  }
}

// 性能监控和自适应优化
let lowPerformanceMode = false;
let lastFrameTime = 0;
let frameCount = 0;
let slowFrames = 0;

// 检测性能并适应性调整
function monitorPerformance() {
  const now = performance.now();
  const frameDelta = now - lastFrameTime;
  
  // 如果帧时间超过33ms (低于30fps)，记录为慢帧
  if (lastFrameTime && frameDelta > 33) {
    slowFrames++;
  }
  
  frameCount++;
  lastFrameTime = now;
  
  // 每50帧评估一次性能
  if (frameCount >= 50) {
    // 如果超过20%的帧是慢帧，切换到低性能模式
    if (slowFrames / frameCount > 0.2 && !lowPerformanceMode) {
      lowPerformanceMode = true;
      simplifyEffects();
    }
    
    // 重置计数
    frameCount = 0;
    slowFrames = 0;
  }
  
  requestAnimationFrame(monitorPerformance);
}

// 简化视觉效果，提高性能
function simplifyEffects() {
  console.log("检测到性能不足，切换到低性能模式");
  
  // 添加低性能模式类
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    gallery.classList.add('low-performance');
  }
  
  // 移除不必要的动画效果
  const particles = document.getElementById('led-particles-canvas');
  if (particles) {
    particles.style.opacity = '0.3';
  }
  
  // 简化背景滤镜
  const galleryBg = document.querySelector('.gallery-bg');
  if (galleryBg) {
    galleryBg.style.filter = 'blur(10px) brightness(0.8)';
  }
  
  // 简化转场效果
  document.querySelectorAll('.gallery-img').forEach(img => {
    img.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    
    // 简化3D效果
    if (img.classList.contains('next')) {
      img.style.transform = 'translateX(40px)';
    } else if (img.classList.contains('prev')) {
      img.style.transform = 'translateX(-40px)';
    }
  });
}

// 可选：点击"下滑查看更多"平滑滚动到画廊
const scrollDownBtn = document.querySelector('.scroll-down');
if (scrollDownBtn) {
  scrollDownBtn.addEventListener('click', () => {
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
  });
}

// ===== 增强版粒子特效 =====
(function() {
  // 1. 获取Canvas元素
  const canvas = document.getElementById('led-particles-canvas');
  if (!canvas) {
    console.error('Canvas元素不存在!');
    return;
  }
  
  // 2. 设置Canvas
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // 3. 创建粒子类
  class Particle {
    constructor(x, y, isBackground = false) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 2.5 + 0.5;
      
      // 使用固定的蓝色范围
      const r = Math.floor(Math.random() * 50 + 100);
      const g = Math.floor(Math.random() * 50 + 130);
      const b = Math.floor(Math.random() * 30 + 220);
      
      this.color = `rgba(${r}, ${g}, ${b}, 0.75)`; // 增加不透明度从0.6到0.75
      this.speedX = Math.random() * 1.5 - 0.75;
      this.speedY = Math.random() * 1.5 - 0.75;
      this.isBackground = isBackground;
      
      // 背景粒子特性
      if (isBackground) {
        this.size = Math.random() * 1.8 + 0.3;
        this.color = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.4 + 0.3})`; // 增加不透明度范围从0.2-0.5到0.3-0.7
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
        this.life = Math.random() * 300 + 150;
        this.growing = true;
        this.growSpeed = Math.random() * 0.02 + 0.005;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        this.rotation = Math.random() * Math.PI * 2;
        this.shape = Math.random() > 0.85 ? 'star' : 'circle';
        this.points = Math.floor(Math.random() * 2) + 5;
      }
    }
    
    // 更新粒子位置
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.isBackground) {
        // 背景粒子渐入渐出逻辑
        if (this.growing) {
          if (this.size < 3) this.size += this.growSpeed;
          else this.growing = false;
        } else {
          this.life -= 1;
          if (this.life < 50) this.size -= this.growSpeed * 1.5;
        }
        
        // 轻微摆动和旋转效果
        this.x += Math.sin(this.life * 0.02) * 0.2;
        this.rotation += this.rotationSpeed;
        
        // 粒子互相排斥/吸引
        if (Math.random() > 0.95) {
          this.speedX += (Math.random() - 0.5) * 0.1;
          this.speedY += (Math.random() - 0.5) * 0.1;
        }
        
        // 限制速度
        this.speedX = Math.max(-0.8, Math.min(0.8, this.speedX));
        this.speedY = Math.max(-0.8, Math.min(0.8, this.speedY));
      } else {
        // 鼠标跟随粒子逐渐变小
        if (this.size > 0.2) this.size -= 0.05;
      }
      
      // 边界处理 - 反弹效果
      if (this.x < 0 || this.x > canvas.width) {
        this.speedX *= -1;
      }
      if (this.y < 0 || this.y > canvas.height) {
        this.speedY *= -1;
      }
    }
    
    // 绘制粒子
    draw() {
      ctx.fillStyle = this.color;
      ctx.shadowBlur = this.isBackground ? 15 : 20; // 增加发光效果
      ctx.shadowColor = this.color;
      
      if (this.isBackground && this.shape === 'star') {
        // 绘制星形
        this.drawStar();
      } else {
        // 绘制圆形
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 绘制星形
    drawStar() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      ctx.beginPath();
      for (let i = 0; i < this.points; i++) {
        const outerRadius = this.size;
        const innerRadius = this.size / 2;
        
        // 外角
        const outerX = Math.cos(Math.PI * 2 / this.points * i) * outerRadius;
        const outerY = Math.sin(Math.PI * 2 / this.points * i) * outerRadius;
        
        // 内角
        const innerX = Math.cos(Math.PI * 2 / this.points * i + Math.PI / this.points) * innerRadius;
        const innerY = Math.sin(Math.PI * 2 / this.points * i + Math.PI / this.points) * innerRadius;
        
        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        
        ctx.lineTo(innerX, innerY);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  
  // 4. 粒子数组
  let particlesArray = [];
  let backgroundParticles = [];
  let mouse = {
    x: undefined,
    y: undefined,
    radius: 80 // 增大鼠标影响范围
  };
  
  // 5. 鼠标移动监听
  window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
    // 每次移动添加3个粒子
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      particlesArray.push(new Particle(mouse.x + offsetX, mouse.y + offsetY));
    }
  });
  
  // 点击效果
  window.addEventListener('click', function(event) {
    // 点击时爆发粒子
    for (let i = 0; i < 12; i++) {
      const size = Math.random() * 5 + 3;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      const offsetX = Math.cos(angle) * (Math.random() * 10);
      const offsetY = Math.sin(angle) * (Math.random() * 10);
      
      const particle = new Particle(event.x + offsetX, event.y + offsetY);
      particle.speedX = Math.cos(angle) * speed * (Math.random() * 0.3 + 0.5);
      particle.speedY = Math.sin(angle) * speed * (Math.random() * 0.3 + 0.5);
      particle.size = size;
      particlesArray.push(particle);
    }
  });
  
  // 7. 初始粒子
  function init() {
    particlesArray = [];
    backgroundParticles = [];
    // 鼠标跟随粒子
    for (let i = 0; i < 15; i++) {
      let x = Math.random() * canvas.width;
      let y = Math.random() * canvas.height;
      particlesArray.push(new Particle(x, y));
    }
    // 背景粒子
    for (let i = 0; i < 40; i++) {
      addBackgroundParticle();
    }
  }
  
  // 添加背景粒子函数
  function addBackgroundParticle() {
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    backgroundParticles.push(new Particle(x, y, true));
  }
  
  // 背景粒子自动生成计时器
  setInterval(function() {
    // 每秒添加1-3个新背景粒子
    if (backgroundParticles.length < 60) {
      let count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        addBackgroundParticle();
      }
    }
  }, 1000);
  
  init();
  
  // 8. 动画循环 - 完全清除背景，防止颜色累积
  function animate() {
    // 完全清除Canvas，不使用半透明矩形
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新粒子
    updateParticles();
    
    // 更新和绘制背景粒子
    for (let i = 0; i < backgroundParticles.length; i++) {
      backgroundParticles[i].update();
      backgroundParticles[i].draw();
      
      // 移除过小或寿命结束的背景粒子
      if (backgroundParticles[i].size <= 0.1 || backgroundParticles[i].life <= 0) {
        backgroundParticles.splice(i, 1);
        i--;
      }
    }
    
    // 更新和绘制鼠标跟随粒子
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
      
      // 移除过小的粒子
      if (particlesArray[i].size <= 0.2) {
        particlesArray.splice(i, 1);
        i--;
      }
    }
    
    // 连接临近粒子，创建网状效果
    connectParticles();
    
    // 限制粒子数量
    if (particlesArray.length > 200) {
      for (let i = 0; i < 30; i++) {
        particlesArray.pop();
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // 更新粒子 - 使用固定颜色范围
  function updateParticles() {
    // 为背景粒子设置固定颜色范围
    backgroundParticles.forEach(particle => {
      // 只在创建粒子时设置一次颜色
      if (!particle.isCreated) {
        // 使用固定的蓝色调
        const r = Math.floor(Math.random() * 50 + 100);
        const g = Math.floor(Math.random() * 50 + 130);
        const b = Math.floor(Math.random() * 30 + 220);
        
        particle.color = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.4 + 0.3})`; // 增加不透明度范围
        particle.isCreated = true;
      }
      
      // 随机颜色变化，但仍在蓝色范围内
      if (Math.random() > 0.995) {
        const r = Math.floor(Math.random() * 50 + 100);
        const g = Math.floor(Math.random() * 50 + 130);
        const b = Math.floor(Math.random() * 30 + 220);
        
        particle.color = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.4 + 0.3})`; // 增加不透明度范围
      }
    });
  }
  
  // 连接临近粒子函数
  function connectParticles() {
    // 只对背景粒子应用连接效果，但减少连线
    for (let i = 0; i < backgroundParticles.length; i += 2) { // 隔一个粒子取一个
      for (let j = i + 2; j < backgroundParticles.length; j += 2) { // 减少连线数量
        const dx = backgroundParticles[i].x - backgroundParticles[j].x;
        const dy = backgroundParticles[i].y - backgroundParticles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 减少连线距离
        if (distance < 70) {
          // 降低不透明度
          const opacity = 1 - (distance / 70);
          
          // 使用固定的淡蓝色，增加亮度
          ctx.strokeStyle = `rgba(120, 160, 230, ${opacity * 0.2})`; // 增加不透明度从0.12到0.2
          ctx.lineWidth = 0.8; // 增加线宽从0.6到0.8
          ctx.beginPath();
          ctx.moveTo(backgroundParticles[i].x, backgroundParticles[i].y);
          ctx.lineTo(backgroundParticles[j].x, backgroundParticles[j].y);
          ctx.stroke();
        }
      }
    }
  }
  
  animate();
  
  // 9. 窗口调整大小
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // 页面滚动粒子效果
  window.addEventListener('wheel', function(event) {
    // 根据滚动方向生成粒子流，但降低数量
    const scrollDirection = event.deltaY > 0 ? 1 : -1;
    
    // 减少生成的粒子数量
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * canvas.width;
      const y = scrollDirection > 0 ? 0 : canvas.height;
      
      const particle = new Particle(x, y);
      particle.speedY = scrollDirection * (Math.random() * 2 + 1);
      particle.speedX = (Math.random() - 0.5) * 1;
      particle.size = Math.random() * 2 + 0.5;
      
      // 使用固定的蓝色范围
      const r = Math.floor(Math.random() * 50 + 100);
      const g = Math.floor(Math.random() * 50 + 130);
      const b = Math.floor(Math.random() * 30 + 220);
      particle.color = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.4 + 0.35})`; // 增加不透明度
      
      particlesArray.push(particle);
    }
  });

  // 监听屏幕触摸事件，支持移动设备，但减弱效果
  window.addEventListener('touchmove', function(event) {
    if (event.touches.length > 0) {
      mouse.x = event.touches[0].clientX;
      mouse.y = event.touches[0].clientY;
      
      // 移动时添加粒子，但减少数量
      if (Math.random() > 0.6) { // 只有40%的触摸移动会产生粒子
        const offsetX = (Math.random() - 0.5) * 5;
        const offsetY = (Math.random() - 0.5) * 5;
        particlesArray.push(new Particle(mouse.x + offsetX, mouse.y + offsetY));
      }
    }
  });

  // 触摸结束时的爆发效果，但减弱
  window.addEventListener('touchend', function(event) {
    // 触摸结束时爆发少量粒子
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const size = Math.random() * 3 + 1;
      
      const particle = new Particle(mouse.x, mouse.y);
      particle.speedX = Math.cos(angle) * speed;
      particle.speedY = Math.sin(angle) * speed;
      particle.size = size;
      
      particlesArray.push(particle);
    }
  });
})(); 

// 更新导航栏激活状态
function updateNavActiveState(pageIndex) {
  // 移除所有导航链接的激活状态
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // 添加当前页面对应导航链接的激活状态
  const activeLink = document.querySelector(`.nav-link[data-page="${pageIndex}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
} 