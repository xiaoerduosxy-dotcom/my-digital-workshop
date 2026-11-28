'use client';

import { useEffect, useRef } from 'react';

const imageFit = 'h-full w-full select-none object-contain object-top lg:object-cover';

const vertexSource = `#version 300 es
out vec2 uv;

void main() {
  vec2 corner = vec2(gl_VertexID == 1 ? 2.0 : 0.0, gl_VertexID == 2 ? 2.0 : 0.0);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
  uv = vec2(corner.x, 1.0 - corner.y);
}`;

const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D portrait;
uniform vec2 look;
in vec2 uv;
out vec4 color;

float irisWeight(vec2 point, vec2 center, vec2 radius) {
  return 1.0 - smoothstep(0.3, 1.0, length((point - center) / radius));
}

void main() {
  // Lean from the waist so the shoulders, arms, and torso shift together.
  vec2 fromWaist = uv - vec2(0.51, 0.86);
  vec2 lean = vec2(-fromWaist.y * 1.515, fromWaist.x / 1.515) * look.x * 0.009;
  float bodyWeight = mix(1.0, 0.65, smoothstep(0.60, 0.95, uv.y));
  vec2 bodyMotion = (look * vec2(0.0085, 0.006) + lean) * bodyWeight;

  // Blend the extra head movement gradually into the upper chest.
  float headWeight = 1.0 - smoothstep(0.34, 0.63, uv.y);
  vec2 source = uv - bodyMotion - look * vec2(0.010, 0.006) * headWeight;

  // Nudge the pupils a little further than the face to suggest a glance.
  float eyes = irisWeight(source, vec2(0.447, 0.343), vec2(0.057, 0.043))
             + irisWeight(source, vec2(0.613, 0.353), vec2(0.049, 0.039));
  source -= look * vec2(0.007, 0.004) * eyes;
  color = texture(portrait, source);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

  gl.deleteShader(shader);
  return null;
}

function createRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, preserveDrawingBuffer: true });
  if (!gl) return null;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  const texture = gl.createTexture();

  const dispose = () => {
    gl.deleteProgram(program);
    gl.deleteTexture(texture);
  };

  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!program || !texture || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }

  gl.useProgram(program);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);

  const look = gl.getUniformLocation(program, 'look');
  return {
    draw(x: number, y: number) {
      gl.uniform2f(look, x, y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose,
  };
}

export default function TrackingPortrait() {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listeners = new AbortController();
    const { signal } = listeners;
    let renderer: ReturnType<typeof createRenderer> | undefined;
    let frame = 0;
    let x = 0;
    let y = 0;

    const showStatic = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      canvas.hidden = true;
      image.style.opacity = '';
    };

    const draw = () => {
      frame = 0;
      if (renderer === undefined) renderer = createRenderer(canvas, image);
      if (!renderer) return;

      renderer.draw(x, y);
      canvas.hidden = false;
      image.style.opacity = '0';
    };

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches || !image.naturalWidth || !image.complete) return;

      x = 2 * (event.clientX / window.innerWidth) - 1;
      y = 2 * (event.clientY / window.innerHeight) - 1;
      if (!frame) frame = window.requestAnimationFrame(draw);
    }, { passive: true, signal });

    reducedMotion.addEventListener('change', showStatic, { signal });
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      renderer = null;
      showStatic();
    }, { signal });
    canvas.addEventListener('webglcontextrestored', () => {
      renderer = undefined;
    }, { signal });

    return () => {
      listeners.abort();
      showStatic();
      renderer?.dispose();
    };
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} src="/profile.png" alt="Jerry" className={imageFit} />
      <canvas ref={canvasRef} width={792} height={1200} hidden aria-hidden="true" className={`pointer-events-none absolute inset-0 ${imageFit}`} />
    </>
  );
}
