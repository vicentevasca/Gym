<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  colorBack:  { type: String, default: '#000000' },
  colorFront: { type: String, default: '#ffffff' },
  shape:      { type: String, default: 'simplex' },
  type:       { type: String, default: '8x8' },
  pxSize:     { type: Number, default: 4 },
  speed:      { type: Number, default: 1 },
})

// ── GLSL helpers ──────────────────────────────────────────────

const simplexNoise = `
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`

const VERTEX_SRC = `#version 300 es
precision mediump float;
layout(location=0) in vec4 a_position;
void main(){ gl_Position = a_position; }
`

const FRAGMENT_SRC = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec4  u_colorBack;
uniform vec4  u_colorFront;
uniform float u_shape;
uniform float u_type;
uniform float u_pxSize;

out vec4 fragColor;

#define TWO_PI 6.28318530718

${simplexNoise}

float hash11(float p){ p=fract(p*0.3183099)+0.1; p*=p+19.19; return fract(p*p); }
float hash21(vec2 p){ p=fract(p*vec2(0.3183099,0.3678794))+0.1; p+=dot(p,p+19.19); return fract(p.x*p.y); }

float getNoise(vec2 uv, float t){
  float n = .5*snoise(uv - vec2(0.,.3*t));
  n += .5*snoise(2.*uv + vec2(0.,.32*t));
  return n;
}

