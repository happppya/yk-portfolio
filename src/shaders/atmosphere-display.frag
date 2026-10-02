varying vec2 vUv;
uniform sampler2D uField;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
uniform float uAspect;
uniform vec3 uSurface;
uniform vec3 uDeep;
uniform vec3 uWarm;

// The hero pattern, from inspiration/new_heroshader.txt: a fixed-point iteration whose
// accumulated density, turn, and depth carry a fine filament structure. The reference's
// own one hundred steps and its relief lighting are kept; its AA supersampling is not,
// because the layer already renders at a low edge and is upscaled soft. Its vivid cosine
// palette is replaced by the two warm stops the surface supplies.
#define HERO_STEPS 100

// The pointer's mark on the pattern: an ordered dither, with its strength falling away
// from the cursor. DITHER_FALLOFF is four times the old lens figure, which is half its
// radius, so the mark reads as something under the pointer rather than a field across the
// hero. DITHER_CELL is the cell size in render pixels: the canvas is upscaled behind a
// 16px blur, so a cell has to be several render pixels wide to survive it.
#define DITHER_FALLOFF 20.0
#define DITHER_CELL 4.0
#define DITHER_LEVELS 5.0

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

// Ordered dithering, the classic Bayer matrix: a value rounded to a few steps breaks into
// a stipple rather than a band when each screen cell rounds by its own threshold. Built
// from floor and fract, so it needs no lookup table.
float bayer2(vec2 cell) {
  cell = floor(cell);
  return fract(cell.x * 0.5 + cell.y * cell.y * 0.75);
}

float bayer4(vec2 cell) {
  return bayer2(cell * 0.5) * 0.25 + bayer2(cell);
}

void main() {
  vec4 field = texture2D(uField, vUv);
  vec2 base = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
  // Measured where the pointer is, before the reference's own 1.5 framing scale.
  vec2 toPointer = base - (uPointer - 0.5) * vec2(uAspect, 1.0) * 2.0;
  float reach = exp(-dot(toPointer, toPointer) * DITHER_FALLOFF) * uHover;
  // The wake nudges the pattern rather than replacing it: at this scale a large
  // displacement would smear the filaments instead of stirring them.
  vec2 p = (base + (field.gb - 0.5) * 0.18) * 1.5;
  float turn;
  float depth;
  float relief = heroField(p, turn, depth);
  // Rounded to a few steps, with the ordered threshold deciding which side of a step each
  // cell lands on. Farther from the pointer the pattern is left exactly as it was.
  float dithered = floor(relief * DITHER_LEVELS + bayer4(gl_FragCoord.xy / DITHER_CELL)) / DITHER_LEVELS;
  relief = mix(relief, dithered, clamp(reach, 0.0, 1.0));
  float feather = smoothstep(0.0, 0.24, vUv.y);
  // The reference carries the structure; here it decides how much pigment shows,
  // so the hero stays a whisper behind the type rather than an image over it.
  float pearl = clamp(1.1 * (1.0 - relief) * (1.0 - relief), 0.0, 1.0);
  float density = (0.012 + (1.0 - pearl) * 0.13 + field.r * 0.06) * feather;
  float tint = clamp(0.16 + relief * 0.4 + turn * turn * 0.12, 0.0, 1.0);
  vec3 pigment = mix(uDeep, uWarm, tint);
  gl_FragColor = vec4(mix(uSurface, pigment, density), 1.0);
  #include <colorspace_fragment>
}
