/*
TODO:
1. transparent sides / DONE
2. custom item maps, somehow to assign properties to color
this means that some each color of items_map have meta info, like
thermal conductivity
3. create animation gifs
4. items not only as conditions, but have its own 
thermal conductivity and thermal capacity
5. export as JSON data

*/
var mouseOb = {
  isOver: 0, isDown: 0, x: 0, y: 0, t: 0, temp: 0
}
var canvEl = document.querySelector('canvas')
var tip = document.getElementById('tip')

var k = .001
var width = 300
var height = 300

var settings = {
  'iterations': 30
}

var sideTemps = [0, 0, 100, 0]
var sideTempsOb = {
  leftSide: 0, 
  rightSide: 0, 
  topSide: 19,
  bottomSide:100
}
var transOb = {
  'trans left' : true,
  'trans right' : false,
  'trans top' : false,
  'trans bottom' : false,
}
var transAr = [0,0,0,0]
function conv(ob, ar) {
  let keys = Object.keys(ob)
  keys.map((e,i) => ar[i] = (1+ob[keys[i]]) - 1)
}

items = {
  rectangle: 0,
  circle: 100
}

canvEl.width = width
canvEl.height = height
var isWebGL2 = false
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

/*


(a)%(b)==(a)-((a)/(b))*(b)  //division before multiplication!!!
//use this explicit minteger modulo,and you will be SAFE

//float version just adds a floor;
mod(a,b)==(a)-(floor((a)/(b))*(b))

and for VERY short intervals you may want to do a +.5 offset
*/

vsh1 = `
precision highp float;
attribute vec2 attr;
attribute vec2 uvs;
varying vec2 vuv;
void main() {
  vuv = uvs;
  gl_PointSize = 10.;
  gl_Position = vec4(attr, 0., 1.); 
}`

//                                COMPUTE SHADER
fsh1 = ` 
precision highp float;
uniform sampler2D tex1;
uniform sampler2D items_map;

uniform vec2 time;
uniform vec2 texelSize;
uniform vec2 items;
uniform vec4 mouse;
uniform vec4 sideTemps;
uniform vec4 trans;

varying vec2 vuv;

getFloat32FromRGBA
getRGBAFromFloat32

void main() {
  float mouseRad = .005;
  vec4 c;
  c = texture2D(tex1, vec2(vuv[0], vuv[1]) );
  float cL = vuv[0] - texelSize[0];
  float cR = vuv[0] + texelSize[0];
  float cT = vuv[1] + texelSize[1];
  float cB = vuv[1] - texelSize[1];
  vec4 ctL= texture2D(tex1, vec2(cL, vuv[1]));
  vec4 ctR= texture2D(tex1, vec2(cR, vuv[1]));
  vec4 ctT= texture2D(tex1, vec2(vuv[0], cT));
  vec4 ctB= texture2D(tex1, vec2(vuv[0], cB));
  vec4 ctC= texture2D(tex1, vuv);

  float tL;  float tR;  float tT;  float tB;  float tC;
  
    tL = getFloat32FromRGBA(ctL);
    tR = getFloat32FromRGBA(ctR);
    tT = getFloat32FromRGBA(ctT);
    tB = getFloat32FromRGBA(ctB);
    tC = getFloat32FromRGBA(ctC);
     
  if (cL < 0.) {
    if (trans[0] == 0.) tL = sideTemps[0];
  } 
  if (cT > 1.) {
    if (trans[2] == 0.) tT = sideTemps[2];
  }
  if (cR > 1.) {
  //  tC = 1000000.;
    if (trans[1 ] == 0.)tR = sideTemps[1];
  }
  if (cB < 0.) {
    if (trans[3 ] == 0.) tB = sideTemps[3];
  }

  float k = .999;

  // step
  float dt = k* (tL + tR + tT + tB) / 4.;
  tC = tC * (1. -k) + dt; 

  if (abs(mouse[0] - vuv[0]) < mouseRad && abs(mouse[1] - vuv[1]) < mouseRad) tC = mouse[2];

  // items
  vec4 tcc = texture2D(items_map, vec2(vuv[0], 1.-vuv[1]));
  if (tcc[1] < .15 && tcc[0] >.15) tC = items[1];
  if (tcc[1] > .15 && tcc[0] <.15) tC = items[0];


    
  gl_FragColor = getRGBAFromFloat32(tC);
}
`

