// Shared ripple effect utility
export const addRipple = (e) => {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const d = Math.max(btn.clientWidth, btn.clientHeight);
  const rect = btn.getBoundingClientRect();
  circle.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,0.3);transform:scale(0);animation:rippleEffect 0.6s linear;`;
  circle.className = 'ripple-effect';
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.querySelector('.ripple-effect')?.remove();
  btn.appendChild(circle);
};
