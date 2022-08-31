function getMat44tab(m16Mat) {
  let m16 = m16Mat
  let m44 = [[], [], [], []];
  let m44s = '<table style="border: 1px solid black">'
  for (let i = 0; i < 4; i++) {
    m44s += '<tr>'
    for (let j = 0; j < 4; j++) {
      m44[i][j] = Math.round(m16[i * 4 + j] * 10000000) / 10000000
      m44[i][j] = m16[i * 4 + j]
      m44s += '<td>' + String(m44[i][j]) + '</td>'
    }

    m44s += '</tr>'
  }
  m44s += '</table>'
  return m44s;
}

function getMat44tabEdit(m16Mat) {
  let m16 = m16Mat
  let m44 = [[], [], [], []];
  let m44s = '<table style="border: 1px solid black;" contenteditable="true">'
  for (let i = 0; i < 4; i++) {
    m44s += '<tr>'
    for (let j = 0; j < 4; j++) {
      m44[i][j] = Math.round(m16[i * 4 + j] * 10000000) / 10000000
      m44[i][j] = m16[i * 4 + j]
      m44s += '<td>' + String(m44[i][j]) + '</td>'
    }

    m44s += '</tr>'
  }
  m44s += '</table>'
  return m44s;
}

function getPlaneArrayFromTable(tab) {
  let r = []
  let trs = Array.from(tab.querySelectorAll('tr'))
  //  console.log('trs ', trs)
  trs.map(e => {
    let tds = Array.from(e.querySelectorAll('td'))
    //    console.log('tds ', tds)
    tds.map(e => r.push(Number(e.innerHTML)))
  })
  console.log(' r ', r)
  return r
}

function setPlaneArrayToTable(tab, arr) {
  let i = 0
  let trs = Array.from(tab.querySelectorAll('tr'))
  //  console.log('trs ', trs)
  trs.map(e => {
    let tds = Array.from(e.querySelectorAll('td'))
    //  console.log('tds ', tds)
    tds.map(e => e.innerHTML = String(arr[i++]))
  })
}

function applyMatrix(p, e) {
  /*
  float x = v.x;
  float y = v.y;
  float z = v.z;
  float e[16];
  e[0] = m[0][0]; e[1] = m[0][1]; e[2] = m[0][2]; e[3] = m[0][3];
  e[4] = m[1][0]; e[5] = m[1][1]; e[6] = m[1][2]; e[7] = m[1][3];
  e[8] = m[2][0]; e[9] = m[2][1]; e[10] = m[2][2]; e[11] = m[2][3];
  e[12] = m[3][0]; e[13] = m[3][1]; e[14] = m[3][2]; e[15] = m[3][3];
e[15] = 1.;
*/
  let x = p[0]; let y = p[1]; let z = p[2]
  //e[12] = 0.; e[13] = 0.; e[14] = 0.; e[15] = 1.;
  let w;
  w = 1. / (e[3] * x + e[7] * y + e[11] * z + e[15]);
  //   w = 1. / ( e[11] * z + e[15]);
  //w = 1.00002;
  let x1 = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
  let y1 = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
  let z1 = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
  return [x1, y1, z1, 0];
}

// print array in debug window
let pp = (msg, p, precition) => {
  let r = '<br>' + msg
  if (typeof p === 'object') {
    let keys = Object.keys(p)
    for (let i = 0; i < keys.length; i++) {
      let v = p[keys[i]]
      if (typeof v === 'number') {
        r += '\t' + p[keys[i]].toFixed(precition ? precition : 0)
      }
    }
  }
  return r
}