//                                      DISPLAY SHADER
var fsh11 = `
precision highp float;
uniform sampler2D tex1;
uniform sampler2D items_map;
uniform vec2 texelSize;
varying vec2 vuv;

getFloat32FromRGBA
getColorByRel
isIsoLine

void main() { vec4 r;

  float cL = vuv[0] - texelSize[0];
  float cR = vuv[0] + texelSize[0];
  float cT = vuv[1] + texelSize[1];
  float cB = vuv[1] - texelSize[1];
  vec4 ctL= texture2D(tex1, vec2(cL, vuv[1]));
  vec4 ctR= texture2D(tex1, vec2(cR, vuv[1]));
  vec4 ctT= texture2D(tex1, vec2(vuv[0], cT));
  vec4 ctB= texture2D(tex1, vec2(vuv[0], cB));
  vec4 ctC= texture2D(tex1, vuv);

  float tL;  float tR;  float tT;  float tB;  float tC;
  
    tL = getFloat32FromRGBA(ctL);
    tR = getFloat32FromRGBA(ctR);
    tT = getFloat32FromRGBA(ctT);
    tB = getFloat32FromRGBA(ctB);
    tC = getFloat32FromRGBA(ctC);
  int isIso = isIsoLine(25., tL, tR, tT, tB, tC);
  isIso += isIsoLine(50., tL, tR, tT, tB, tC);
  isIso += isIsoLine(75., tL, tR, tT, tB, tC);

float min = 0.;
float max = 100.;
float rel = (tC - min) / (max-min);
r = getColorByRel(rel);


  if (isIso>0) r = vec4(1.,1.,1.,1.);

  //r = texture2D(items_map, vuv);
  //r = ctC; // show raw float32
  r[3] = 1.;

  gl_FragColor = r*1.;
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

var f11 = createShader(gl, gl.FRAGMENT_SHADER, fsh11)
var pr11 = createProgram(gl, v, f11)
console.log('pr ', pr)
//gl.useProgram(pr)
gl.clearColor(111.8,.8,3,1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.antialias = false
gl.imageSmoothingEnabled = false

var texWidth = width
var texHeight = height
size = texWidth * texHeight *4
var texData = new Uint8Array(size)
var texDataF32 = new Float32Array(texData.buffer)
texData.fill(0)
var setTexData = (i, j, v) => texData[ (i * texWidth + j) * 4 +2] = v
var setTexDataF32 = (i, j, v) => texDataF32[ i * texWidth + j] = v


console.log('tex d ',texData)
var img = new Image()
img.src = 'items_map.png'
//document.querySelector('body').appendChild(img)
gl.useProgram(pr)
var tdataTex = addDataTex(gl, pr, 'tex1', texWidth, texHeight, texData)
var timgTex 
img.onload = () => {
  gl.useProgram(pr)
  timgTex = addTex(gl, pr, 'items_map', img,1)
}
var fpos = new Float32Array([.35, .45, 0., -.7, -.7999, 0.])
fpos = new Float32Array([
  -1, -1, 1, 1, -1,1,
  -1, -1, 1, -1, 1, 1
])
var uvs = new Float32Array([
  0, 0,   1, 1,   0, 1,
  0, 0,   1, 0,   1, 1
])
addAttr(gl, pr, 'attr', fpos, gl.FLOAT, 2);
addAttr(gl, pr, 'uvs', uvs, gl.FLOAT, 2);

addAttr(gl, pr11, 'attr', fpos, gl.FLOAT, 2);
addAttr(gl, pr11, 'uvs', uvs, gl.FLOAT, 2);
//gl.drawArrays(gl.TRIANGLES, 0, 6);
var dstHeight = canvEl.height
var dstWidth = canvEl.width
const results = new Uint8Array(canvEl.width * canvEl.height * 4);
//gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);







var isTest = false
var saveData
var sideLoc = gl.getUniformLocation(pr, 'sideTemps')

function animate() { //                   ANIMATE
  setTemps()
  mouseStep(mouseOb)
  var period = 1000
  var t = (Date.now() % period) / period
  gl.useProgram(pr)
  gl.uniform2fv(gl.getUniformLocation(pr, 'time'), [t, t])
  gl.uniform2fv(gl.getUniformLocation(pr, 'k'), [k, k])
  gl.uniform2fv(gl.getUniformLocation(pr, 'texelSize'), [1/width, 1/height])
  gl.uniform2fv(gl.getUniformLocation(pr, 'items'), 
  [items.circle, items.rectangle])
  var mob = [mouseOb.x + (1- mouseOb.isDown)*3 +(1-mouseOb.isOver)*3, 
    mouseOb.y+ (1-mouseOb.isDown)*3 +(1-mouseOb.isOver)*3, mouseOb.temp, 0]
    //console.log(mob)
  gl.uniform4fv(gl.getUniformLocation(pr, 'mouse'), mob  )


gl.uniform4fv(sideLoc, sideTemps)
gl.uniform4fv(gl.getUniformLocation(pr, 'trans'), transAr)

 gl.clear(gl.COLOR_BUFFER_BIT);

 var type = gl.UNSIGNED_BYTE
 var format = gl.RGBA
 var internalFormat = gl.RGBA

 // several compute iterations
for (var j=0; j<settings['iterations']; j++) {
  var dataLoc = gl.getUniformLocation(pr, 'tex1')
  gl.uniform1i(dataLoc, 0)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tdataTex)

  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, texWidth, texHeight, 
    0, format, type, texData);  
  
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, timgTex)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  var texLoc = gl.getUniformLocation(pr, 'items_map')
  gl.uniform1i(texLoc, 1)

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    var pix = gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, texData)
   
} // iterations 

  gl.useProgram(pr11)
  gl.uniform2fv(gl.getUniformLocation(pr11, 'texelSize'), [1/width, 1/height])
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(animate)
}
animate()



const gui = new dat.GUI();
gui.add(sideTempsOb, "leftSide", 0, 100)
gui.add(sideTempsOb, "rightSide", 0, 100)
gui.add(sideTempsOb, "topSide", 0, 100)
gui.add(sideTempsOb, "bottomSide", 0, 100)

gui.add(transOb, "trans left", 0, 100)
gui.add(transOb, "trans right", 0, 100)
gui.add(transOb, "trans top", 0, 100)
gui.add(transOb, "trans bottom", 0, 100)

gui.add(items, "circle", 0, 100)
gui.add(items, "rectangle", 0, 100)
gui.add(settings, "iterations", 0, 100)

function setTemps() {
  sideTemps[0] = sideTempsOb.leftSide
  sideTemps[1] = sideTempsOb.rightSide
  sideTemps[2] = sideTempsOb.topSide
  sideTemps[3] = sideTempsOb.bottomSide

  conv(transOb, transAr)
}


function trackMouse(el, ob) {
  el.addEventListener('mouseover', () => ob.isOver = 1)
  el.addEventListener('mouseleave', () => ob.isOver = 0)
  el.addEventListener('mousedown', () => {
    ob.isDown = 1;
    tip.style.display = 'inline'
  })
  el.addEventListener('mouseup', () => {
    ob.isDown = 0; ob.t =0;  
    tip.style.display = 'none'
  })
  el.addEventListener('mousemove', (e) => {
    console.log(e)
    ob.x = e.offsetX / 300
    ob.y = (300-e.offsetY) / 300
    ob.tipX = e.x
    ob.tipY = e.y
    console.log(mouseOb)

  })

}
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function mouseStep(ob) {
  ob.t+=ob.isDown
  ob.temp = Math.pow(ob.t, 3)
  if (ob.temp > 10000000) ob.temp = 10000000
  
  tip.innerHTML = numberWithCommas(ob.temp)
  tip.style.left = ob.tipX  + 'px'
  tip.style.top = ob.tipY - 20+ 'px'
}
trackMouse(document.querySelector('canvas'),mouseOb)