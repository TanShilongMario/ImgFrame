import { createCanvas, cssPx, drawCoverImage, type LoadedMedia } from "../export/canvasUtils";
import { FLUTED_BACKGROUND_BLUR } from "../templates/flutedFrame";
import { FLUTED_FRAGMENT_SHADER, FLUTED_VERTEX_SHADER, type FlutedShaderUniforms } from "./flutedShader";

type GlBundle = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  attribs: {
    resolution: WebGLUniformLocation;
    time: WebGLUniformLocation;
    texture: WebGLUniformLocation;
    shape: WebGLUniformLocation;
    size: WebGLUniformLocation;
    distortion: WebGLUniformLocation;
    shadows: WebGLUniformLocation;
    highlights: WebGLUniformLocation;
    angle: WebGLUniformLocation;
  };
};

let cachedBundle: GlBundle | null = null;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("无法创建 Shader。");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader 编译失败";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, FLUTED_VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FLUTED_FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("无法创建 WebGL Program。");
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Program 链接失败";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function getGlBundle(width: number, height: number): GlBundle {
  if (cachedBundle && cachedBundle.canvas.width === width && cachedBundle.canvas.height === height) {
    return cachedBundle;
  }

  if (cachedBundle) {
    const gl = cachedBundle.gl;
    gl.deleteProgram(cachedBundle.program);
    gl.deleteVertexArray(cachedBundle.vao);
    cachedBundle = null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: false,
    antialias: true,
    preserveDrawingBuffer: true
  });

  if (!gl) {
    throw new Error("当前环境不支持 WebGL2，无法渲染长虹玻璃。");
  }

  const program = createProgram(gl);
  const position = gl.getAttribLocation(program, "a_position");
  const vao = gl.createVertexArray();

  if (!vao) {
    throw new Error("无法创建 VAO。");
  }

  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const attribs = {
    resolution: gl.getUniformLocation(program, "u_resolution")!,
    time: gl.getUniformLocation(program, "u_time")!,
    texture: gl.getUniformLocation(program, "u_texture")!,
    shape: gl.getUniformLocation(program, "u_shape")!,
    size: gl.getUniformLocation(program, "u_size")!,
    distortion: gl.getUniformLocation(program, "u_distortion")!,
    shadows: gl.getUniformLocation(program, "u_shadows")!,
    highlights: gl.getUniformLocation(program, "u_highlights")!,
    angle: gl.getUniformLocation(program, "u_angle")!
  };

  cachedBundle = { canvas, gl, program, vao, attribs };
  return cachedBundle;
}

function bindCoverTexture(gl: WebGL2RenderingContext, source: CanvasImageSource) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("无法创建纹理。");
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  return texture;
}

export function renderFlutedBackground(
  media: LoadedMedia,
  width: number,
  height: number,
  uniforms: FlutedShaderUniforms
): HTMLCanvasElement {
  const blurPx = cssPx(FLUTED_BACKGROUND_BLUR, width);
  const bgExpand = cssPx(24, width);
  const bgWidth = width * 1.08;
  const bgHeight = height * 1.08;
  const bgX = (width - bgWidth) / 2;
  const bgY = (height - bgHeight) / 2;

  const { canvas: coverCanvas, context: coverContext } = createCanvas(width, height);
  coverContext.save();
  coverContext.filter = `blur(${blurPx}px)`;
  drawCoverImage(
    coverContext,
    media.source,
    bgX - bgExpand,
    bgY - bgExpand,
    bgWidth + bgExpand * 2,
    bgHeight + bgExpand * 2,
    0.42
  );
  coverContext.restore();

  const bundle = getGlBundle(width, height);
  const { gl, program, vao, attribs } = bundle;

  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  const texture = bindCoverTexture(gl, coverCanvas);

  gl.uniform2f(attribs.resolution, width, height);
  gl.uniform1f(attribs.time, uniforms.time ?? 0);
  gl.uniform1i(attribs.texture, 0);
  gl.uniform1i(attribs.shape, uniforms.shape);
  gl.uniform1f(attribs.size, uniforms.size);
  gl.uniform1f(attribs.distortion, uniforms.distortion);
  gl.uniform1f(attribs.shadows, uniforms.shadows);
  gl.uniform1f(attribs.highlights, uniforms.highlights);
  gl.uniform1f(attribs.angle, uniforms.angle);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.deleteTexture(texture);
  gl.bindVertexArray(null);

  const output = createCanvas(width, height).canvas;
  const outputContext = output.getContext("2d");
  if (!outputContext) {
    throw new Error("无法创建 2D 画布。");
  }

  outputContext.drawImage(bundle.canvas, 0, 0);
  return output;
}
