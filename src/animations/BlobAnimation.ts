/**
 * WebGL Mesh Gradient Blob
 *
 * Creates a single blob with two colors (#397A76 Teal, #1B466F Deep Blue)
 * that morph through each other using simplex noise in a fragment shader.
 * Includes film grain overlay.
 */

// Parse hex color to RGB array (0-1 range)
function parseHexColor(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255];
}

// Default colors
const DEFAULT_COLOR_1: [number, number, number] = [0.224, 0.478, 0.463]; // #397A76 Teal
const DEFAULT_COLOR_2: [number, number, number] = [0.106, 0.275, 0.435]; // #1B466F Blue
const DEFAULT_COLOR_BG: [number, number, number] = [0.047, 0.047, 0.047]; // #0c0c0c

export const initBlobAnimation = () => {
  const container = document.querySelector('[data-blob-main]') as HTMLElement;
  if (!container) return;

  container.innerHTML = '';

  // Read custom colors from data attributes
  const color1Attr = container.getAttribute('data-color-1');
  const color2Attr = container.getAttribute('data-color-2');
  const color3Attr = container.getAttribute('data-color-3');
  const blurAttr = container.getAttribute('data-blur') || '1.2rem';

  const color1 = (color1Attr && parseHexColor(color1Attr)) || DEFAULT_COLOR_1;
  const color2 = (color2Attr && parseHexColor(color2Attr)) || DEFAULT_COLOR_2;
  const colorBg = (color3Attr && parseHexColor(color3Attr)) || DEFAULT_COLOR_BG;

  // Create main blob canvas (will be blurred)
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;filter:blur(${blurAttr});`;
  container.appendChild(canvas);

  // Create grain overlay canvas (NOT blurred)
  const grainCanvas = document.createElement('canvas');
  grainCanvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:overlay;';
  container.appendChild(grainCanvas);
  const grainCtx = grainCanvas.getContext('2d');

  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }

  // Vertex shader - simple fullscreen quad
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader - the magic happens here
  const fragmentShaderSource = `
    precision highp float;
    
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_colorBg;
    
    // Simplex noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                          -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    // Fractal Brownian Motion for richer noise
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }
    
    // Film grain
    float grain(vec2 uv, float t) {
      return fract(sin(dot(uv + t, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec2 uv = v_uv;
      float time = u_time * 0.25; // Animation speed
      
      // --- CENTER the blob in the canvas ---
      vec2 center = vec2(0.5, 0.5);
      vec2 fromCenter = uv - center;
      
      // Distance that works for rectangular canvas - use max of abs coords
      // This ensures we reach the edge on ALL sides (not just corners)
      float distX = abs(fromCenter.x) * 2.0; // 0 at center, 1 at left/right edge
      float distY = abs(fromCenter.y) * 2.0; // 0 at center, 1 at top/bottom edge
      float dist = max(distX, distY); // Use maximum - reaches 1.0 at any edge
      
      // --- ANIMATED NOISE for organic color morphing ---
      vec2 noiseCoord = uv * 6.0;
      float n1 = fbm(noiseCoord + vec2(time * 0.6, time * 0.4));
      float n2 = fbm(noiseCoord * 0.8 - vec2(time * 0.5, time * -0.3));
      float noise = (n1 + n2) * 0.5;
      
      // --- COLOR MIXING: two colors morphing together ---
      float colorMix = noise * 0.75 + 0.5;
      colorMix = smoothstep(0.3, 0.7, colorMix);
      vec3 gradientColor = mix(u_color1, u_color2, colorMix);
      
      // --- RADIAL FADE: MUST reach background before canvas edges ---
      float edgeNoise = snoise(uv * 4.0 + time * 0.2) * 0.5;
      
      // Fade from center to edges
      float innerRadius = 0.2 + edgeNoise; // Start fading at 20% from center
      float outerRadius = 0.9; // Complete fade at 90% (before edge)
      
      float fade = smoothstep(innerRadius, outerRadius, dist);
      
      // Apply fade: gradient -> background
      vec3 finalColor = mix(gradientColor, u_colorBg, fade);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // Compile shaders
  function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return;

  // Create program
  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return;
  }

  // Set up geometry (fullscreen quad)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  // Get locations
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const color1Location = gl.getUniformLocation(program, 'u_color1');
  const color2Location = gl.getUniformLocation(program, 'u_color2');
  const colorBgLocation = gl.getUniformLocation(program, 'u_colorBg');

  // Resize handler
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    // Resize grain canvas too
    if (grainCanvas.width !== displayWidth || grainCanvas.height !== displayHeight) {
      grainCanvas.width = displayWidth;
      grainCanvas.height = displayHeight;
    }
  }

  // Animation loop
  let animationId: number;
  const startTime = performance.now();
  let lastGrainFrame = 0;
  const grainFps = 12; // Lower FPS for grain (still looks good)
  const grainAmount = 0.08;
  const grainScale = 4; // Render grain at 1/4 resolution for performance

  // Pre-allocate grain buffer at smaller size
  let grainImageData: ImageData | null = null;

  function render() {
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(program);

    // Set uniforms
    const currentTime = (performance.now() - startTime) / 1000;
    gl.uniform1f(timeLocation, currentTime);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform3f(color1Location, color1[0], color1[1], color1[2]);
    gl.uniform3f(color2Location, color2[0], color2[1], color2[2]);
    gl.uniform3f(colorBgLocation, colorBg[0], colorBg[1], colorBg[2]);

    // Set up position attribute
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw blob
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Render grain overlay at lower resolution & FPS for performance
    const now = performance.now();
    if (grainCtx && now - lastGrainFrame > 1000 / grainFps) {
      lastGrainFrame = now;
      const gw = Math.ceil(grainCanvas.width / grainScale);
      const gh = Math.ceil(grainCanvas.height / grainScale);

      // Recreate buffer if size changed
      if (!grainImageData || grainImageData.width !== gw || grainImageData.height !== gh) {
        grainImageData = grainCtx.createImageData(gw, gh);
      }

      const { data } = grainImageData;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 255 * grainAmount;
        data[i] = 128 + noise;
        data[i + 1] = 128 + noise;
        data[i + 2] = 128 + noise;
        data[i + 3] = 255;
      }

      // Clear and draw scaled
      grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
      grainCtx.imageSmoothingEnabled = false; // Crispy pixels
      grainCtx.putImageData(grainImageData, 0, 0);
      grainCtx.drawImage(grainCanvas, 0, 0, gw, gh, 0, 0, grainCanvas.width, grainCanvas.height);
    }

    animationId = requestAnimationFrame(render);
  }
  render();

  // Cleanup on hot reload
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node === canvas || (node instanceof Element && node.contains(canvas))) {
          cancelAnimationFrame(animationId);
          observer.disconnect();
        }
      }
    }
  });
  observer.observe(container.parentElement || document.body, { childList: true, subtree: true });
};
