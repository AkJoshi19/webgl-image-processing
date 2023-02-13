"use strict";
var utils = new WebGLUtils();
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
//var canvas = document.querySelector("#canvas");
canvas.width = 600;
canvas.height = 600;
const gl = canvas.getContext("webgl");
gl.clearColor(0.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

const requestCORSIfNotSameOrigin = (img, url)=> {
  if (new URL(url, window.location.href).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}

const loadImageAndCreateTextureInfo =(url) => {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  );

  // let's assume all images are not a power of 2
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  var textureInfo = {
    width: 1, // we don't know the size until it loads
    height: 1,
    texture: tex,
  };
  var img = new Image();
  img.addEventListener("load", function () {
    textureInfo.width = img.width;
    textureInfo.height = img.height;

    gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  });
  requestCORSIfNotSameOrigin(img, url);
  img.src = url;

  return textureInfo;
}

var textureInfos = [
  loadImageAndCreateTextureInfo(
    "https://webglfundamentals.org/webgl/resources/star.jpg"
  ),
  loadImageAndCreateTextureInfo(
    "https://webglfundamentals.org/webgl/resources/leaves.jpg"
  ),
  loadImageAndCreateTextureInfo(
    "https://webglfundamentals.org/webgl/resources/keyboard.jpg"
  ),
];

var texcoordLocation,
  matrixLocation,
  texcoordLocation,
  textureLocation;

const vertShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texcoord;

//uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = vec4(a_position, 0.0, 1.0);
   v_texcoord = a_texcoord;
}
  `;

const commonVertShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;
    varying vec2 v_texcoord;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texcoord = a_texcoord;
    }
`  

const fragShaderSource = `
precision mediump float;
  
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
}
  `;
//https://www.shadertoy.com/view/tllSz2
const greyScaleShaderSource = `
precision mediump float;
  
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
  vec4 tex = texture2D(u_texture, v_texcoord);
  vec3 greyScale = vec3(.5, .5, .5);
  gl_FragColor = vec4( vec3(dot( tex.rgb, greyScale)), tex.a);
}
  `;

  const invertShaderSource = `
precision mediump float;
  
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
  vec4 tex = texture2D(u_texture, v_texcoord);
  gl_FragColor = vec4(1.0 - tex.rgb, 1.0);
}
  `;


var shaderToysPrograms = {
  "greyScale" : {
  program: createProgram(commonVertShaderSource,greyScaleShaderSource)
  },
  "invert" : {
    program : createProgram(vertShaderSource, invertShaderSource )
  }
}


function createProgram(vertShaderSource,fragShaderSource) {
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertShader, vertShaderSource);
  gl.shaderSource(fragShader, fragShaderSource);

  gl.compileShader(vertShader);
  gl.compileShader(fragShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program)
  return program;
}

const coreInit = () => {
  var program = createProgram(vertShaderSource,fragShaderSource);

  gl.linkProgram(program);
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  const positionLocation = gl.getAttribLocation(program, "a_position");
  texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // lookup uniforms
  textureLocation = gl.getUniformLocation(program, "u_texture");

  // Create a buffer.
 

  // Put a unit quad in the buffer
  var   positions = [ 0, 0, 0, 1, 1, 0 , 1, 0, 0, 1, 1, 1 ];
  //var currSX = -1.0, currSY = 1.0, currEX = 0.0 , currEY = 0.0;
//var vertices = utils.prepareRectVec2(currSX, currSY, currEX, currEY);
var textureCoordinates = utils.prepareRectVec2(0.0, 0.0, 1.0, 1.0);

 // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Create a buffer for texture coords
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Put texcoords in the buffer
  //var texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  var texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

  draw(program, texcoordBuffer, positionLocation);
};

const draw =(program, texcoordBuffer, positionLocation)=> {
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clear(gl.COLOR_BUFFER_BIT);

  let drawInfos = [];
  const numToDraw = 2;

  var drawInfo = {
    vertices: {currSX : -1.0, currSY : 1.0, currEX : 0.0 , currEY : 0.0},
    textureInfo: textureInfos[1],
    effects :["invert"]
  };
  drawInfos.push(drawInfo);

  var drawInfo2 = {
    vertices: {currSX : 1.0, currSY : 0.0, currEX : 0.0 , currEY : 1.0},
    textureInfo: textureInfos[0],
    effects:["greyScale"]
  };
  drawInfos.push(drawInfo2);


  var drawInfo3 = {
    vertices: {currSX : -1.0, currSY : -1.0, currEX : 0.0 , currEY : 0.0},
    textureInfo: textureInfos[0],
    effects:[]
  };
  drawInfos.push(drawInfo3);

  var drawInfo2 = {
    vertices: {currSX : 0.0, currSY : 0.0, currEX : 1.0 , currEY : -1.0},
    textureInfo: textureInfos[2],
    effects:[]
  };
  drawInfos.push(drawInfo2);


  drawInfos.forEach(function (drawInfo) {
    drawImage(
      drawInfo,
      program,
      texcoordBuffer,
      positionLocation
    );
  });
}

const drawImage = (drawInfo, program, texcoordBuffer, positionLocation) => {
  gl.bindTexture(gl.TEXTURE_2D, drawInfo.textureInfo.texture);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var vertices = utils.prepareRectVec2(drawInfo.vertices.currSX, drawInfo.vertices.currSY, drawInfo.vertices.currEX, drawInfo.vertices.currEY);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  // Tell WebGL to use our shader program pair
  gl.useProgram(program);

  if(drawInfo.effects.length > 0){
    drawInfo.effects.forEach(e=>{
      var program2 = shaderToysPrograms[e].program
      gl.useProgram(program2);
      const positionLocation2 = gl.getAttribLocation(program2, "a_position");
      texcoordLocation = gl.getAttribLocation(program2, "a_texcoord");
  
      textureLocation = gl.getUniformLocation(program2, "u_texture");
  
      gl.enableVertexAttribArray(positionLocation2);
      gl.vertexAttribPointer(positionLocation2, 2, gl.FLOAT, false, 0, 0);
    })

  } else {
    textureLocation = gl.getUniformLocation(program, "u_texture");
  }

  // Setup the attributes to pull data from our buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.enableVertexAttribArray(texcoordLocation);
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
  // Tell the shader to get the texture from texture unit 0
  gl.uniform1i(textureLocation, 0);

  // draw the quad (2 triangles, 6 vertices)
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  

};

const getDrawInfoDelay = () => {
  setTimeout(() => {
    coreInit();
  }, 2000);
};
getDrawInfoDelay();




