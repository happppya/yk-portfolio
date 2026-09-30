varying vec2 vUv;
uniform sampler2D uField;
uniform float uTime;
uniform float uAspect;
uniform vec3 uSurface;
uniform vec3 uInk;
uniform vec3 uAccent;

float wave(vec2 p) {
  return sin(p.x * 2.3 + sin(p.y * 2.1)) * cos(p.y * 2.7 - sin(p.x * 1.4));
}

void main() {
  vec4 field = texture2D(uField, vUv);
  vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5) * 3.0;
  float t = uTime * 0.055;
  vec2 q = p + vec2(wave(p + t), wave(p.yx - t)) * 0.65;
  float angle = 0.42 * sin(length(q) * 1.5 - t) + field.r * 1.4;
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  q = rotation * q + (field.gb - 0.5) * 1.6;
  float folds = wave(q * 1.3 + vec2(t, -t)) + wave(q * 2.1 - t) * 0.3;
  float veil = pow(0.5 + 0.5 * sin(folds * 4.5 + q.y * 1.8), 5.0);
  float envelope = exp(-dot(p - vec2(0.5, 0.1), p - vec2(0.5, 0.1)) * 0.13);
  float edges = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.84, 1.0, vUv.y));
  float density = clamp((veil * 0.055 + field.r * 0.075) * envelope * edges, 0.0, 0.16);
  vec3 tint = mix(uInk, uAccent, 0.2 + field.r * 0.35);
  gl_FragColor = vec4(mix(uSurface, tint, density), 1.0);
  #include <colorspace_fragment>
}