var shaderFuncs = {
  isIsoLine: `
  int isIsoLine(float target, float l, float r, float t, float b, float c) {
    int ovs = 0;
    float dl = (target - l);
    float dr = (target - r);
    float dt = (target - t);
    float db = (target - b);
    float dc = (target - c);
    if (dl * dc < 0. || dt * dc <0.) return 1;
    return 0;
  }
  `,
  getFloat32FromRGBA: `
  
float getFloat32FromRGBA(vec4 c) { //          RGBA DECODE TO FLOAT32
  float r;
  int b0 = int(c[0]*255.);
  int b1 = int(c[1]*255.);
  int b2 = int(c[2]*255.);
  int b3 = int(c[3]*255.);
  int b2p = b2 / 128; // save order bit from b2
  int b2m = (b2  - b2p * 128) ; // remove order bit from mantiss
 
  // shift mantiss (*2) and add senior bit because it is abcent in float32 format
  float m = float(b0 * 2+ b1*512+ b2m * 131072 + 16777216); 
  float p = float(b3 * 2 + b2p); // shift order byte and add order bit from b2
  r = m * pow(2., p - 151.);
  return r;
}
  `,
  getRGBAFromFloat32: `
  vec3 enc3(float v1) {
    int v = int(v1 );
    int d0, d1, d2, d3, t, vt;
    t = v / 256;
    d0 = v - t*256;
    vt = t / 256;
    d1 = t - vt*256;
    t = vt / 256;
    d2 = vt - t * 256;
    d3 = (v / 256) / 256 / 256;
    return vec3(
      float(d0) / 255.,
      float(d1) / 255.,
      float(d2) / 255.
     // float(d3) / 255.
    );
  }
  vec4 getRGBAFromFloat32(float f) { //                     FLOAT32 ENCODE TO RGBA
    float order = floor(log2(f)); 
    float base = pow(2., order);
    
    // convert to the standard form and remove 
    // highest bit (186 => 1.86 => .86)
    float m = f / base - 1.; 
  
    // 8388608 == 256. * 256. * 256. / 2.
    vec3 e3 = enc3(m * 8388608.); // convert to integer (1 bit in b2 left to order bit)
  
    float t1 = order - floor(order/2.) * 2.;
    return vec4(e3[0] , e3[1] , e3[2] + (1.-t1) * 128./255.,
    ( floor((order-1.) / 2.)  + 64.)/ 256.);
  }
  `,
  getColorByRel: `
  vec4 getColorByRel(float rel) {
    //return vec4(rel, 0., 1.-rel, 1.); // raw blue to red
    float k = .85876695599987;
    float k1 = 1. - k;
    if (rel < 1. / 3.) {
      float rrel = rel*3.;
      //return vec4(0.,.7,.7, 1.);
      return vec4(0., rrel * k, 1. - k1*rrel, 1.);
      return vec4(0., rrel * k, 1., 1.);
    } else if (rel < 2./3.) {
      float rrel2 = (rel - 1./3.) * 3.;
      //rrel2 = 1.;
    //  return vec4( rrel2* k , k, 0.,1.);
      return vec4( rrel2* k , k, (1.-rrel2) * k,1.);
      //return vec4(  rrel*k, k, (1.-rrel) * 0.,1.);
      //return vec4( rrel,1.,(1. - rrel),1.);
    } else if (rel <= 1.) {
      float rrel = (rel - 2./3.) * 3.;
      
      return vec4(k + k1*rrel, (1.-rrel)*k,0.,1.);
      return vec4(1. - k1*rrel, (1. - rrel)*k,0.,1.);
      return vec4(1.,(1. - rrel),0.,1.);
    } else {
      return vec4(1., rel / 30. , rel/7., 1.);
    }
    
    return vec4(1.,1.,1.,1.);
  }
  `,

}


//                               create shader (vertex and fragment)

function createShader(gl, type, rawSource) {
  let keys = Object.keys(shaderFuncs)

  var source = rawSource
  keys.map(e => source = source.replace(e, shaderFuncs[e]))
  var shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  console.log(type)
  if (success) {
    return shader
  }
  var compilationLog = gl.getShaderInfoLog(shader);
  console.log('Shader compiler log: ' + compilationLog);
  gl.deleteShader(shader)
}

//                              create and link program with shaders

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  var success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (success) {
    return program
  }
  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}


function addAttr(gl, program, name, buf, type, size) {

  // size = 3;          // components per iteration
  //type = gl.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer

  let loc = gl.getAttribLocation(program, name);
  let glBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuf)

  gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW)
  console.log(glBuf)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, size, type, normalize, stride, offset)
}

// https://stackoverflow.com/questions/8866904/differences-and-relationship-between-glactivetexture-and-glbindtexture

function addTex(gl, program, name, img, i) {
  console.log('img ', img, img.width)
  let tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  var texLoc = gl.getUniformLocation(program, name)
  gl.uniform1i(texLoc, i)

  return tex
}

function addDataTex(gl, program, name, w, h, data) {
  // console.log('img ', img, img.width)
   let tex = gl.createTexture()
   gl.bindTexture(gl.TEXTURE_2D, tex)
 
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  
   var type = gl.UNSIGNED_BYTE
   var format = gl.RGBA
   var internalFormat = gl.RGBA
   gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, data);
 
   var texLoc = gl.getUniformLocation(program, name)
   var i =0
   gl.uniform1i(texLoc, i)
 
   return tex
 }

