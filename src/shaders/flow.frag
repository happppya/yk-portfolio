// Flow-field style animated gradient. Pair with flow.vert.
// GLSL1 dialect so Three's injected prefix supplies precision and varyings.
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec2 uPointer;

varying vec2 vUv;

// Cheap value noise + fbm.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;

  // Pointer gently warps the field so the canvas feels reactive.
  p += (uPointer - 0.5) * 0.12;

  float t = uTime * 0.08;
  float n = fbm(p * 2.4 + vec2(t, -t * 0.6));
  float m = fbm(p * 3.7 - vec2(t * 0.4, t * 0.8) + n);

  float mixFactor = smoothstep(0.15, 0.85, n * 0.6 + m * 0.6);
  vec3 color = mix(uColorA, uColorB, mixFactor);

  // Subtle vignette keeps the edges from competing with foreground text.
  float vignette = smoothstep(1.1, 0.2, length(p));
  color *= mix(0.65, 1.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
