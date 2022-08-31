var canvEl = document.querySelector('canvas')
canvEl.width = 10
canvEl.height = 10
var isWebGL2 = true
var gl = canvEl.getContext(isWebGL2 ? 'webgl2' : 'webgl', {antialias: false})
console.log('gl',gl)
gl.antialias = false
gl.imageSmoothingEnabled = false

var vsh = `#version 300 es
precision highp float;
in vec2 attr;
void main() {
  gl_PointSize = 3.;
  gl_Position = vec4(attr[0], attr[1], 0., 1.);
}`
var fsh = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(1., .5, 0., 1.);
}`

vsh1 = `
precision highp float;
attribute vec2 attr;
void main() {
  gl_PointSize = 1.;
  gl_Position = vec4(attr, 0., 1.); 
}`
fsh1 = `
precision highp float;
void main() {
  gl_FragColor = vec4(0., .0, 0., 1.);
}
`
if (!isWebGL2) {
  vsh = vsh1;
  fsh = fsh1;
}
//gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
var v = createShader(gl, gl.VERTEX_SHADER, vsh)
var f = createShader(gl, gl.FRAGMENT_SHADER, fsh)
var pr = createProgram(gl, v, f)
console.log('pr ', pr)
gl.useProgram(pr)
gl.clearColor(3,0,3,1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.antialias = false
gl.imageSmoothingEnabled = false

var fpos = new Float32Array([.35, .45, 0., -.7, -.999, 0.])
addAttr(gl, pr, 'attr', fpos, gl.FLOAT, 3);
gl.drawArrays(gl.POINTS, 0, 2);
var dstHeight = canvEl.height
var dstWidth = canvEl.width
const results = new Uint8Array(canvEl.width * canvEl.height * 4);
gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);
console.log('results', results)

