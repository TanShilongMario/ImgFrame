export type FlutedShaderUniforms = {
  shape: 1 | 2 | 3;
  size: number;
  distortion: number;
  shadows: number;
  highlights: number;
  angle: number;
  time?: number;
};

export const FLUTED_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const FLUTED_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform int u_shape;
uniform float u_size;
uniform float u_distortion;
uniform float u_shadows;
uniform float u_highlights;
uniform float u_angle;

out vec4 fragColor;

const vec3 COLOR_SHADOW = vec3(0.0, 0.0, 0.0);
const vec3 COLOR_HIGHLIGHT = vec3(1.0, 1.0, 1.0);

const float PI = 3.14159265;

vec2 rotate2d(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 centeredUV = uv - 0.5;
  centeredUV = rotate2d(centeredUV, u_angle);

  float curve = 0.0;

  if (u_shape == 2) {
    curve = 4.0 * sin(0.23 * (centeredUV.y * 100.0));
  } else if (u_shape == 3) {
    float zigzagY = centeredUV.y * 10.0;
    curve = 10.0 * abs(fract(zigzagY) - 0.5);
  }

  float count = mix(5.0, 100.0, 1.0 - u_size);
  float tileX = (centeredUV.x * count) + curve;
  float localX = fract(tileX);
  float offset = (sin(localX * PI) - 0.5) * u_distortion * 0.22;

  vec2 offsetUV = centeredUV + vec2(offset, 0.0);
  offsetUV = rotate2d(offsetUV, -u_angle);
  vec2 finalUV = offsetUV + 0.5;
  finalUV = clamp(finalUV, 0.001, 0.999);

  vec4 texColor = texture(u_texture, finalUV);

  float shadowMask = pow(1.0 - sin(localX * PI), 2.4);
  float highlightMask = pow(max(0.0, 1.0 - abs(localX - 0.5) * 5.5), 16.0);

  vec3 color = texColor.rgb;
  color = mix(color, COLOR_SHADOW, shadowMask * u_shadows);
  color += COLOR_HIGHLIGHT * highlightMask * u_highlights;

  fragColor = vec4(color, 1.0);
}`;
