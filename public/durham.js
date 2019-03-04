// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform bool u_isLighting;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);\n' +
  '  v_TexCoords = a_TexCoords;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 

  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' + 
  'uniform  highp vec3 u_LightColor;\n' + 
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


var buildingModel;

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

var InitDemo = function () {
    loadJSONResource('/building.json', function (modelErr, modelObj) {
        if (modelErr) {
            alert('Fatal error getting Susan model (see console)');
            console.error(fsErr);
        } else {
            loadImage('/textures/buildingTexture.jpg', function (imgErr, img) {
                if (imgErr) {
                    alert('Fatal error getting Susan texture (see console)');
                    console.error(imgErr);
                } else { 
                    main(modelObj);
                }
            });
        }
    });
};
	
function main(buildingModel) {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  console.log(buildingModel);
  
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor( 0.74902, 0.847059, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting ) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, buildingModel);
  };

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, buildingModel);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, buildingModel) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, buildingModel);
}
/*
function buildingBuffer(gl, buildingModel) {
    
    var buildingVertices = buildingModel.meshes[0].vertices;
	var buildingIndices = [].concat.apply([], buildingModel.meshes[0].faces);
    var buildingNormals = buildingModel.meshes[0].normals;

    if (!initArrayBuffer(gl, 'a_Position', buildingVertices, 3, gl.FLOAT)) return -1;
    //if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', buildingNormals, 3, gl.FLOAT)) return -1;
    /*
    var buildingIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buildingIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buildingIndices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, buildingPosVertexBufferObject);
	var positionAttribLocation = gl.getAttribLocation(gl.program, 'a_Position');
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);
  
    var buildingPosVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buildingPosVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buildingVertices), gl.STATIC_DRAW);
        // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buildingIndices, gl.STATIC_DRAW);
        

  
    return buildingIndices.length;
  }
  */
  

function greyCube(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function greenCube(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Coordinates
       0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
       0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
       0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
      -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
      -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
       0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
    ]);
  
  
    var colors = new Float32Array([    // Colors
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,    // v0-v1-v2-v3 front
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,    // v0-v3-v4-v5 right
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,    // v0-v5-v6-v1 up
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,    // v1-v6-v7-v2 left
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,    // v7-v4-v3-v2 down
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,　  // v4-v7-v6-v5 back
   ]);
  
  
    var normals = new Float32Array([    // Normal
      0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
     -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
      0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
      0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);
  
  
    // Indices of the vertices
    var indices = new Uint8Array([
       0, 1, 2,   0, 2, 3,    // front
       4, 5, 6,   4, 6, 7,    // right
       8, 9,10,   8,10,11,    // up
      12,13,14,  12,14,15,    // left
      16,17,18,  16,18,19,    // down
      20,21,22,  20,22,23     // back
   ]);
  
  
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  
    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
    return indices.length;
  }

function brownCube(gl) {
// Create a cube
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |     | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3
var vertices = new Float32Array([   // Coordinates
    0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
    0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
]);


var colors = new Float32Array([    // Colors
    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back
]);


var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
]);


// Indices of the vertices
var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,   4, 6, 7,    // right
    8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
]);


// Write the vertex property to buffers (coordinates, colors and normals)
if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

// Write the indices to the buffer object
var indexBuffer = gl.createBuffer();
if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
}

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

return indices.length;
}

function signStand(gl) {
// Create a cube
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |     | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3
var vertices = new Float32Array([   // Coordinates
    0.5, 0.5, 0.5,  -0.5, 1.1, 0.5,  -0.5,-1.5, 0.5,   0.5,-1.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5,   0.5,-1.5, 0.5,   0.5,-1.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 1.1,-0.5,  -0.5, 1.1, 0.5, // v0-v5-v6-v1 up
   -0.5, 1.1, 0.5,  -0.5, 1.1,-0.5,  -0.5,-1.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
   -0.5,-1.5,-0.5,   0.5,-1.5,-0.5,   0.5,-1.5, 0.5,  -0.5,-1.5, 0.5, // v7-v4-v3-v2 down
    0.5,-1.5,-0.5,  -0.5,-1.5,-0.5,  -0.5, 1.1,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
 ]);


var colors = new Float32Array([    // Colors
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v1-v2-v3 front
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v3-v4-v5 right
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v5-v6-v1 up
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v1-v6-v7-v2 left
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v7-v4-v3-v2 down
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,　  // v4-v7-v6-v5 back
]);


var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
]);


// Indices of the vertices
var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,   4, 6, 7,    // right
    8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
]);


// Write the vertex property to buffers (coordinates, colors and normals)
if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

// Write the indices to the buffer object
var indexBuffer = gl.createBuffer();
if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
}

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

return indices.length;
}

