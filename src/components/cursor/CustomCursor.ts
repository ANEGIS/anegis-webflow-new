// Assuming GSAP not imported, need declaration
interface GSAP {
  set(target: string | Element | NodeList | Element[], vars: Record<string, unknown>): void;

  ticker: {
    add(callback: () => void): void;
  };
}

declare const gsap: GSAP;

export function initCustomCursor() {
  // Only run on desktop with hover capability
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isDesktop) return;

  const targets = document.querySelectorAll('[data-cursor]');
  const cursorEl = document.getElementById('cursor-hijack');
  const trailSvg = document.getElementById('cursor-trail-canvas');
  const trailPath = document.getElementById('cursor-trail-path');
  const gradient = document.getElementById('trailGradient');

  if (!cursorEl || !trailSvg || !trailPath || !targets.length) return;
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not found');
    return;
  }

  // ===== CONFIGURATION =====
  const CONFIG = {
    // Cursor tip position within the 32x28 SVG box (the pointy left tip)
    tipOffset: { x: 0, y: 14 },

    // Trail offset from cursor tip (moves trail attachment behind the arrow)
    trailOffset: 32, // Distance behind the cursor tip where trail starts

    // Smoothing for cursor position (0-1, higher = snappier)
    positionLerp: 0.25,

    // Trail settings
    maxPoints: 50, // Number of points in the trail
    minDistance: 4, // Minimum distance to add a new point
    trailDecay: 0.92, // How fast old points catch up (creates curve)

    // Rotation
    rotationLerp: 0.15, // Smoothness of rotation
    idleSpeedThreshold: 0.5, // Below this, don't update rotation
  };

  // ===== STATE =====
  let active = false;
  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };
  let trail: { x: number; y: number }[] = [];
  let targetAngle = 0;
  let currentAngle = 0;

  // ===== SETUP =====
  function syncViewBox() {
    if (trailSvg)
      trailSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  }
  syncViewBox();
  window.addEventListener('resize', syncViewBox);

  // Track mouse position
  window.addEventListener(
    'mousemove',
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  // ===== ACTIVATION =====
  function enter() {
    active = true;
    document.body.classList.add('cursor-active');

    // Initialize positions
    cursor.x = mouse.x;
    cursor.y = mouse.y;

    // Initialize trail with current position
    trail = [];
    for (let i = 0; i < CONFIG.maxPoints; i++) {
      trail.push({ x: mouse.x, y: mouse.y });
    }

    // Set initial angle based on cursor position
    currentAngle = 0;
    targetAngle = 0;
  }

  function leave() {
    active = false;
    document.body.classList.remove('cursor-active');
  }

  targets.forEach((el) => {
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
  });

  // Hide cursor when hovering over .button-wrapper
  document.querySelectorAll('.button-wrapper').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hidden');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hidden');
    });
  });

  // ===== ANIMATION LOOP =====
  gsap.ticker.add(() => {
    if (!active) return;

    // Smooth cursor position
    cursor.x += (mouse.x - cursor.x) * CONFIG.positionLerp;
    cursor.y += (mouse.y - cursor.y) * CONFIG.positionLerp;

    // Calculate cursor rotation from movement direction
    const dx = cursor.x - trail[1].x;
    const dy = cursor.y - trail[1].y;
    const speed = Math.hypot(dx, dy);

    if (speed > CONFIG.idleSpeedThreshold) {
      targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }

    // Smooth angle transition (handle 360° wrap)
    let angleDiff = targetAngle - currentAngle;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    currentAngle += angleDiff * CONFIG.rotationLerp;

    // Calculate trail start position (behind the cursor, based on rotation)
    const angleRad = (currentAngle * Math.PI) / 180;
    const trailStartX = cursor.x - Math.cos(angleRad) * CONFIG.trailOffset;
    const trailStartY = cursor.y - Math.sin(angleRad) * CONFIG.trailOffset;

    // Update trail - each point chases the one in front of it
    // This creates the natural curved "snake" effect
    trail[0].x = trailStartX;
    trail[0].y = trailStartY;

    for (let i = 1; i < trail.length; i++) {
      trail[i].x += (trail[i - 1].x - trail[i].x) * (1 - CONFIG.trailDecay);
      trail[i].y += (trail[i - 1].y - trail[i].y) * (1 - CONFIG.trailDecay);
    }

    // Draw the trail path
    const pathData = generateCatmullRomPath(trail);
    if (trailPath) trailPath.setAttribute('d', pathData);

    // Update gradient to follow the path
    updateGradient();

    // Position cursor
    gsap.set(cursorEl, {
      x: cursor.x - CONFIG.tipOffset.x,
      y: cursor.y - CONFIG.tipOffset.y,
      rotation: currentAngle + 180, // Arrow points opposite to movement
      transformOrigin: `${CONFIG.tipOffset.x}px ${CONFIG.tipOffset.y}px`,
    });
  });

  // ===== GRADIENT UPDATE =====
  function updateGradient() {
    if (!gradient || trail.length < 2) return;

    // Gradient goes from tail (faded) to head (solid)
    const tail = trail[trail.length - 1];
    const head = trail[0];

    gradient.setAttribute('x1', String(tail.x));
    gradient.setAttribute('y1', String(tail.y));
    gradient.setAttribute('x2', String(head.x));
    gradient.setAttribute('y2', String(head.y));
  }

  // ===== PATH GENERATION =====
  // Catmull-Rom spline for smooth curves through all points
  function generateCatmullRomPath(points: { x: number; y: number }[], tension: number = 0.5) {
    if (points.length < 2) return '';

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      // Calculate control points
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return path;
  }
}
