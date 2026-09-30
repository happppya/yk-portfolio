// Fullscreen plane vertex shader.
// Uses Three's default GLSL1 dialect: `position` and `uv` are already declared
// by the renderer's prefix, so do not redeclare them here.
precision highp float;

varying vec2 vUv;

void main() {
  vUv = uv;
  // Clip-space directly: the plane is already sized to fill the viewport.
  gl_Position = vec4(position, 1.0);
}