function buildingRoofBuffers(gl) {
  var vertices = new Float32Array([   // Coordinates
    0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5,-0.5,   0.5,-0.5, 0.5,   0.5, -0.3,-0.3,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
    0.5, 0.5,-0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5,-0.5, // v0-v5-v6-v1 up
   -0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, -0.3,-0.3,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
   -0.5, -0.3,-0.3,  0.5, -0.3,-0.3,    0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.3,-0.3,   -0.5, -0.3,-0.3,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
 ]);


  var colors = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
function cylinder(gl) {
    
    cylinderObject = Cylinder();

    console.log(cylinderObject);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', cylinderObject.vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', cylinderObject.normals, 3, gl.FLOAT)) return -1;
    //var colorLocation = gl.getUniformLocation(gl.program, "v_Color");
    //gl.disableVertexAttribArray(colorLocation);
    //gl.vertexAttrib4f(colorLocation, 1, 1, 1, 0);
    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cylinderObject.indices, gl.STATIC_DRAW);
    
    return cylinderObject.indices.length;
    }

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b) 
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, buildingModel) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, true); // Will apply lighting

    // Rotate, and then translate
    modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  


  // CREATE THE SIGN STAND
  var n = signStand(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(2, -1.7, -2);
    modelMatrix.scale(0.1, 0.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(2, -1.7, -2.4);
    modelMatrix.scale(0.1, 0.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();




  // CREATE THE BASE
  var n = greenCube(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(0, -2, 0);
    modelMatrix.scale(8, 0.05, 8); 
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // CREATING ALL THE WALLS
  var n = greyCube(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(-3, -1.5, -3.95);
    modelMatrix.scale(2, 1, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.5, -1.6, -3.95);
    modelMatrix.scale(2, 0.8, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-0.2, -1.75, -3.95);
    modelMatrix.scale(0.7, 0.5, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //This is the sign
  pushMatrix(modelMatrix);
    modelMatrix.translate(2, -1.55, -2.2);
    modelMatrix.rotate(45,0,0,1);
    modelMatrix.rotate(90,0,1,0);
    modelMatrix.scale(0.7, 0.5, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //CREATING THE BUILDING
  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.5, -1.95, -1.9);
    modelMatrix.scale(2.5, 0.1, 4); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.5, -1.9, -1.95);
    modelMatrix.scale(2.3, 0.08, 3.9); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //left wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-3.5, -0.8, -2.45);
    modelMatrix.scale(0.08, 2.1, 3); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //right wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.5, -1.5, -2.45);
    modelMatrix.scale(0.08, 1, 3); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //right wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.5, 0, -2.45);
    modelMatrix.scale(0.08, 0.5, 3); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //right wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.5, -0.5, -3.45);
    modelMatrix.scale(0.08, 1, 1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //right wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.5, -0.5, -1.45);
    modelMatrix.scale(0.08, 1, 1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //back wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.5, -0.8, -3.95);
    modelMatrix.scale(2.09, 2.1, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //front left wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(-3.44, -0.8, -0.91);
    modelMatrix.scale(0.2, 2.1, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.9, -0.8, -0.91);
    modelMatrix.scale(0.2, 2.1, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.1, -0.8, -0.91);
    modelMatrix.scale(0.2, 2.1, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.56, -0.8, -0.91);
    modelMatrix.scale(0.2, 2.1, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //top front
  pushMatrix(modelMatrix);
    modelMatrix.translate(-2.5, -0.05, -0.91);
    modelMatrix.scale(2.09, 0.6, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //bottom left front
  pushMatrix(modelMatrix);
    modelMatrix.translate(-3.1, -1.5, -0.91);
    modelMatrix.scale(0.5, 0.7, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //bottom right front
  pushMatrix(modelMatrix);
    modelMatrix.translate(-1.9, -1.5, -0.91);
    modelMatrix.scale(0.5, 0.7, 0.08); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // CREATING ALL THE WALLS
  var n = buildingRoofBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);
    modelMatrix.scale(1, 1, 1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();



  //CREATING THE BENCH
  var n = brownCube(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(2, -1.7, 3);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(1, 0.2, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(2, -1.5, 3.2);
    //modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(1, 0.2, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = sphere(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);
    modelMatrix.scale(1, 1, 1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  /*
  //CREATE THE CYLINDER
  var n = cylinder(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.scale(1, 1, 1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();*/

  //CREATE THE BUILDING 
  
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}

function loadTexAndDraw(gl, n, texture, u_Sampler, u_UseTextures) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
  
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // Assign u_Sampler to TEXTURE0
    gl.uniform1i(u_Sampler, 0);
  
    // Enable texture mapping
    gl.uniform1i(u_UseTextures, true);
  
    // Draw the textured cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  }

function drawBuilding(gl, buildingModel) {
    var susanVertices = buildingModel.meshes[0].vertices;
	var susanIndices = [].concat.apply([], buildingModel.meshes[0].faces);

	console.log(susanVertices.length);
	console.log(susanIndices.length);
	var susanNormals = buildingModel.meshes[0].normals;
	//var susanTexCoords = SusanModel.meshes[0].texturecoords[0];

	var susanPosVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, susanPosVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanVertices), gl.STATIC_DRAW);

	/*var susanTexCoordVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, susanTexCoordVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanTexCoords), gl.STATIC_DRAW);*/

	var susanIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, susanIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(susanIndices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, susanPosVertexBufferObject);
	var positionAttribLocation = gl.getAttribLocation(gl.program, 'a_Position');
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.useProgram(gl.program);

	var matWorldUniformLocation = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	var matViewUniformLocation = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	var matProjUniformLocation = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), 700 / 700, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var xRotationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);

	//
	// Main render loop
	//
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	var angle = 0;
	var loop = function () {
		angle = performance.now() / 1000 / 6 * 2 * Math.PI;
		mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
		mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
		mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

		//gl.bindTexture(gl.TEXTURE_2D, susanTexture);
		//gl.activeTexture(gl.TEXTURE0);
		console.log(susanIndices.length);
		gl.drawElements(gl.TRIANGLES, susanIndices.length, gl.UNSIGNED_BYTE, 0);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
  }


function Cylinder () {
    var sides = 20;
    var height = 1.0;
    var stepTheta = 2 * Math.PI / sides;
    var verticesPerCap = 9 * sides;
  
    var vertices = [];
    var theta = 0;
    var i = 0;
  
    // Top Cap
    for (; i < verticesPerCap; i += 9) {
      vertices[i    ] = Math.cos(theta);
      vertices[i + 1] = height;
      vertices[i + 2] = Math.sin(theta);
      theta += stepTheta;
  
      vertices[i + 3] = 0.0;
      vertices[i + 4] = height;
      vertices[i + 5] = 0.0;
  
      vertices[i + 6] = Math.cos(theta);
      vertices[i + 7] = height;
      vertices[i + 8] = Math.sin(theta);
    }
  
    // Bottom Cap
    theta = 0;
    for (; i < verticesPerCap + verticesPerCap; i += 9) {
      vertices[i + 6] = Math.cos(theta);
      vertices[i + 7] = -height;
      vertices[i + 8] = Math.sin(theta);
      theta += stepTheta;
  
      vertices[i + 3] = 0.0;
      vertices[i + 4] = -height;
      vertices[i + 5] = 0.0;
  
      vertices[i    ] = Math.cos(theta);
      vertices[i + 1] = -height;
      vertices[i + 2] = Math.sin(theta);
    }
  
    for (var j = 0; j < sides; ++j) {
      for (var k = 0; k < 3; ++k, ++i) {
        vertices[i] = vertices[0 + k + 9 * j];
      }
      for (var k = 0; k < 3; ++k, ++i) {
        vertices[i] = vertices[6 + k + 9 * j];
      }
      for (var k = 0; k < 3; ++k, ++i) {
        vertices[i] = vertices[verticesPerCap + k + 9 * j];
      }
  
      for (var k = 0; k < 3; ++k, ++i) {
        vertices[i] = vertices[0 + k + 9 * j];
      }
      for (var k = 0; k < 3; ++k, ++i) {
        vertices[i] = vertices[verticesPerCap + k + 9 * j];
      }
      for (var k = 0; k < 3; ++k, ++i) {
        vertices[i] = vertices[verticesPerCap + 6 + k + 9 * j];
      }
    }
  
  
    var indices = new Array(vertices.length / 3);
    for (i = 0; i < indices.length; ++i) indices[i] = i;
  
    function sub (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
    function cross (a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
    };
    function normalize (a) {
      var length = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
      return [a[0] / length, a[1] / length, a[2] / length];
    };
  
    var normals = [];
  
    for (var i = 0; i < vertices.length; i += 9) {
      var a = [vertices[i    ], vertices[i + 1], vertices[i + 2]];
      var b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
      var c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]]
      var normal = normalize(cross(sub(a, b), sub(a, c)));
      normals = normals.concat(normal, normal, normal);
    }
  
    return {
      vertices: vertices,
      indices: indices,
      normals: normals,
    };
  };

  function sphere(gl)
    {
      var SPHERE_DIV = 6;
      var i, ai, si, ci;
      var j, aj, sj, cj;
      var p1, p2;
      var vertices = [],indices = [];
      for (j = 0; j <= SPHERE_DIV; j++) 
      {
        aj = j * Math.PI / SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (i = 0; i <= SPHERE_DIV; i++) 
        {
          ai = i * 2 * Math.PI / SPHERE_DIV;
          si = Math.sin(ai);
          ci = Math.cos(ai);
          vertices.push(si * sj);  // X
          vertices.push(cj);       // Y
          vertices.push(ci * sj);  // Z
        }
      }

      for (j = 0; j < SPHERE_DIV; j++)
      {
        for (i = 0; i < SPHERE_DIV; i++)
        {
          p1 = j * (SPHERE_DIV+1) + i;
          p2 = p1 + (SPHERE_DIV+1);
          indices.push(p1);
          indices.push(p2);
          indices.push(p1 + 1);
          indices.push(p1 + 1);
          indices.push(p2);
          indices.push(p2 + 1);
        }
      }
      var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) 
      {
        console.log('Failed to create the buffer object');
        return -1;
      }
      
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    //if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    //if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    //var colorLoc = gl.getAttribLocation(gl.program, "a_color");
    //gl.disableVertexAttribArray(colorLoc);
    //gl.vertexAttrib4f(colorLoc, 1, 1, 1, 1);

      return indices.length;
    }
