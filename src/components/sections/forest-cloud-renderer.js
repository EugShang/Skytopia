// GPU point sprites keep the dense procedural forest inexpensive to draw.
export function createForestCloudRenderer(points) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return null;
  const compile = (type, source) => {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, `
    attribute vec3 position; attribute vec3 color; attribute float size; attribute float opacity; attribute float variation;
    uniform vec3 eye; uniform vec3 forward; uniform vec3 right; uniform vec3 up;
    uniform vec2 resolution; uniform float focal; uniform float ratio; uniform float intensity;
    varying vec3 vColor; varying float vAlpha; varying float vVariation;
    void main() {
      vec3 delta = position - eye; float depth = dot(delta, forward);
      float safeDepth = max(depth, 0.1);
      vec2 projected = vec2(dot(delta, right), dot(delta, up)) * focal / safeDepth;
      gl_Position = vec4(projected.x * 2.0 / resolution.x, projected.y * 2.0 / resolution.y + 0.08, 0.0, 1.0);
      float proximity = smoothstep(0.7, 2.5, depth);
      float fog = exp(-max(depth - 5.0, 0.0) * 0.033);
      vAlpha = min(1.0, opacity * 1.22) * proximity * fog * intensity;
      if (depth < 0.7 || depth > 65.0) { gl_Position = vec4(3.0, 3.0, 0.0, 1.0); vAlpha = 0.0; }
      gl_PointSize = max(1.0, size * ratio * clamp(17.0 / safeDepth, 0.55, 3.4));
      vColor = mix(vec3(0.23, 0.38, 0.53), color, clamp(fog + 0.25, 0.0, 1.0));
      vVariation = variation;
    }
  `);
  const fragment = compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 vColor; varying float vAlpha; varying float vVariation;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float angle = vVariation * 6.28318;
      p = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p;
      p.x *= 1.0 + vVariation * 0.7;
      float radius = dot(p, p); if (radius > 1.0) discard;
      float softEdge = exp(-radius * 1.9) * (1.0 - smoothstep(0.72, 1.0, radius));
      gl_FragColor = vec4(vColor, vAlpha * softEdge);
    }
  `);
  if (!vertex || !fragment) { if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); return null; }
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteShader(vertex); gl.deleteShader(fragment); gl.deleteProgram(program); return null; }
  gl.useProgram(program);
  const data = new Float32Array(points.length * 9);
  points.forEach((p, i) => data.set([...p.p, ...p.rgb, p.size, p.alpha, p.variation], i * 9));
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  for (const [name, count, offset] of [['position', 3, 0], ['color', 3, 3], ['size', 1, 6], ['opacity', 1, 7], ['variation', 1, 8]]) {
    const location = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, count, gl.FLOAT, false, 36, offset * 4);
  }
  const uniforms = Object.fromEntries(['eye', 'forward', 'right', 'up', 'resolution', 'focal', 'ratio', 'intensity'].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
  let lost = false;
  const onLost = event => { event.preventDefault(); lost = true; };
  canvas.addEventListener('webglcontextlost', onLost);
  return {
    draw(g, w, h, eye, target, focal, intensity, ratio = 1) {
      if (lost || gl.isContextLost()) return false;
      const norm = v => { const length = Math.hypot(...v); return v.map(n => n / length); };
      const f = norm(target.map((v, i) => v - eye[i])), r = norm([f[2], 0, -f[0]]);
      const u = [f[1] * r[2], f[2] * r[0] - f[0] * r[2], -f[1] * r[0]];
      const rw = Math.max(1, Math.round(w * ratio)), rh = Math.max(1, Math.round(h * ratio));
      if (canvas.width < rw || canvas.height < rh) { canvas.width = Math.max(canvas.width, rw); canvas.height = Math.max(canvas.height, rh); }
      gl.viewport(0, 0, rw, rh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3fv(uniforms.eye, eye); gl.uniform3fv(uniforms.forward, f); gl.uniform3fv(uniforms.right, r); gl.uniform3fv(uniforms.up, u);
      gl.uniform2f(uniforms.resolution, w, h); gl.uniform1f(uniforms.focal, focal); gl.uniform1f(uniforms.ratio, ratio); gl.uniform1f(uniforms.intensity, intensity);
      gl.drawArrays(gl.POINTS, 0, points.length); g.drawImage(canvas, 0, canvas.height - rh, rw, rh, 0, 0, w, h); return true;
    },
    destroy() { canvas.removeEventListener('webglcontextlost', onLost); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