const int bayer8x8[64] = int[64](
   0,32, 8,40, 2,34,10,42,
  48,16,56,24,50,18,58,26,
  12,44, 4,36,14,46, 6,38,
  60,28,52,20,62,30,54,22,
   3,35,11,43, 1,33, 9,41,
  51,19,59,27,49,17,57,25,
  15,47, 7,39,13,45, 5,37,
  63,31,55,23,61,29,53,21
);
const int bayer4x4[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
const int bayer2x2[4]  = int[4](0,2,3,1);

float getBayer(vec2 uv, int sz){
  ivec2 pos   = ivec2(mod(uv, float(sz)));
  int   index = pos.y*sz + pos.x;
  if(sz==2) return float(bayer2x2[index])/4.0;
  if(sz==4) return float(bayer4x4[index])/16.0;
  return      float(bayer8x8[index])/64.0;
}

void main(){
  float t   = .5*u_time;
  vec2  res = u_resolution;

  // Pixelization
  vec2 pxUv = gl_FragCoord.xy;
  pxUv -= .5*res;
  pxUv /= u_pxSize;
  vec2 pxFloor = floor(pxUv);
  vec2 pixelized = (pxFloor*u_pxSize)/res;
  pixelized += .5; pixelized -= .5;

  vec2 suv = pixelized;
  vec2 duv = pxUv;
  float shape = 0.;

  int s = int(floor(u_shape));
  if(s==1){
    suv *= .001;
    shape = smoothstep(0.3,0.9,.5+.5*getNoise(suv,t));
  } else if(s==2){
    suv*=.003;
    for(float i=1.;i<6.;i++){
      suv.x+=0.6/i*cos(i*2.5*suv.y+t);
      suv.y+=0.6/i*cos(i*1.5*suv.x+t);
    }
    shape=smoothstep(0.02,1.,.15/abs(sin(t-suv.y-suv.x)));
  } else if(s==3){
    suv*=.05;
    float r=hash11(floor(2.*suv.x/TWO_PI)*10.);
    r=sign(r-.5)*pow(.1+abs(r),.4);
    shape=pow(abs(sin(suv.x)*cos(suv.y-5.*r*t)),6.);
  } else if(s==4){
    // Wave
    suv*=4.;
    float wave=cos(.5*suv.x-2.*t)*sin(1.5*suv.x+t)*(.75+.25*cos(3.*t));
    shape=1.-smoothstep(-1.,1.,suv.y+wave);
  } else if(s==5){
    float dist=length(suv);
    shape=sin(pow(dist,1.7)*7.-3.*t)*.5+.5;
  } else if(s==6){
    float l=length(suv);
    float angle=6.*atan(suv.y,suv.x)+4.*t;
    float twist=1.2;
    float offset=pow(l,-twist)+angle/TWO_PI;
    shape=mix(0.,fract(offset),smoothstep(0.,1.,pow(l,twist)));
  } else {
    suv*=2.;
    float d=1.-pow(length(suv),2.);
    vec3 pos=vec3(suv,sqrt(d));
    vec3 lp=normalize(vec3(cos(1.5*t),.8,sin(1.25*t)));
    shape=(.5+.5*dot(lp,pos))*step(0.,d);
  }

  int tp=int(floor(u_type));
  float dither=0.;
  if(tp==1)      dither=step(hash21(gl_FragCoord.xy),shape);
  else if(tp==2) dither=getBayer(duv,2);
  else if(tp==3) dither=getBayer(duv,4);
  else           dither=getBayer(duv,8);

  dither -= .5;
  float res2 = step(.5, shape+dither);

  vec3 fg = u_colorFront.rgb*u_colorFront.a;
  float fa = u_colorFront.a;
  vec3 bg = u_colorBack.rgb*u_colorBack.a;
  float ba = u_colorBack.a;

  vec3 color = fg*res2 + bg*(1.-fa*res2);
  float opacity = fa*res2 + ba*(1.-fa*res2);
  fragColor = vec4(color, opacity);
}
`

// ── Shape / type maps ─────────────────────────────────────────

const SHAPES = { simplex:1, warp:2, dots:3, wave:4, ripple:5, swirl:6, sphere:7 }
const TYPES  = { random:1, '2x2':2, '4x4':3, '8x8':4 }

function hexToRgba(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return [0,0,0,1]
  return [parseInt(r[1],16)/255, parseInt(r[2],16)/255, parseInt(r[3],16)/255, 1]
}

// ── Vue refs ──────────────────────────────────────────────────

const canvasEl  = ref(null)
let gl          = null
let program     = null
let uniforms    = {}
let rafId       = null
let startTime   = Date.now()
let observer    = null

// ── WebGL setup ───────────────────────────────────────────────

function makeShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

function initGL() {
  const canvas = canvasEl.value
  if (!canvas) return

  gl = canvas.getContext('webgl2')
  if (!gl) { console.error('WebGL2 not supported'); return }

  const vs = makeShader(gl, gl.VERTEX_SHADER,   VERTEX_SRC)
  const fs = makeShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC)
  if (!vs || !fs) return

  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return
  }

  const pos = gl.getAttribLocation(program, 'a_position')
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  uniforms = {
    time:       gl.getUniformLocation(program, 'u_time'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    colorBack:  gl.getUniformLocation(program, 'u_colorBack'),
    colorFront: gl.getUniformLocation(program, 'u_colorFront'),
    shape:      gl.getUniformLocation(program, 'u_shape'),
    type:       gl.getUniformLocation(program, 'u_type'),
    pxSize:     gl.getUniformLocation(program, 'u_pxSize'),
  }

  resize()
  startLoop()
}

function resize() {
  const canvas = canvasEl.value
  if (!canvas || !gl) return
  canvas.width  = canvas.offsetWidth  * devicePixelRatio
  canvas.height = canvas.offsetHeight * devicePixelRatio
  gl.viewport(0, 0, canvas.width, canvas.height)
}

function startLoop() {
  function frame() {
    if (!gl || !program) return
    const t = (Date.now() - startTime) * 0.001 * props.speed
    const w = canvasEl.value?.width  || 1
    const h = canvasEl.value?.height || 1

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    gl.uniform1f(uniforms.time,       t)
    gl.uniform2f(uniforms.resolution, w, h)
    gl.uniform4fv(uniforms.colorBack,  hexToRgba(props.colorBack))
    gl.uniform4fv(uniforms.colorFront, hexToRgba(props.colorFront))
    gl.uniform1f(uniforms.shape,  SHAPES[props.shape]  ?? 1)
    gl.uniform1f(uniforms.type,   TYPES[props.type]    ?? 4)
    gl.uniform1f(uniforms.pxSize, props.pxSize)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)
}

onMounted(() => {
  initGL()
  observer = new ResizeObserver(resize)
  if (canvasEl.value) observer.observe(canvasEl.value)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (observer) observer.disconnect()
  if (gl && program) gl.deleteProgram(program)
})
</script>

<template>
  <canvas ref="canvasEl" class="dithering-canvas" />
</template>

<style scoped>
.dithering-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
