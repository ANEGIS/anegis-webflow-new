interface GSAP {
  set(target: Element, vars: Record<string, unknown>): void;
  to(target: Element, vars: Record<string, unknown>): void;
  ticker: {
    add(callback: () => void): void;
  };
}

declare const gsap: GSAP;

// ===== DOM INJECTION =====
function createCursorElements(): {
  cursorEl: HTMLElement;
  trailSvg: SVGSVGElement;
  trailPath: SVGPathElement;
  gradient: SVGLinearGradientElement;
} {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #cursor-trail-canvas {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
      overflow: visible;
    }
    #cursor-hijack {
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      will-change: transform, opacity;
    }
    .cursor-active #cursor-hijack,
    .cursor-active #cursor-trail-canvas {
      opacity: 1;
    }
    body:not(.cursor-active) #cursor-trail-canvas {
      opacity: 0;
    }
    .cursor-paused #cursor-hijack,
    .cursor-paused #cursor-trail-canvas {
      opacity: 0 !important;
    }
    .cursor-paused {
      cursor: pointer !important;
    }
    .cursor-paused * {
      cursor: pointer !important;
    }
  `;
  document.head.appendChild(style);

  // Trail SVG
  const ns = 'http://www.w3.org/2000/svg';
  const trailSvg = document.createElementNS(ns, 'svg') as SVGSVGElement;
  trailSvg.id = 'cursor-trail-canvas';
  trailSvg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS(ns, 'defs');
  const gradient = document.createElementNS(ns, 'linearGradient') as SVGLinearGradientElement;
  gradient.id = 'trailGradient';
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse');

  const stops: [string, string, string][] = [
    ['0%', '#b8c8dc', '0.0'],
    ['50%', '#7a9ac4', '0.25'],
    ['100%', '#11397B', '0.55'],
  ];
  stops.forEach(([offset, color, opacity]) => {
    const stop = document.createElementNS(ns, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    stop.setAttribute('stop-opacity', opacity);
    gradient.appendChild(stop);
  });
  defs.appendChild(gradient);
  trailSvg.appendChild(defs);

  const trailPath = document.createElementNS(ns, 'path') as SVGPathElement;
  trailPath.id = 'cursor-trail-path';
  trailPath.setAttribute('d', '');
  trailPath.setAttribute('fill', 'none');
  trailPath.setAttribute('stroke', 'url(#trailGradient)');
  trailPath.setAttribute('stroke-width', '2');
  trailPath.setAttribute('stroke-linecap', 'round');
  trailPath.setAttribute('stroke-linejoin', 'round');
  trailPath.setAttribute('stroke-dasharray', '10 9');
  trailSvg.appendChild(trailPath);

  // Cursor arrow
  const cursorEl = document.createElement('div');
  cursorEl.id = 'cursor-hijack';
  cursorEl.setAttribute('aria-hidden', 'true');
  cursorEl.innerHTML = `
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 14L32 0L26 14L32 28L0 14Z" fill="url(#cursor_gradient)" />
      <defs>
        <linearGradient id="cursor_gradient" x1="32" y1="14" x2="0" y2="14" gradientUnits="userSpaceOnUse">
          <stop stop-color="#4AAAAB" />
          <stop offset="1" stop-color="#11397B" />
        </linearGradient>
      </defs>
    </svg>
  `;

  document.body.appendChild(trailSvg);
  document.body.appendChild(cursorEl);

  return { cursorEl, trailSvg, trailPath, gradient };
}

export function initCustomCursor() {
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isDesktop) return;

  const targets = document.querySelectorAll('[data-cursor]');
  if (!targets.length) return;

  if (typeof gsap === 'undefined') {
    console.warn('GSAP not found');
    return;
  }

  const { cursorEl, trailSvg, trailPath, gradient } = createCursorElements();

  // ===== CONFIG =====
  const CONFIG = {
    tipOffset: { x: 0, y: 14 },
    trailOffset: 28,
    positionLerp: 0.22,
    maxPoints: 20,
    trailDecay: 0.70,
    rotationLerp: 0.12,
    idleSpeedThreshold: 0.4,
  };

  // ===== STATE =====
  let active = false;
  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };
  let trail: { x: number; y: number }[] = [];
  let targetAngle = 0;
  let currentAngle = 0;

  // ===== VIEWBOX =====
  function syncViewBox() {
    trailSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  }
  syncViewBox();
  window.addEventListener('resize', syncViewBox);

  // ===== MOUSE TRACKING =====
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  // ===== ACTIVATION =====
  function enter() {
    cursor.x = mouse.x;
    cursor.y = mouse.y;
    trail = Array.from({ length: CONFIG.maxPoints }, () => ({ x: mouse.x, y: mouse.y }));
    currentAngle = 0;
    targetAngle = 0;

    active = true;
    document.body.classList.add('cursor-active');
    gsap.to(cursorEl, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.to(trailSvg, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  }

  function leave() {
    active = false;
    document.body.classList.remove('cursor-active');
    gsap.to(cursorEl, { opacity: 0, duration: 0.25, ease: 'power2.in' });
    gsap.to(trailSvg, { opacity: 0, duration: 0.35, ease: 'power2.in' });
  }

  targets.forEach((el) => {
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
  });

  document.querySelectorAll('.button-group').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      active = false;
      document.body.classList.add('cursor-paused');
    });
    el.addEventListener('mouseleave', () => {
      active = true;
      document.body.classList.remove('cursor-paused');
    });
  });

  // ===== ANIMATION LOOP =====
  gsap.ticker.add(() => {
    if (!active) return;

    cursor.x += (mouse.x - cursor.x) * CONFIG.positionLerp;
    cursor.y += (mouse.y - cursor.y) * CONFIG.positionLerp;

    const dx = cursor.x - trail[1].x;
    const dy = cursor.y - trail[1].y;
    const speed = Math.hypot(dx, dy);

    if (speed > CONFIG.idleSpeedThreshold) {
      targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }

    let angleDiff = targetAngle - currentAngle;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    currentAngle += angleDiff * CONFIG.rotationLerp;

    const angleRad = (currentAngle * Math.PI) / 180;
    trail[0].x = cursor.x - Math.cos(angleRad) * CONFIG.trailOffset;
    trail[0].y = cursor.y - Math.sin(angleRad) * CONFIG.trailOffset;

    for (let i = 1; i < trail.length; i++) {
      trail[i].x += (trail[i - 1].x - trail[i].x) * (1 - CONFIG.trailDecay);
      trail[i].y += (trail[i - 1].y - trail[i].y) * (1 - CONFIG.trailDecay);
    }

    trailPath.setAttribute('d', buildCatmullRom(trail));
    updateGradient();

    gsap.set(cursorEl, {
      x: cursor.x - CONFIG.tipOffset.x,
      y: cursor.y - CONFIG.tipOffset.y,
      rotation: currentAngle + 180,
      transformOrigin: `${CONFIG.tipOffset.x}px ${CONFIG.tipOffset.y}px`,
    });
  });

  // ===== GRADIENT =====
  function updateGradient() {
    if (trail.length < 2) return;
    const tail = trail[trail.length - 1];
    const head = trail[0];
    gradient.setAttribute('x1', String(tail.x));
    gradient.setAttribute('y1', String(tail.y));
    gradient.setAttribute('x2', String(head.x));
    gradient.setAttribute('y2', String(head.y));
  }

  // ===== CATMULL-ROM PATH =====
  function buildCatmullRom(points: { x: number; y: number }[], tension = 0.5): string {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }
}
