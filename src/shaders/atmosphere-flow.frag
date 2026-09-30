varying vec2 vUv;
uniform sampler2D uPrevious;
uniform vec2 uTexel;
uniform vec2 uPointer;
uniform vec2 uImpulse;
uniform float uAspect;
uniform float uTime;
uniform float uDelta;
uniform float uActive;

vec2 flow(vec2 p) {
  float t = uTime * 0.11;
  return vec2(
    sin(p.y * 5.8 + t) + cos(p.y * 3.1 - p.x * 2.7 - t * 0.7),
    cos(p.x * 5.2 - t * 0.8) - sin(p.x * 3.6 + p.y * 2.4 + t)
  ) * 0.045;
}

void main() {
  vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
  vec4 previous = texture2D(uPrevious, vUv);
  vec2 wake = (previous.gb - 0.5) * 0.26;
  vec2 velocity = flow(p) + wake;
  vec2 back = clamp(vUv - velocity * uDelta / vec2(uAspect, 1.0), uTexel, 1.0 - uTexel);
  vec4 state = texture2D(uPrevious, back);
  vec4 neighbors = (
    texture2D(uPrevious, back + vec2(uTexel.x, 0.0)) +
    texture2D(uPrevious, back - vec2(uTexel.x, 0.0)) +
    texture2D(uPrevious, back + vec2(0.0, uTexel.y)) +
    texture2D(uPrevious, back - vec2(0.0, uTexel.y))
  ) * 0.25;
  state = mix(state, neighbors, 0.12);
  vec2 distanceToPointer = (vUv - uPointer) * vec2(uAspect, 1.0);
  float brush = exp(-dot(distanceToPointer, distanceToPointer) * 95.0) * uActive;
  float movement = min(1.0, length(uImpulse) * 2.0);
  float mist = state.r * exp(-uDelta * 0.8);
  mist = clamp(mist + brush * (0.12 + movement) * uDelta * 2.4, 0.0, 1.0);
  vec2 impulse = mix(state.gb, vec2(0.5), 1.0 - exp(-uDelta * 1.8));
  vec2 vortex = vec2(-distanceToPointer.y, distanceToPointer.x) * 0.5;
  impulse += brush * (uImpulse * 0.3 + vortex) * uDelta * 2.2;
  gl_FragColor = vec4(mist, clamp(impulse, 0.0, 1.0), 1.0);
}
