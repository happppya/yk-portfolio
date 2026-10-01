varying vec2 vUv;
uniform sampler2D uField;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
uniform float uAspect;
uniform vec2 uTexel;
uniform vec3 uSurface;
uniform vec3 uInk;
uniform vec3 uAccent;

// Nested sinusoidal fBM and relief lighting adapted from inspiration/heroshader.txt.
const mat2 octaveRotation = mat2(0.80, 0.60, -0.60, 0.80);

float noise(vec2 p) {
  return sin(p.x) * sin(p.y);
}

float fbm4(vec2 p) {
  float f = 0.5000 * noise(p); p = octaveRotation * p * 2.02;
  f += 0.2500 * noise(p); p = octaveRotation * p * 2.03;
  f += 0.1250 * noise(p); p = octaveRotation * p * 2.01;
  f += 0.0625 * noise(p);
  return f / 0.9375;
}

float fbm6(vec2 p) {
  float f = 0.500000 * (0.5 + 0.5 * noise(p)); p = octaveRotation * p * 2.02;
  f += 0.250000 * (0.5 + 0.5 * noise(p)); p = octaveRotation * p * 2.03;
  f += 0.125000 * (0.5 + 0.5 * noise(p)); p = octaveRotation * p * 2.01;
  f += 0.062500 * (0.5 + 0.5 * noise(p)); p = octaveRotation * p * 2.04;
  f += 0.031250 * (0.5 + 0.5 * noise(p)); p = octaveRotation * p * 2.01;
  f += 0.015625 * (0.5 + 0.5 * noise(p));
  return f / 0.96875;
}

float marble(vec2 q, out vec4 detail) {
  float t = uTime * 0.45;
  q += 0.03 * sin(vec2(0.27, 0.23) * t + length(q) * vec2(4.1, 4.3));
  vec2 o = vec2(fbm4(0.9 * q), fbm4(0.9 * q + vec2(7.8)));
  o += 0.04 * sin(vec2(0.12, 0.14) * t + length(o));
  vec2 n = vec2(fbm6(3.0 * o + vec2(16.8)), fbm6(3.0 * o + vec2(11.5)));
  detail = vec4(o, n);
  float f = 0.5 + 0.5 * fbm4(1.8 * q + 6.0 * n);
  return mix(f, f * f * f * 3.5, f * abs(n.x));
}

// The cursor is a quiet liquid lens: a slow swirl, a soft pinch toward the
// center, and faint ripple rings that shiver outward and die quickly.
vec2 warpAroundPointer(vec2 p) {
  vec2 center = (uPointer - 0.5) * vec2(uAspect, 1.0) * 2.0;
  vec2 offset = p - center;
  float radius = length(offset);
  float influence = exp(-dot(offset, offset) * 5.0) * uHover;
  float ring = sin(radius * 15.0 - uTime * 1.7) * exp(-radius * 3.0) * uHover;
  float angle = influence * 1.25 + ring * 0.16;
  mat2 vortex = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 warped = vortex * offset;
  // The lens pinches the folds inward under the cursor, then releases them.
  warped *= 1.0 + influence * 0.28 - influence * influence * 0.22;
  // The fading rings ripple the folds radially as they travel outward.
  warped += offset / max(radius, 1e-4) * ring * 0.03;
  return center + warped;
}

void main() {
  vec4 field = texture2D(uField, vUv);
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
  vec2 toPointer = p - (uPointer - 0.5) * vec2(uAspect, 1.0) * 2.0;
  float lens = exp(-dot(toPointer, toPointer) * 4.0) * uHover;
  p = warpAroundPointer(p) + (field.gb - 0.5) * 1.15;
  vec4 detail;
  float f = marble(p, detail);
  float e = 2.0 * uTexel.y;
  vec4 unusedDetail;
  vec3 normal = normalize(vec3(marble(p + vec2(e, 0.0), unusedDetail) - f,
    2.0 * e, marble(p + vec2(0.0, e), unusedDetail) - f));
  vec3 light = normalize(vec3(0.9, 0.2, -0.4));
  float diffuse = clamp(0.3 + 0.7 * dot(normal, light), 0.0, 1.0);
  float relief = (normal.y * 0.5 + 0.5) * 0.85 + diffuse * 0.15;
  float depth = clamp(f * 2.0 * relief, 0.0, 1.0);
  // Inverted, squared relief mirrors the reference's pearlescent marbling.
  float pearl = clamp(1.1 * (1.0 - depth) * (1.0 - depth), 0.0, 1.0);
  float feather = smoothstep(0.0, 0.24, vUv.y);
  float density = (0.012 + (1.0 - pearl) * 0.13) * feather;
  float tint = clamp(0.16 + f * 0.4 + detail.y * detail.y * 0.12, 0.0, 1.0);
  // Faint chromatic split and a glassy glint under the lens: felt, not seen.
  vec3 pigment = mix(uInk, uAccent, clamp(tint + vec3(0.05, 0.0, -0.05) * lens, 0.0, 1.0));
  pigment += uAccent * lens * 0.035;
  gl_FragColor = vec4(mix(uSurface, pigment, density), 1.0);
  #include <colorspace_fragment>
}
