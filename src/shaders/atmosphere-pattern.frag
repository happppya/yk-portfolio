varying vec2 vUv;
uniform sampler2D uField;
uniform float uTime;
uniform float uAspect;

// The hero pattern, from inspiration/new_heroshader.txt: a fixed-point iteration whose
// accumulated density, turn, and depth carry a fine filament structure. The reference's
// own one hundred steps and its relief lighting are kept; its AA supersampling is not,
// because this pass runs at the layer's low edge and the display pass softens the result.
// Its vivid cosine palette is replaced by the two warm stops the surface supplies. This is
// the one expensive pass in the hero, and it is the reason the pattern is evaluated here
// rather than at the canvas's own resolution: the display pass can then afford a sharp
// cursor lens over a mean field, because it never pays for these hundred steps.
#define HERO_STEPS 100

vec2 heroStep(vec2 z, vec4 t) {
  return z - 0.05 * cos(t.xz + z.x * z.y + cos(t.yw + 4.712389 * z.yx) + z.yx * z.yx);
}

/** The reference's relief-lit density, reporting the turn and depth it accumulated. */
float heroField(vec2 p, out float turn, out float depth) {
  // The reference advances four sine arguments at ~0.105 radians per second.
  vec4 t = uTime * 0.104720 * vec4(1.0, -1.0, 1.0, -1.0) + vec4(0.0, 2.0, 3.0, 1.0);
  vec2 z = p;
  float density = 0.0;
  turn = 0.0;
  depth = 0.0;
  for (int i = 0; i < HERO_STEPS; i++) {
    z = heroStep(z, t);
    float d = dot(z - p, z - p);
    density += 1.0 / (0.1 + d);
    turn += sin(atan(p.x - z.x, p.y - z.y));
    depth += exp(-0.2 * d);
  }
  float inverse = 1.0 / float(HERO_STEPS);
  density *= inverse;
  turn *= inverse;
  depth *= inverse;

  vec3 palette = 0.5 + 0.5 * cos(vec3(0.0, 0.4, 0.8) + 2.5 + depth * 6.2831);
  palette *= 0.5 + 0.5 * turn;
  palette *= density;
  // The reference's relief: a screen-space normal bent by the density slope. At this
  // resolution the neighbouring-pixel difference is all the relief detail there is.
  vec3 normal = normalize(vec3(dFdx(density), 0.02, dFdy(density)));
  float diffuse = dot(normal, vec3(0.7, 0.1, 0.7));
  palette -= 0.05 * vec3(diffuse);
  palette *= 3.2 / (3.0 + palette);
  return clamp(dot(palette, vec3(0.333333)), 0.0, 1.0);
}

void main() {
  vec4 field = texture2D(uField, vUv);
  vec2 base = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
  // The wake nudges the pattern rather than replacing it: at this scale a large
  // displacement would smear the filaments instead of stirring them.
  vec2 p = (base + (field.gb - 0.5) * 0.18) * 1.5;
  float turn;
  float depth;
  float relief = heroField(p, turn, depth);
  // Relief drives the pigment and its stipple; turn carries the reference's own colour
  // variation. Turn is signed and this target is unsigned, so it travels remapped.
  gl_FragColor = vec4(relief, turn * 0.5 + 0.5, 0.0, 1.0);
}
