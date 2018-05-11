var vertexShaderText = `
  attribute vec3 vertPosition;
  attribute vec3 vertColor;
  varying vec3 fragColor;

  uniform mat4 matWorld;
  uniform mat4 matView;
  uniform mat4 matProj;

  void main(){
    fragColor = vertColor;
    gl_Position= matProj * matView * matWorld * vec4(vertPosition, 1.0);
  }
`

var fragmentShaderText = `
  precision highp float;
  varying vec3 fragColor;
  void main(){
    gl_FragColor = vec4(fragColor, 1.0);
  }
`

var init = function(){
  // Initialize webgl
  var canvas = document.getElementById('canvas');
  var gl = getWebGl(canvas);
  if (!gl) {
    alert('Your browser does not support webgl!')
    return;
  }
  setFullScreen(canvas, gl);

  gl.clearColor(0.80, 0.85, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  setupShaders(gl, vertexShader, fragmentShader);
  // tell gl to use shaders together
  var program = setupProgram(gl, vertexShader, fragmentShader);
  if(!program) return;

  var triangleVert = [
    //X    Y    Z      R    G    B
     0.0,  0.5, 0.0,   1.0, 1.0, 0.0,
    -0.5, -0.5, 0.0,   0.7, 0.0, 1.0,
     0.5, -0.5, 0.0,   0.1, 1.0, 1.0];

  draw(gl, program, triangleVert);
};

function setFullScreen(canvas, gl){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, window.innerWidth, window.innerHeight);
}

function getWebGl(canvas){
  var gl = canvas.getContext('webgl');
  if (!gl) {
    gl = canvas.getContext('experimental-webgl');
  }
  return gl;
}

function draw(gl, program, triangleVert){
  var triangleVertBufferObj = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertBufferObj);
  // STATIC_DRAW = send info from cpu to gpu only once
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVert), gl.STATIC_DRAW);

  setupVertexAttrib(gl, program, {'name': 'vertPosition',
                                 'nr_of_elem': 3,
                                 'size_of_vert': 6,
                                 'offset': 0});
  setupVertexAttrib(gl, program, {'name': 'vertColor',
                                 'nr_of_elem': 3,
                                 'size_of_vert': 6,
                                 'offset': 3});
  gl.useProgram(program);

  //TODO refactor
  var matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');
  var matViewdUniformLocation = gl.getUniformLocation(program, 'matView');
  var matProjUniformLocation = gl.getUniformLocation(program, 'matProj');
  var worldMatrix = new Float32Array(16);
  var viewMatrix = new Float32Array(16);
  var projectMatrix = new Float32Array(16);
  mat4.identity(worldMatrix);
  mat4.lookAt(viewMatrix, [0,0,-5], [0,0,0], [0,1,0]);
  mat4.perspective(projectMatrix,glMatrix.toRadian(45), canvas.width/canvas.height, 0.1, 1000.0);
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
  gl.uniformMatrix4fv(matViewdUniformLocation, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projectMatrix);

  //main render loop
  var identityMatrix = new Float32Array(16);
  mat4.identity(identityMatrix);
  var angle = 0;
  var loop = function() {
    angle = performance.now()/1000/6*2*Math.PI;
    mat4.rotate(worldMatrix, identityMatrix, angle, [1,1,0]);
    //update the world matrix
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 3); // what you want to draw, skip, how many
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function setupVertexAttrib(gl, program, data){
  var attribLocation = gl.getAttribLocation(program, data['name']);
  gl.vertexAttribPointer(
    attribLocation,
    data['nr_of_elem'], // nr of elements
    gl.FLOAT,
    gl.FALSE,
    data['size_of_vert'] * Float32Array.BYTES_PER_ELEMENT, // size of individual vertex * size of a single float
    data['offset'] * Float32Array.BYTES_PER_ELEMENT // offset from the beggining of a single vertex to this attribute
  )
  gl.enableVertexAttribArray(attribLocation);
}

function setupProgram(gl, vertexShader, fragmentShader){
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  // link the program together
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
    console.log("ERROR linking program", gl.getProgramInfoLog(program));
    return;
  }
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
    console.log("ERROR linking program", gl.getProgramInfoLog(program));
    return;
  }
  return program;
}

function setupShaders(gl, vertexShader, fragmentShader){
  gl.shaderSource(vertexShader, vertexShaderText);
  gl.shaderSource(fragmentShader, fragmentShaderText);

  var shaders = [vertexShader, fragmentShader];
  for (var i=0; i<shaders.length; i++) {
    gl.compileShader(shaders[i]);
    if (hasGlCompileErrors(gl, shaders[i]))
      return;
  }
}

function hasGlCompileErrors(gl, shader){
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("ERROR compiling shader", gl.getShaderInfoLog(shader));
    return true;
  }
  return false;
}
