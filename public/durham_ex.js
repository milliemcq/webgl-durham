// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
  'varying vec3 v_Position;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
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
  'uniform bool u_UseTextures;\n' +    // Texture enable/disable flag    // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
  'if (u_UseTextures) {\n' +
  '     gl_FragColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '  } else {\n' +
  '  gl_FragColor = v_Color;\n' +
  '  }\n' +
  '}\n';



  var InitDemo = function () {
            loadJSONResource('/models/sphere.json', function (modelErr, treeModel) {
              if (modelErr) {
                alert('Fatal error getting tree model (see console)');
                console.error(modelErr);
                    //main(treeModel);
                    //console.log(treeModel);
                  }
                  else{
                    main(treeModel);
                  }
                });
              };

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var WING_STEP = 10;
var ZOOM_STEP = 0.5
var bird_down = false; 
var fireflies = false; 
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var zoom = 15;

var main = function (treeModel) {

  //console.log(treeModel);

  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  //console.log(buildingModel);
  
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

  //console.log(canvas.width)
  //console.log(canvas.height)

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(0, 0, zoom, 0, 0, -100, 0, 1, 0);

  var currentTranslation = 0.0;
  var currentAngle = 0.0;
  
  projMatrix.setPerspective(30, 800/800, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    useTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    var grassTexture = gl.createTexture();
    grassTexture.image = new Image();
    grassTexture.image.src = './textures/grass.jpg';
    grassTexture.image.onload = function () {
        console.log("Grass texture loaded")
        loadTexture(gl, grassTexture, gl.TEXTURE1);
    };

    var brickTexture = gl.createTexture();
    brickTexture.image = new Image();
    brickTexture.image.src = './textures/brick.jpg';
    brickTexture.image.onload = function () {
        console.log("Grass texture loaded")
        loadTexture(gl, brickTexture, gl.TEXTURE3);
    };

    var brickTexture = gl.createTexture();
    brickTexture.image = new Image();
    brickTexture.image.src = './textures/stone.jpg';
    brickTexture.image.onload = function () {
        console.log("Grass texture loaded")
        loadTexture(gl, brickTexture, gl.TEXTURE3);
    };

    

    var signTexture = gl.createTexture();
    signTexture.image = new Image();
    signTexture.image.src = './textures/signTexture.png';
    signTexture.image.onload = function () {
        loadTexture(gl, signTexture, gl.TEXTURE2);
        var tick = function() {
          currentTranslation = animateTranslate(currentTranslation);  // Update the rotation angle
          currentAngle = animateRotate(currentAngle);  // Update the rotation angle
          //console.log(u_ViewMatrix);
          document.onkeydown = function(ev){
            keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, useTextures, u_LightColor, 0, u_ViewMatrix);
          };
          drawWithTextures(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, useTextures, treeModel, currentTranslation, currentAngle);
          requestAnimationFrame(tick, canvas); // Request that the browser calls tick
        };
        tick();
    };

  

  }

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, useTextures, u_LightColor, treeModel, u_ViewMatrix) {
  //console.log(u_ViewMatrix);
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
    case 13:
      gl.uniform3f(u_LightColor, 1.0, 0.5, 0.4);
      gl.clearColor( 1.0, 0.8, 0.7, 1.0);
      fireflies = true;
      break; 
    case 90: // y - zoom out
      zoom += ZOOM_STEP;
      viewMatrix.setLookAt(0, 0, zoom, 0, 0, -100, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      //projMatrix.setPerspective(500, 800/800, 1, 100);
      break;
    case 88: //x - zoom in
      zoom -= ZOOM_STEP;
      //console.log(zoom);
      viewMatrix.setLookAt(0, 0, zoom, 0, 0, -100, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      //projMatrix.setPerspective(500, 800/800, 1, 100);
      break; 
    

    default: return; // Skip drawing at no effective action
  }

}
  
function blackCube(gl, color) {
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


  switch(color) {
    case "black":
        var colors = new Float32Array([    // Colors
          0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v1-v2-v3 front
          0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v3-v4-v5 right
          0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v5-v6-v1 up
          0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v1-v6-v7-v2 left
          0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v7-v4-v3-v2 down
          0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,　  // v4-v7-v6-v5 back
      ]);
      break;
    case "orange":
      var colors = new Float32Array([    // Colors
        1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,  // v0-v1-v2-v3 front 
        1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,     // v0-v3-v4-v5 right
        1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,    // v0-v5-v6-v1 up
        1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,    // v1-v6-v7-v2 left
        1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,    // v7-v4-v3-v2 down
        1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,　    // v4-v7-v6-v5 back
      ]);
      break;
    case "brown":
      var colors = new Float32Array([    // Colors
        0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
        0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
        0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
        0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
        0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
        0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back
      ]);
      break;
    case "green":
      var colors = new Float32Array([    // Colors
        
        0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,  0.137255, 0.556863, 0.137255,    // v0-v1-v2-v3 front
        0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,  0.137255, 0.556863, 0.137255,    // v0-v3-v4-v5 right
        0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,  0.137255, 0.556863, 0.137255,    // v0-v1-v2-v3 front
        0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,  0.137255, 0.556863, 0.137255,    // v1-v6-v7-v2 left
        0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,  0.137255, 0.556863, 0.137255,    // v0-v1-v2-v3 front
        0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,   0.137255, 0.556863, 0.137255,  0.137255, 0.556863, 0.137255,   // v4-v7-v6-v5 back
      ]);
      break;
    
    case "grey":
      var colors = new Float32Array([    // Colors
        0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
        0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
        0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
        0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
        0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
        0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824　    // v4-v7-v6-v5 back
       ]);
      break;
    default:
      var colors = new Float32Array([    // Colors
        0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v1-v2-v3 front
        0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v3-v4-v5 right
        0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v5-v6-v1 up
        0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v1-v6-v7-v2 left
        0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v7-v4-v3-v2 down
        0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,　  // v4-v7-v6-v5 back
    ]);
  
  }

  

  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

    // Texture Coordinates
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
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

  //console.log("Inside green cube")
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

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

function signStand(gl, grey) {
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


if(!grey){
var colors = new Float32Array([    // Colors
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v1-v2-v3 front
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v3-v4-v5 right
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v0-v5-v6-v1 up
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v1-v6-v7-v2 left
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,    // v7-v4-v3-v2 down
    0, 0, 0,   0, 0, 0,   0, 0, 0,   0, 0, 0,　  // v4-v7-v6-v5 back
]);
}
else{
var colors = new Float32Array([    // Colors
  0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
  0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
  0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
  0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
  0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
  0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824　    // v4-v7-v6-v5 back
]);
}


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

function buildingRoofBuffers(gl, grey) {
  var vertices = new Float32Array([   // Coordinates
    0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5,-0.5,   0.5,-0.5, 0.5,   0.5, -0.3,-0.3,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
    0.5, 0.5,-0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5,-0.5, // v0-v5-v6-v1 up
   -0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, -0.3,-0.3,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
   -0.5, -0.3,-0.3,  0.5, -0.3,-0.3,    0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.3,-0.3,   -0.5, -0.3,-0.3,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
 ]);


 if(grey){
  var colors = new Float32Array([    // Colors
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824　    // v4-v7-v6-v5 back
  ]);
}
else{
  var colors = new Float32Array([    // Colors
    1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,  // v0-v1-v2-v3 front 
    1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,     // v0-v3-v4-v5 right
    1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,    // v0-v5-v6-v1 up
    1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,    // v1-v6-v7-v2 left
    1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,    // v7-v4-v3-v2 down
    1, 0.5, 0,   1, 0.5, 0,  1, 0.5, 0,   1, 0.5, 0,　    // v4-v7-v6-v5 back
  ]);

}


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

function initCylinderArrayBuffer (gl, grey) {

  
  var vertices = new Float32Array([
    0, 1, -1, 0, 1, 1, 0.19509, 0.980785, 1
    , 0.19509, 0.980785, -1, 0.19509, 0.980785, -1, 0.19509, 0.980785, 1
    , 0.382683, 0.92388, 1, 0.382683, 0.92388, -1, 0.382683, 0.92388, -1
    , 0.382683, 0.92388, 1, 0.55557, 0.83147, 1, 0.55557, 0.83147, -1
    , 0.55557, 0.83147, -1, 0.55557, 0.83147, 1, 0.707107, 0.707107, 1
    , 0.707107, 0.707107, -1, 0.707107, 0.707107, -1, 0.707107, 0.707107, 1
    , 0.83147, 0.55557, 1, 0.83147, 0.55557, -1, 0.83147, 0.55557, -1
    , 0.83147, 0.55557, 1, 0.92388, 0.382683, 1, 0.92388, 0.382683, -1
    , 0.92388, 0.382683, -1, 0.92388, 0.382683, 1, 0.980785, 0.19509, 1
    , 0.980785, 0.19509, -1, 0.980785, 0.19509, -1, 0.980785, 0.19509, 1
    , 1, 7.54979e-008, 1, 1, 7.54979e-008, -1, 1, 7.54979e-008, -1, 1,
    7.54979e-008, 1, 0.980785, -0.19509, 1, 0.980785, -0.19509, -1, 0.980785, -0.19509, -1
    , 0.980785, -0.19509, 1, 0.92388, -0.382683, 1, 0.92388, -0.382683, -1, 0.92388, -0.382683,
    -1, 0.92388, -0.382683, 1, 0.83147, -0.55557, 1, 0.83147, -0.55557, -1, 0.83147
    , -0.55557, -1, 0.83147, -0.55557, 1, 0.707107, -0.707107, 1, 0.707107, -0.707107,
    -1, 0.707107, -0.707107, -1, 0.707107, -0.707107, 1, 0.55557, -0.83147, 1, 0.55557
    , -0.83147, -1, 0.55557, -0.83147, -1, 0.55557, -0.83147, 1, 0.382683, -0.92388, 1, 0.382683,
    -0.92388, -1, 0.382683, -0.92388, -1, 0.382683, -0.92388, 1, 0.19509, -0.980785, 1, 0.19509,
    -0.980785, -1, 0.19509, -0.980785, -1, 0.19509, -0.980785, 1, -3.25841e-007, -1, 1, -3.25841e-007
    , -1, -1, -3.25841e-007, -1, -1, -3.25841e-007, -1, 1, -0.195091, -0.980785, 1, -0.195091, -0.980785,
    -1, -0.195091, -0.980785, -1, -0.195091, -0.980785, 1, -0.382684, -0.923879, 1, -0.382684, -0.923879,
    -1, -0.382684, -0.923879, -1, -0.382684, -0.923879, 1, -0.555571, -0.831469, 1, -0.555571, -0.831469,
    -1, -0.555571, -0.831469, -1    , -0.555571, -0.831469, 1, -0.707107, -0.707106, 1, -0.707107,
    -0.707106, -1, -0.707107, -0.707106, -1, -0.707107, -0.707106, 1, -0.83147, -0.55557, 1, -0.83147,
    -0.55557, -1, -0.83147, -0.55557, -1, -0.83147, -0.55557, 1, -0.92388, -0.382683, 1, -0.92388, -0.382683,
    -1, -0.92388, -0.382683, -1, -0.92388, -0.382683, 1, -0.980785, -0.195089, 1, -0.980785, -0.195089, -1
    , -0.980785, -0.195089, -1, -0.980785, -0.195089, 1, -1, 9.65599e-007, 1, -1, 9.65599e-007, -1, -1, 9.65599e-007,
    -1, -1, 9.65599e-007, 1, -0.980785, 0.195091, 1, -0.980785, 0.195091, -1, -0.980785, 0.195091, -1, -0.980785,
    0.195091, 1, -0.923879, 0.382684, 1, -0.923879, 0.382684, -1, -0.923879, 0.382684, -1, -0.923879, 0.382684, 1,
    -0.831469, 0.555571, 1, -0.831469, 0.555571, -1, -0.831469, 0.555571, -1, -0.831469, 0.555571, 1, -0.707106, 0.707108
    , 1, -0.707106, 0.707108, -1, -0.707106, 0.707108, -1, -0.707106, 0.707108, 1, -0.555569, 0.83147, 1, -0.555569, 0.83147,
    -1, -0.555569, 0.83147, -1, -0.555569, 0.83147, 1, -0.382682, 0.92388, 1, -0.382682, 0.92388, -1, 0.19509, 0.980785, 1,
    0, 1, 1, -0.195089, 0.980786, 1, -0.382682, 0.92388, 1, -0.555569, 0.83147, 1, -0.707106, 0.707108, 1, -0.831469, 0.555571,
    1, -0.923879, 0.382684, 1, -0.980785, 0.195091, 1, -1, 9.65599e-007, 1, -0.980785, -0.195089, 1, -0.92388, -0.382683,
    1, -0.83147, -0.55557, 1, -0.707107, -0.707106, 1, -0.555571, -0.831469, 1, -0.382684, -0.923879, 1, -0.195091,
    -0.980785, 1, -3.25841e-007, -1, 1, 0.19509, -0.980785, 1, 0.382683, -0.92388, 1, 0.55557, -0.83147,
    1, 0.707107, -0.707107, 1, 0.83147, -0.55557, 1, 0.92388, -0.382683, 1, 0.980785, -0.19509,1, 1,
    7.54979e-008, 1, 0.980785, 0.19509, 1, 0.92388, 0.382683, 1, 0.83147, 0.55557, 1, 0.707107, 0.707107,
    1, 0.55557, 0.83147, 1, 0.382683, 0.92388, 1, -0.382682, 0.92388, -1, -0.382682, 0.92388, 1, -0.195089,
    0.980786, 1, -0.195089, 0.980786, -1, -0.195089, 0.980786, -1, -0.195089, 0.980786, 1, 0, 1, 1, 0, 1,
 
 -1, 0, 1, -1, 0.19509, 0.980785, -1, 0.382683, 0.92388, -1, 0.55557, 0.83147, -1, 0.707107, 0.707107,
    -1, 0.83147, 0.55557, -1, 0.92388, 0.382683, -1, 0.980785, 0.19509, -1, 1, 7.54979e-008, -1, 0.980785,
    -0.19509, -1, 0.92388, -0.382683, -1, 0.83147, -0.55557, -1, 0.707107, -0.707107, -1, 0.55557, -0.83147,
    -1, 0.382683, -0.92388, -1, 0.19509, -0.980785, -1, -3.25841e-007, -1, -1, -0.195091, -0.980785, -1,
    -0.382684, -0.923879, -1, -0.555571, -0.831469, -1, -0.707107, -0.707106, -1, -0.83147, -0.55557,
    -1, -0.92388, -0.382683, -1, -0.980785, -0.195089, -1, -1, 9.65599e-007, -1,
    -0.980785, 0.195091, -1, -0.923879, 0.382684, -1, -0.831469, 0.555571, -1, -0.707106,
    0.707108, -1, -0.555569, 0.83147, -1, -0.382682, 0.92388, -1, -0.195089, 0.980786, -1
  ]);
  
 
  if(grey){
  var colors = new Float32Array([    // Colors
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back

    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  // v0-v1-v2-v3 front 
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v3-v4-v5 right
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,     // v0-v5-v6-v1 up
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v1-v6-v7-v2 left
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,    // v7-v4-v3-v2 down
    0.658824, 0.658824, 0.658824,   0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,  0.658824, 0.658824, 0.658824,　    // v4-v7-v6-v5 back
 ]);
}
else{
 var colors = new Float32Array([    // Colors
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back

  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v1-v2-v3 front  
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v3-v4-v5 right
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v0-v5-v6-v1 up
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v1-v6-v7-v2 left
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v7-v4-v3-v2 down
  0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,    0.52, 0.37, 0.26,   // v4-v7-v6-v5 back
]);
}
 
 
  var normals = new Float32Array([    // Normal
    0.0980173, 0.995185, 0, 0.0980173, 0.995185, 0, 0.0980173, 0.995185, 0, 0.0980173, 0.995185, 0, 0.290285, 0.95694, 0, 0.290285, 0.95694, 0, 0.290285, 0.95694, 0, 0.290285, 0.95694, 0, 0.471397, 0.881921, 0, 0.471397
    , 0.881921, 0, 0.471397, 0.881921, 0, 0.471397, 0.881921, 0, 0.634393, 0.77301, 0, 0.634393, 0.77301, 0, 0.634393, 0.77301
    , 0, 0.634393, 0.77301, 0, 0.77301, 0.634393, 0, 0.77301, 0.634393, 0, 0.77301, 0.634393, 0, 0.77301, 0.634393, 0, 0.881921, 0.471397, 0, 0.881921, 0.471397, 0, 0.881921
    , 0.471397, 0, 0.881921, 0.471397, 0, 0.95694, 0.290285, 0, 0.95694, 0.290285, 0, 0.95694, 0.290285, 0, 0.95694, 0.290285, 0, 0.995185, 0.0980173, 0, 0.995185, 0.0980173
    , 0, 0.995185, 0.0980173, 0, 0.995185, 0.0980173, 0, 0.995185, -0.098017, 0, 0.995185, -0.098017, 0, 0.995185, -0.098017, 0, 0.995185, -0.098017, 0, 0.95694, -0.290285, 0, 0.95694, -0.290285
    , 0, 0.95694, -0.290285, 0, 0.95694, -0.290285, 0, 0.881921, -0.471396, 0, 0.881921, -0.471396, 0, 0.881921, -0.471396, 0, 0.881921, -0.471396, 0, 0.77301, -0.634393, 0, 0.77301, -0.634393, 0, 0.77301, -0.634393, 0
    , 0.77301, -0.634393, 0, 0.634393, -0.77301, 0, 0.634393, -0.77301, 0, 0.634393, -0.77301, 0, 0.634393, -0.77301, 0, 0.471397, -0.881921, 0, 0.471397, -0.881921, 0, 0.471397, -0.881921, 0, 0.471397, -0.881921, 0, 0.290284, -0.95694, 0, 0.290284, -0.95694, 0, 0.290284, -0.95694
    , 0, 0.290284, -0.95694, 0, 0.0980169, -0.995185, 0, 0.0980169, -0.995185, 0, 0.0980169, -0.995185, 0, 0.0980169, -0.995185, 0, -0.0980176, -0.995185, 0, -0.0980176, -0.995185, 0, -0.0980176, -0.995185, 0, -0.0980176
    , -0.995185, 0, -0.290285, -0.95694, 0, -0.290285, -0.95694, 0, -0.290285, -0.95694, 0, -0.290285, -0.95694, 0, -0.471397, -0.881921, 0, -0.471397, -0.881921, 0, -0.471397, -0.881921, 0, -0.471397, -0.881921
    , 0, -0.634394, -0.77301, 0, -0.634394, -0.77301, 0, -0.634394, -0.77301, 0, -0.634394, -0.77301, 0, -0.773011, -0.634393, 0, -0.773011, -0.634393, 0, -0.773011, -0.634393, 0, -0.773011
    , -0.634393, 0, -0.881922, -0.471396, 0, -0.881922, -0.471396, 0, -0.881922, -0.471396, 0, -0.881922, -0.471396, 0, -0.956941, -0.290284, 0, -0.956941, -0.290284, 0, -0.956941, -0.290284, 0
    , -0.956941, -0.290284, 0, -0.995185, -0.0980163, 0, -0.995185, -0.0980163, 0, -0.995185, -0.0980163, 0, -0.995185, -0.0980163, 0, -0.995185, 0.0980182, 0, -0.995185, 0.0980182, 0, -0.995185
    , 0.0980182, 0, -0.995185, 0.0980182, 0, -0.95694, 0.290286, 0, -0.95694, 0.290286, 0, -0.95694, 0.290286, 0, -0.95694, 0.290286, 0, -0.881921, 0.471398, 0
    , -0.881921, 0.471398, 0, -0.881921, 0.471398, 0, -0.881921, 0.471398, 0, -0.77301, 0.634394, 0, -0.77301, 0.634394, 0, -0.77301, 0.634394, 0, -0.77301
 , 0.634394, 0, -0.634392, 0.773011, 0, -0.634392, 0.773011, 0, -0.634392, 0.773011, 0, -0.634392, 0.773011, 0, -0.471395, 0.881922, 0, -0.471395, 0.881922
    , 0, -0.471395, 0.881922, 0, -0.471395, 0.881922, 0, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0
    , 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008
    , 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1
    , -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0
    , 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -0.290283, 0.956941, 0, -0.290283, 0.956941, 0, -0.290283
    , 0.956941, 0, -0.290283, 0.956941, 0, -0.0980165, 0.995185, 0, -0.0980165, 0.995185, 0, -0.0980165, 0.995185, 0, -0.0980165, 0.995185, 0, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008
    , 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008
    , 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1
    , 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1
    , 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1
  ]);
 
 
  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23,     // back
    24,25,26,  24,26,27,
    28,29,30,  28, 30, 31,
    32,33,34,  32, 34, 35,
    36,37,38,  36, 38, 39,
    40,41,42,  40, 42, 43,
    44,45,46,  44, 46, 47,
    48,49,50,  48, 50, 51,
    52,53,54,  52, 54, 55,
    56,57,58,  56, 58, 59,
    60,61,62,  60, 62, 63,
    64,65,66,  64, 66, 67,
    68,69,70,  68, 70, 71,
    72,73,74,  72, 74, 75,
    76,77,78,  76, 78, 79,
    80,81,82,  80, 82, 83,
    84,85,86,  84, 86, 87,
    88,89,90,  88, 90, 91,
    92,93,94,  92, 94, 95,
    96,97,98,  96, 98, 99,
    100,101,102,  100, 102, 103,
    104,105,106,  104, 106, 107,
    108,109,110,  108, 110, 111,
    112,113,114,  112, 114, 115,
    116,117,118,  116, 118, 119,
    151,120,121,  151, 121, 122,
    151,122,123,  151, 123, 124,
    151,124,125,  151, 125, 126,
    151,126,127,  151, 127, 128,
    151,128,129,  151, 129, 130,
    151,130,131,  151, 131, 132,
    151,132,133,  151, 133, 134,
    151,134,135,  151, 135, 136,
    151,136,137,  151, 137, 138,
    151,138,139,  151, 139, 140,
    151,140,141,  151, 141, 142,
    151,142,143,  151, 143, 144,
    151,144,145,  151, 145, 146,
    151,146,147,  151, 147, 148,
    151,148,149,  149, 150, 151,
    152,153,154,  152, 154, 155,
    156,157,158,  156, 158, 159,
    191,160,161,  191, 161, 162,
    191,162,163,  191, 163, 164,
    191,164,165,  191, 165, 166,
    191,166,167,  191, 167, 168,
    191,168,169,  191, 169, 170,
    191,170,171,  191, 171, 172,
    191,172,173,  191, 173, 174,
    191,174,175,  191, 175, 176,
    191,176,177,  191, 177, 178,
    191,178,179,  191, 179, 180,
    191,180,181,  191, 181, 182,
    191,182,183,  191, 183, 184,
    191,184,185,  191, 185, 186,
    191,186,187,  191, 187, 188,
    191,188,189,  189, 190, 191
 ]);
 
 //console.log(vertices.length)
 //console.log(normals.length)

 //console.log(vertices);
 ///console.log(colors);
 
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  //gl.disableVertexAttribArray('a_TexCoords');
  //gl.disableVertexAttribArray(1);
  gl.disableVertexAttribArray(2);
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

function initGrassBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.0, 3.0, 0.0,   0.0, 3.0, 0.0,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.0, 3.0, 0.0,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.0, 3.0, 0.0, // v0-v3-v4-v5 right
     0.0, 3.0, 0.0,   0.0, 3.0, 0.0,   0.0, 3.0, 0.0,   0.0, 3.0, 0.0, // v0-v5-v6-v1 up
     0.0, 3.0, 0.0,   0.0, 3.0, 0.0,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,   0.0, 3.0, 0.0,   0.0, 3.0, 0.0, // v4-v7-v6-v5 back
     
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


var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}


function drawWithTextures(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, useTextures, model, currentTranslation, currentAngle) {
      // Clear color and depth buffer
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniform1i(u_isLighting, true); // Will not apply lighting
      gl.uniform1i(useTextures, false);

      modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
      modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
      modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

      var n = blackCube(gl, "black");
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }
      gl.uniform1i(useTextures, true);

      //This is the sign
      pushMatrix(modelMatrix);
        modelMatrix.translate(2, -1.55, -2.2);
        modelMatrix.rotate(45,0,0,1);
        modelMatrix.rotate(90,0,1,0);
        modelMatrix.scale(0.7, 0.5, 0.05); 
        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(u_Sampler, 2);
        gl.uniform1i(useTextures, true);// Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
        //loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, GrassTexture, u_Sampler, u_UseTextures, true)
      modelMatrix = popMatrix();

      gl.uniform1i(useTextures, false);

      //console.log("Inside onload");
      var n = blackCube(gl, "green");
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -2, 0);
        modelMatrix.scale(8, 0.1, 8); 
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(u_Sampler, 1);
        gl.uniform1i(useTextures, true);// Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
        gl.uniform1i(useTextures, false);
      modelMatrix = popMatrix();

      gl.uniform1i(useTextures, false);

      //GRASS CLUSTER STARTS HERE
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.15, -1.9, 0.3);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.3, -1.9, 0.3);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.2, -1.9, 0.45);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //SECOND GRASS CLUSTER
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.15, -1.9, 0.3);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.3, -1.9, 0.3);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.2, -1.9, 0.45);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //STUMP GRASS CLUSTER
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.85, -1.9, 2.0);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.0, -1.9, 2.0);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.9, -1.9, 2.15);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //BENCH GRASS CLUSTER
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.15, -1.9, 3.0);
        modelMatrix.scale(0.07, 0.15, 0.05);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(1.3, -1.9, 3.0);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(1.2, -1.9, 3.15);
        modelMatrix.scale(0.07, 0.15, 0.05); 
        modelMatrix.rotate(-20,0,1,0);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      //TREE LEAVES
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 1, 0);
        modelMatrix.scale(0.5, 0.5, 0.5); 
        modelMatrix.rotate(-20+currentAngle,0,1,0);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix(); 

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.8, 0.35, 0);
        modelMatrix.scale(0.8, 0.8, 0.8); 
        modelMatrix.rotate(20,0,1,0);
        modelMatrix.rotate(45+currentAngle,0,0,1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix(); 

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.3, 0.9, 0.4);
        modelMatrix.scale(0.6, 0.6, 0.6); 
        modelMatrix.rotate(20 + currentAngle,0,1,0);
        //modelMatrix.rotate(45,0,0,1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix(); 

      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.7, 0.4);
        modelMatrix.scale(0.6, 0.6, 0.6); 
        modelMatrix.rotate(20 + currentAngle,0,1,0);
        //modelMatrix.rotate(45,0,0,1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix(); 

      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.5, -0.6);
        modelMatrix.scale(0.6, 0.6, 0.6); 
        modelMatrix.rotate(20,0,1,0);
        modelMatrix.rotate(45,1,0,0);
        //modelMatrix.rotate(45,0,0,1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix(); 

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.5, 0.5, 0);
        modelMatrix.scale(0.6, 0.6, 0.6); 
        modelMatrix.rotate(40,0,1,0);
        modelMatrix.rotate(45,1,0,0);
        //modelMatrix.rotate(45,0,0,1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix(); 


      

      //GRASS
      var n = initGrassBuffers(gl);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      //GRASS CLUSTER STARTS HERE
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.15, -1.8, 0.3);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.3, -1.8, 0.3);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.2, -1.8, 0.45);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //SECOND GRASS CLUSTER
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.15, -1.8, 0.3);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.3, -1.8, 0.3);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.2, -1.8, 0.45);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //STUMP GRASS CLUSTER
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.85, -1.8, 2.0);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.0, -1.8, 2.0);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.9, -1.8, 2.15);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //BENCH GRASS CLUSTER
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.15, -1.8, 3.0);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(1.3, -1.8, 3.0);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(1.2, -1.8, 3.15);
        modelMatrix.rotate(20,1,0,0);
        modelMatrix.rotate(-20,0,1,0);
        modelMatrix.scale(0.07, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      
  
    
      //gl.uniform1i(u_UseTextures, false);
    
      // CREATE THE SIGN STAND
      var n = signStand(gl, false);
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

      var n = signStand(gl, true);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(-3.55, 0.13, -0.05);
        modelMatrix.scale(0.2, 0.08, 0.1); // Scale
        modelMatrix.rotate(90,0,0,1);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.45, 0.14, -0.05);
        modelMatrix.scale(0.2, 0.08, 0.1); // Scale
        modelMatrix.rotate(90,0,0,1);
        modelMatrix.rotate(180,1,0,0);
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

          //CREATING THE BENCH
      var n = blackCube(gl, "brown");
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
        modelMatrix.rotate(180,1,0,0);
        modelMatrix.scale(1, 0.2, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      
      /*var n = initIcosahedronBuffers(gl);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      console.log(n);

      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(1, 1, 1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();*/

      
      //CREATE THE CYLINDER
      var n = initCylinderArrayBuffer(gl, true);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2, -0.9, -0.4);
        
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.13, 0.13, 1.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.6, -0.9, -0.4);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.13, 0.13, 1.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-3, -0.9, -0.4);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.13, 0.13, 1.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-3.4, -0.9, -0.4);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.13, 0.13, 1.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

        //CREATE THE BUILDING */
        // CREATING ALL THE WALLS
      var n = blackCube(gl, "grey");
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(-3, -1.5, -3.95);
        modelMatrix.scale(2, 1, 0.1); // Scale
        gl.activeTexture(gl.TEXTURE3);
        gl.uniform1i(u_Sampler, 3);
        gl.uniform1i(useTextures, true);// Scale
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
        modelMatrix.translate(-3.5, -0.9, -2.45);
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
        modelMatrix.translate(-1.5, -0.1, -2.45);
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

      //top of cylinders
      pushMatrix(modelMatrix);
        modelMatrix.translate(-3.4, 0.06, -0.4);
        modelMatrix.scale(0.3, 0.08, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-3, 0.06, -0.4);
        modelMatrix.scale(0.3, 0.08, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2, 0.06, -0.4);
        modelMatrix.scale(0.3, 0.08, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.6, 0.06, -0.4);
        modelMatrix.scale(0.3, 0.08, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.5, 0.14, -0.05);
        modelMatrix.scale(2, 0.08, 0.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
      modelMatrix.translate(-3.09, 0.47, -0.05);
        modelMatrix.rotate(31.5,0,0,1);
        modelMatrix.scale(1.42, 0.08, 0.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
      modelMatrix.translate(-1.9, 0.47, -0.05);
        modelMatrix.rotate(-31.5,0,0,1);
        modelMatrix.scale(1.42, 0.08, 0.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      // CREATING THE ROOF
      var n = buildingRoofBuffers(gl, true);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.5, 0.1, -2.1);
        modelMatrix.rotate(180,1,0,0);
        //modelMatrix.rotate(-5,1,0,1);
        modelMatrix.rotate(45,0,0,1);
        modelMatrix.rotate(90,0,1,0);
        modelMatrix.scale(4, 1.8, 1.8); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      gl.uniform1i(useTextures, false);// Scale

      

      
      //CREATE THE CYLINDER
      var n = initCylinderArrayBuffer(gl, false);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      //The stump
      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.5, -1.8, 2.5);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.5, 0.5, 0.2); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //the trunk
      pushMatrix(modelMatrix);
        modelMatrix.translate((0), -0.9, 0);
        
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.2, 0.2, 1.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      
      //branch1
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.4, 0, 0);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.rotate(-45,0,1,0);
        modelMatrix.scale(0.1, 0.1, 0.5); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.6, 0, 0);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.rotate(-80,0,1,0);
        modelMatrix.scale(0.07, 0.07, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      //branch 2
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.3, 0.2, 0);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.rotate(-150,0,1,0);
        modelMatrix.scale(0.09, 0.09, 0.5); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.5, 0.5, 0.1);
        modelMatrix.rotate(-200,1,0,0);
        modelMatrix.rotate(-170,0,1,0);
        modelMatrix.rotate(180,0,0,1);
        modelMatrix.scale(0.05, 0.05, 0.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //branch 3
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0, -0.20);
        modelMatrix.rotate(50,1,0,0);
        modelMatrix.rotate(0,0,1,0);
        modelMatrix.scale(0.07, 0.07, 0.5); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //branch 4
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.2, 0.3);
        modelMatrix.rotate(130,1,0,0);
        //modelMatrix.rotate(-170,0,1,0);
       // modelMatrix.rotate(180,0,0,1);
        modelMatrix.scale(0.05, 0.05, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //second trunk
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -0.2, 0);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.scale(0.13, 0.13, 1.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //trunk 2 branch 1
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.15, 0.8, 0.2);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.rotate(50,0,0,1);
        modelMatrix.rotate(-45,0,1,0);
        modelMatrix.scale(0.06, 0.06, 0.3); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(0.15, 1, 0.3);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.rotate(40,0,1,0);
        modelMatrix.scale(0.04, 0.04, 0.05); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      if(currentTranslation > 3)
      {
        bird_down = true;
      }
      else if(currentTranslation < 0)
      {
        bird_down = false;
      }
      
      //BIRD
      var n = blackCube(gl, "black");
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        
        modelMatrix.translate(-2.5, (-1.46 + currentTranslation), 2.5);
        modelMatrix.rotate(45,0,1,0);
        modelMatrix.scale(0.13, 0.13, 0.15); // Scale
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.5, (-1.34 + currentTranslation), 2.57);
        modelMatrix.scale(0.10, 0.1, 0.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //console.log(currentAngle)
      //WING 1
      pushMatrix(modelMatrix);
        //modelMatrix.rotate(currentAngle,1,0,0);
        modelMatrix.translate(-2.4, (-1.41 + currentTranslation), 2.5);
        modelMatrix.rotate(20-currentAngle,0,0,1);
        modelMatrix.scale(0.13, 0.03, 0.1); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //WING 2
      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.597, (-1.41 + currentTranslation), 2.5);
        modelMatrix.rotate(-20+currentAngle,0,0,1);
        modelMatrix.scale(0.13, 0.03, 0.1); // Scale
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      //LEGS
      var n = blackCube(gl, "orange");
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.45, (-1.55 + currentTranslation), 2.5);
        //modelMatrix.rotate(45,0,1,0);
        modelMatrix.scale(0.03, 0.13, 0.1); // Scale
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.55, (-1.55+currentTranslation), 2.5);
        //modelMatrix.rotate(45,0,1,0);
        modelMatrix.scale(0.03, 0.13, 0.07); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();


      var n = buildingRoofBuffers(gl, false);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      pushMatrix(modelMatrix);
        modelMatrix.translate(-2.5, (-1.34 + currentTranslation), 2.63);
        modelMatrix.rotate(-135,1,0,0);
        modelMatrix.scale(0.1, 0.07, 0.07); // Scale
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
      modelMatrix = popMatrix();

  
      if(fireflies){
        var n = blackCube(gl, "yellow");
        if (n < 0) {
          console.log('Failed to set the vertex information');
          return;
        }

        pushMatrix(modelMatrix);
        modelMatrix.translate(-2.45, (-1.55 + currentTranslation), 2.5);
        //modelMatrix.rotate(45,0,1,0);
        modelMatrix.scale(0.03, 0.13, 0.1); // Scale
        
        drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
        modelMatrix = popMatrix();


      }

  gl.uniform1i(useTextures, false);

  //CREATING THE BENCH
  var n = blackCube(gl, "brown");
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
    modelMatrix.rotate(180,1,0,0);
    modelMatrix.scale(1, 0.2, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();




  gl.uniform1i(useTextures, true);
  
  
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




function loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, texture, u_Sampler, useTextures, bool) {
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		texture.image
	);

  gl.uniform1i(u_Sampler, 0);

  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

var g_last = Date.now();
function animateTranslate(translation) {
  var newTranslation;
  
  if(bird_down)
  {
    newTranslation = translation - 0.05
  }
  else{
    newTranslation = translation + 0.05
  }
  return newTranslation;
}

function animateRotate(angle) {

  //console.log(angle);
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;


  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + WING_STEP;

  //console.log(newAngle);

  return newAngle %= 60;
}

function loadTexture(gl, texture, textureIndex) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
  // Activate texture unit
  gl.activeTexture(textureIndex);
  // Bind the texture object to the target object
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		texture.image
	);

  // Set the image to texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
}

