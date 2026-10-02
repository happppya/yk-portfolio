varying vec2 vUv;
uniform sampler2D uPattern;
uniform sampler2D uField;
uniform vec2 uPatternTexel;
uniform float uBlur;
uniform vec2 uPointer;
uniform float uHover;
uniform float uAspect;
uniform vec3 uSurface;
uniform vec3 uDeep;
uniform vec3 uWarm;

// The soft focus the stylesheet used to lay over the whole canvas, now applied here to the
// pattern alone. A CSS blur covers an entire element, so nothing inside it could ever be
// sharp; blurring the pattern in this pass instead lets the cursor's lens step out of it.
#define BLUR_TAP_SIGMA 1.41421356

// The pointer's mark on the pattern: an ordered dither, with its strength falling away
// from the cursor. DITHER_FALLOFF is four times the old lens figure, which is half its
// radius, so the mark reads as something under the pointer rather than a field across the
// hero. DITHER_CELL is the cell size in render pixels; this pass runs at the canvas's own
// resolution, so a cell lands on the pixel grid rather than inside a 16px blur.
#define DITHER_FALLOFF 20.0
#define DITHER_CELL 4.0
#define DITHER_LEVELS 5.0

// The mark is meant to be read, so the lens carries more of the pattern than the wash it
// replaces: LENS_CONTRAST pushes the quantized steps away from the pattern's own value, which
// separates them into a stipple without moving the mean tone, and LENS_GAIN shows the lens
// more pigment than its surroundings. Both are 1.0 for no change at all.
#define LENS_CONTRAST 1.8
#define LENS_GAIN 1.8

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

/** The hero's colour for one pattern value: the reference carries the structure, and here
    it decides how much pigment shows, so the hero stays a whisper behind the type rather
    than an image over it. Gain is what the lens reads the pattern through. */
vec3 heroPigment(float relief, float turn, float mist, float gain) {
  float feather = smoothstep(0.0, 0.24, vUv.y);
  float pearl = clamp(1.1 * (1.0 - relief) * (1.0 - relief), 0.0, 1.0);
  float density = clamp((0.012 + (1.0 - pearl) * 0.13 + mist * 0.06) * gain, 0.0, 1.0) * feather;
  float tint = clamp(0.16 + relief * 0.4 + turn * turn * 0.12, 0.0, 1.0);
  vec3 pigment = mix(uDeep, uWarm, tint);
  return mix(uSurface, pigment, density);
}

/** One tap of the soft focus, decoded from the pattern's own packing. */
vec3 softTap(vec2 uv, float mist) {
  vec4 pattern = texture2D(uPattern, uv);
  return heroPigment(pattern.r, pattern.g * 2.0 - 1.0, mist, 1.0);
}

void main() {
  vec4 pattern = texture2D(uPattern, vUv);
  float relief = pattern.r;
  float turn = pattern.g * 2.0 - 1.0;
  // The mist is far smoother than the pattern, so one reading serves every tap.
  float mist = texture2D(uField, vUv).r;
  // A 3x3 kernel's taps sit sqrt(2) standard deviations out, so the stylesheet's blur in
  // pattern texels becomes a radius here. Weights sum to one, so the mean is preserved.
  vec2 step = uPatternTexel * uBlur * BLUR_TAP_SIGMA;
  vec3 soft = softTap(vUv, mist) * 0.25;
  soft += softTap(vUv + vec2(step.x, 0.0), mist) * 0.125;
  soft += softTap(vUv - vec2(step.x, 0.0), mist) * 0.125;
  soft += softTap(vUv + vec2(0.0, step.y), mist) * 0.125;
  soft += softTap(vUv - vec2(0.0, step.y), mist) * 0.125;
  soft += softTap(vUv + step, mist) * 0.0625;
  soft += softTap(vUv + vec2(step.x, -step.y), mist) * 0.0625;
  soft += softTap(vUv + vec2(-step.x, step.y), mist) * 0.0625;
  soft += softTap(vUv - step, mist) * 0.0625;
  // Measured where the pointer is, before the reference's own 1.5 framing scale.
  vec2 base = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
  vec2 toPointer = base - (uPointer - 0.5) * vec2(uAspect, 1.0) * 2.0;
  float reach = exp(-dot(toPointer, toPointer) * DITHER_FALLOFF) * uHover;
  // Rounded to a few steps, with the ordered threshold deciding which side of a step each
  // cell lands on. Farther from the pointer the pattern is left exactly as it was.
  float dithered = floor(relief * DITHER_LEVELS + bayer4(gl_FragCoord.xy / DITHER_CELL)) / DITHER_LEVELS;
  // Each cell is pushed away from the pattern's own value, so the five steps separate into a
  // mark with real contrast while the region's mean tone stays where the pattern put it.
  float lensRelief = clamp(relief + (dithered - relief) * LENS_CONTRAST, 0.0, 1.0);
  // The lens is the same pattern, unfocused and stippled, so the blur lifts rather than a
  // second image arriving on top of it.
  vec3 lens = heroPigment(lensRelief, turn, mist, LENS_GAIN);
  gl_FragColor = vec4(mix(soft, lens, clamp(reach, 0.0, 1.0)), 1.0);
  #include <colorspace_fragment>
}
