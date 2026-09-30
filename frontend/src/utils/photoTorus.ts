// Draws a smooth, spinning torus wrapped in photos with WebGL (no libraries).
// Each photo covers one sector of the ring on the outside of the tube; the
// inside of the hole shows a darker mirror image so there is no visible seam.

export interface TorusPhoto {
  url: string;
  alt: string;
}

const RING_RADIUS = 1;
const TUBE_RADIUS = 0.415;
const RING_SEGMENTS = 160; // enough that the silhouette looks perfectly round
const TUBE_SEGMENTS = 72;
const TILT = (24 * Math.PI) / 180; // top tipped toward the viewer so it reads as a donut
const FOV = (30 * Math.PI) / 180;
const MAX_WIDTH_PX = 740; // on-screen width of the torus on large screens
// All photos share one texture, one sector per photo (power of two so it can be mipmapped).
const ATLAS_WIDTH = 4096;
const ATLAS_HEIGHT = 512;
// Wide photos are cropped to at most this aspect and stretched the rest of the
// way, so group shots keep the people at the edges.
const MAX_PHOTO_ASPECT = 1.15;
const PLACEHOLDER = "#27272a";

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform mat4 uProjection;
uniform mat4 uModelView;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vNormal = (uModelView * vec4(aNormal, 0.0)).xyz;
  vUv = aUv;
  gl_Position = uProjection * uModelView * vec4(aPosition, 1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uPhotos;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  float s = vUv.y; // 0..1 around the tube, starting on top and going outward
  // Photo top-to-bottom over the outside, mirrored back up through the hole.
  vec3 photo = texture2D(uPhotos, vec2(vUv.x, 1.0 - abs(1.0 - 2.0 * s))).rgb;
  float outside = smoothstep(-0.35, 0.35, sin(6.2831853 * s));
  float light = 0.55 + 0.5 * max(dot(normalize(vNormal), normalize(vec3(-0.35, 0.75, 0.9))), 0.0);
  gl_FragColor = vec4(photo * light * mix(0.45, 1.0, outside), 1.0);
}`;

function buildMesh() {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (let j = 0; j <= TUBE_SEGMENTS; j++) {
    const s = j / TUBE_SEGMENTS;
    const tubeAngle = Math.PI / 2 - s * 2 * Math.PI;
    const c = Math.cos(tubeAngle);
    const y = Math.sin(tubeAngle);
    for (let i = 0; i <= RING_SEGMENTS; i++) {
      const u = i / RING_SEGMENTS;
      const dx = Math.sin(u * 2 * Math.PI);
      const dz = Math.cos(u * 2 * Math.PI);
      const r = RING_RADIUS + TUBE_RADIUS * c;
      positions.push(dx * r, TUBE_RADIUS * y, dz * r);
      normals.push(dx * c, y, dz * c);
      uvs.push(u, s);
    }
  }
  const indices: number[] = [];
  const row = RING_SEGMENTS + 1;
  for (let j = 0; j < TUBE_SEGMENTS; j++) {
    for (let i = 0; i < RING_SEGMENTS; i++) {
      const a = j * row + i;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, normals, uvs, indices };
}

// Column-major 4x4 matrices, as WebGL expects.
function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function modelView(distance: number, spin: number) {
  const cx = Math.cos(TILT), sx = Math.sin(TILT);
  const cy = Math.cos(spin), sy = Math.sin(spin);
  const tiltAndMove = new Float32Array([1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, -distance, 1]);
  const spinY = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
  return multiply(tiltAndMove, spinY);
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader error");
  return shader;
}

/** Draw one photo into its sector of the shared texture. */
function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, index: number, count: number) {
  const x0 = Math.round((index * ATLAS_WIDTH) / count);
  const x1 = Math.round(((index + 1) * ATLAS_WIDTH) / count);
  const aspect = img.naturalWidth / img.naturalHeight;
  const target = Math.min(Math.max(aspect, 1 / MAX_PHOTO_ASPECT), MAX_PHOTO_ASPECT);
  let sw = img.naturalWidth, sh = img.naturalHeight;
  if (aspect > target) sw = sh * target;
  else sh = sw / target;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x0, 0, x1 - x0, ATLAS_HEIGHT);
}

/**
 * Start the torus on `canvas`. Returns a cleanup function, or null when WebGL
 * isn't available (the caller shows a fallback).
 */
export function mountPhotoTorus(canvas: HTMLCanvasElement, photos: TorusPhoto[], secondsPerTurn: number): (() => void) | null {
  const gl = canvas.getContext("webgl", { antialias: true });
  if (!gl) return null;

  const atlas = document.createElement("canvas");
  atlas.width = ATLAS_WIDTH;
  atlas.height = ATLAS_HEIGHT;
  const atlasCtx = atlas.getContext("2d")!;
  atlasCtx.fillStyle = PLACEHOLDER;
  atlasCtx.fillRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);

  const mesh = buildMesh();
  let program: WebGLProgram | null = null;
  let texture: WebGLTexture | null = null;
  let buffers: WebGLBuffer[] = [];
  let uProjection: WebGLUniformLocation | null = null;
  let uModelView: WebGLUniformLocation | null = null;

  const uploadAtlas = () => {
    if (!texture) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const setup = () => {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
    gl.useProgram(program);

    const attribute = (name: string, data: number[], size: number) => {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program!, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buffer;
    };
    const indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    buffers = [
      attribute("aPosition", mesh.positions, 3),
      attribute("aNormal", mesh.normals, 3),
      attribute("aUv", mesh.uvs, 2),
      indexBuffer,
    ];
    uProjection = gl.getUniformLocation(program, "uProjection");
    uModelView = gl.getUniformLocation(program, "uModelView");

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Keeps the photos sharp where the surface curves away (top of the ring).
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) {
      const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }
    uploadAtlas();
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  };
  try {
    setup();
  } catch (err) {
    console.error("Photo torus unavailable:", err);
    return null;
  }

  let spin = 0;
  const draw = () => {
    if (!program || gl.isContextLost()) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Back the camera off until the torus is the desired width on screen.
    const targetWidth = Math.min(w * 0.92, MAX_WIDTH_PX);
    const distance = (2 * (RING_RADIUS + TUBE_RADIUS) * h) / (targetWidth * 2 * Math.tan(FOV / 2));
    gl.uniformMatrix4fv(uProjection, false, perspective(FOV, w / h, 0.1, distance + 5));
    gl.uniformMatrix4fv(uModelView, false, modelView(distance, spin));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  };

  // Spin only while on screen, not hovered, and the visitor hasn't asked for reduced motion.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let onScreen = true, hovering = false, raf = 0, lastTime = 0;
  const frame = (time: number) => {
    raf = 0;
    if (lastTime) spin -= ((time - lastTime) / 1000) * ((2 * Math.PI) / secondsPerTurn);
    lastTime = time;
    draw();
    schedule();
  };
  const schedule = () => {
    if (raf || reducedMotion || !onScreen || hovering || !program) return;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
  };

  let disposed = false;
  photos.forEach((photo, index) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (disposed) return;
      drawPhoto(atlasCtx, img, index, photos.length);
      uploadAtlas();
      draw();
    };
    img.src = photo.url;
  });

  const onEnter = () => { hovering = true; stop(); };
  const onLeave = () => { hovering = false; schedule(); };
  const onLost = (e: Event) => { e.preventDefault(); stop(); program = null; };
  const onRestored = () => {
    try {
      setup();
    } catch (err) {
      console.error("Photo torus could not restart:", err);
      return;
    }
    draw();
    schedule();
  };
  canvas.addEventListener("mouseenter", onEnter);
  canvas.addEventListener("mouseleave", onLeave);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) schedule();
    else stop();
  });
  visibility.observe(canvas);
  const resize = new ResizeObserver(() => draw());
  resize.observe(canvas);

  draw();
  schedule();

  return () => {
    disposed = true;
    stop();
    visibility.disconnect();
    resize.disconnect();
    canvas.removeEventListener("mouseenter", onEnter);
    canvas.removeEventListener("mouseleave", onLeave);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    buffers.forEach((b) => gl.deleteBuffer(b));
    if (texture) gl.deleteTexture(texture);
    if (program) gl.deleteProgram(program);
    program = null;
  };
}
