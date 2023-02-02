"use strict";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
//var canvas = document.querySelector("#canvas");
canvas.width = 600;
canvas.height = 600;
const gl = canvas.getContext("webgl");


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
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
   v_texcoord = a_texcoord;
}
  `;

const commonVertShaderSource = `
    attribute vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
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
  gl_fragColor = vec4( vec3(dot( tex.rgb, greyScale)), tex.a);
}
  `;


var shaderToysPrograms = {
  "greyScale" : {
  vertShaderSource: commonVertShaderSource,
  fragShaderSource: greyScaleShaderSource
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
  matrixLocation = gl.getUniformLocation(program, "u_matrix");
  textureLocation = gl.getUniformLocation(program, "u_texture");

  // Create a buffer.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Put a unit quad in the buffer
  var   positions = [ 0, 0, 0, 1, 1, 0 , 1, 0, 0, 1, 1, 1 ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create a buffer for texture coords
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Put texcoords in the buffer
  //var texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  var texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  draw(program, positionBuffer, texcoordBuffer, positionLocation);
};

const draw =(program, positionBuffer, texcoordBuffer, positionLocation)=> {
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clear(gl.COLOR_BUFFER_BIT);


  let drawInfos = [];
  const numToDraw = 2;

  var drawInfo = {
    x: 1,
    y: 1,
    dx: 300,
    dy: 300,
    textureInfo: textureInfos[1],
    effects :["greyScale"]
  };
  drawInfos.push(drawInfo);

  var drawInfo2 = {
    x: 300,
    y: 0,
    dx: 1,
    dy: 1,
    textureInfo: textureInfos[0],
    effects:[]
  };
  drawInfos.push(drawInfo2);


  var drawInfo3 = {
    x: 0,
    y: 350,
    dx: 1,
    dy: 1,
    textureInfo: textureInfos[0],
    effects:[]
  };
  drawInfos.push(drawInfo3);

  drawInfos.forEach(function (drawInfo) {
    drawImage(
      drawInfo,
      program,
      positionBuffer,
      texcoordBuffer,
      positionLocation
    );
  });
}

const drawImage = (drawInfo, program, positionBuffer, texcoordBuffer, positionLocation) => {
  gl.bindTexture(gl.TEXTURE_2D, drawInfo.textureInfo.texture);

  // Tell WebGL to use our shader program pair
  gl.useProgram(program);

  if(drawInfo.effects.length > 0){
    var p = createProgram(shaderToysPrograms.greyScale.vertShaderSource,shaderToysPrograms.greyScale.fragShaderSource);
    gl.linkProgram(p);
    gl.useProgram(p);
    const positionLocation2 = gl.getAttribLocation(p, "a_position");
    texcoordLocation = gl.getAttribLocation(p, "a_texcoord");
  
    // lookup uniforms
    textureLocation = gl.getUniformLocation(p, "u_texture");
    gl.enableVertexAttribArray(positionLocation2);
    gl.vertexAttribPointer(positionLocation2, 2, gl.FLOAT, false, 0, 0);
  
  }

  // Setup the attributes to pull data from our buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.enableVertexAttribArray(texcoordLocation);
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

  // this matrix will convert from pixels to clip space
  var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

  // this matrix will translate our quad to dstX, dstY
  matrix = m4.translate(matrix, drawInfo.x, drawInfo.y, 0);

  // this matrix will scale our 1 unit quad
  // from 1 unit to texWidth, texHeight units
  matrix = m4.scale(matrix, drawInfo.textureInfo.width, drawInfo.textureInfo.height, 1);

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

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




