// Burning eclipse for the Inicio hero: one fragment shader, no libraries.
// - Static fallback (CSS ring) stays visible when WebGL is missing or fails.
// - prefers-reduced-motion: renders one still frame and stops.
// - Pauses when the tab is hidden or the hero is out of view.
// - Device pixel ratio capped at 1.5 to keep the fill cost bounded.
(function () {
  "use strict";
  var canvas = document.getElementById("fire");
  if (!canvas) return;
  var host = canvas.parentElement;
  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch (e) { gl = null; }
  if (!gl) { host.classList.add("fire--static"); return; }

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FRAG = [
    "precision mediump float;",
    "uniform vec2 r;uniform float t;uniform vec2 m;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    " return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}",
    "void main(){",
    " vec2 uv=(gl_FragCoord.xy-vec2(.5*r.x,0.))/r.y;",
    // The eclipse disc sits below the canvas; only its upper rim shows.
    " vec2 c=vec2(0.,-1.05);float R=1.38;",
    " vec2 d=uv-c;float dist=length(d);float ang=atan(d.y,d.x);",
    " float edge=dist-R;",
    // Flames: noise advected upward along the rim normal.
    " vec2 q=vec2(ang*6.,edge*7.-t*.9);",
    " float f=fbm(q+fbm(q*1.7+t*.25));",
    " float pm=1.-smoothstep(0.,.55,length(uv-m));",
    " float hgt=.05+.2*f*f+pm*.05;",
    " float flame=smoothstep(hgt,0.,edge)*smoothstep(.25,.7,f)*step(-.02,edge);",
    " float core=exp(-abs(edge)*38.);",
    " float glow=exp(-max(edge,0.)*9.)*.35;",
    " vec3 col=vec3(0.);",
    " col+=mix(vec3(.9,.18,.04),vec3(1.,.55,.15),f)*flame*1.2;",
    " col+=vec3(1.,.78,.5)*core*1.4;",
    " col+=vec3(.86,.16,.04)*glow*(.6+.4*f);",
    // Embers: sparse cells drifting up.
    " vec2 eg=uv*vec2(26.,14.)+vec2(0.,-t*1.2);vec2 ei=floor(eg);vec2 ef=fract(eg)-.5;",
    " float eh=h(ei);float ember=step(.965,eh)*smoothstep(.09,0.,length(ef+vec2(sin(t+eh*20.)*.2,0.)));",
    " col+=vec3(1.,.55,.2)*ember*smoothstep(1.,.1,edge)*step(0.,edge);",
    // Inside the disc stays coal black: that is the eclipse.
    " col*=smoothstep(-.015,.01,edge)+core*.6;",
    " float a=clamp(max(col.r,max(col.g,col.b)),0.,1.);",
    " gl_FragColor=vec4(col,a);",
    "}",
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch (e) { host.classList.add("fire--static"); return; }

  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(prog, "r");
  var uT = gl.getUniformLocation(prog, "t");
  var uM = gl.getUniformLocation(prog, "m");
  host.classList.add("fire--live");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mouse = [0, -2], target = [0, -2];
  var running = false, visible = true, raf = 0, t0 = performance.now(), frozen = 4.2;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }
  function draw(time) {
    size();
    mouse[0] += (target[0] - mouse[0]) * 0.06; mouse[1] += (target[1] - mouse[1]) * 0.06;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, time);
    gl.uniform2f(uM, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function loop(now) {
    if (!running) return;
    draw((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }
  function sync() {
    var should = visible && !document.hidden && !reduce.matches;
    if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); }
    if (reduce.matches) draw(frozen); // one still frame
  }

  host.addEventListener("pointermove", function (e) {
    var b = canvas.getBoundingClientRect();
    target[0] = (e.clientX - b.left - b.width / 2) / b.height;
    target[1] = (b.bottom - e.clientY) / b.height;
  });
  host.addEventListener("pointerleave", function () { target = [0, -2]; });
  new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(host);
  document.addEventListener("visibilitychange", sync);
  reduce.addEventListener("change", sync);
  window.addEventListener("resize", function () { if (!running) draw(frozen); });
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); running = false; host.classList.add("fire--static"); host.classList.remove("fire--live"); });
  sync();
})();
