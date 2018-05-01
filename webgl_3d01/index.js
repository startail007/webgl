"use strict";

function shader(gl, vs, fs) {
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vs);
    gl.compileShader(vertShader);

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fs);
    gl.compileShader(fragShader);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    return shaderProgram;
}

function main() {
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    var VSHADER_SOURCE = document.getElementById("3d-vertex-shader").text;
    var FSHADER_SOURCE = document.getElementById("3d-fragment-shader").text;
    
    var program = shader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");
    
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");

    var positionBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    setGeometry(gl);

    var colorBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    
    setColors(gl);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }
    var fieldOfViewRadians = degToRad(60);

    init();
    drawScene();
    loop();
    var angleX = 0;
    var angleY = 0;
    var angleZ = 0;
    var weight = 0;
    canvas.addEventListener('mousemove', (e) => {
        var x = e.clientX;
        var y = e.clientY;
        var xx = gl.canvas.width * 0.5 - x;
        var yy = gl.canvas.height * 0.5 - y;
        weight = (xx > 0 ? 1 : -1) * 4 * EasingFunctions.easeInCubic(Math.min(1, Math.abs(xx) / 100));
        angleX = (yy > 0 ? 1 : -1) * 60 * EasingFunctions.easeInQuad(Math.min(1, Math.abs(yy) / 100));
    });
    var lastRender = new Date();

    function loop() {

        var temp = new Date();
        var delta = temp - lastRender;
        lastRender = temp;
        var fps = (1000 / delta).toFixed(0);
        document.getElementById('fps').innerHTML = fps + " fps";

        requestAnimationFrame(loop);
        angleY += weight;
        angleY %= 360;
        angleZ += 5;
        angleZ %= 360;
        drawScene();
    }

    function init() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(program);

        gl.enableVertexAttribArray(positionLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(colorLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0)
    }

    // Draw the scene.
    function drawScene() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var projectionMatrix = m4.perspective(fieldOfViewRadians, gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 2000);

        var radius = 500;
        var cameraMatrix = m4.yRotation(degToRad(angleY));
        cameraMatrix = m4.xRotate(cameraMatrix, degToRad(angleX));
        cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius);

        var viewMatrix = m4.inverse(cameraMatrix);

        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        for (var i = -200; i <= 200; i += 4) {
            for (var j = -200; j <= 200; j += 4) {
                var r = Math.sqrt(i * i + j * j);
                var t = EasingFunctions.easeOutQuart(1 - Math.min(1, r / 200));
                var matrix = m4.translate(viewProjectionMatrix, i, t * 20 * Math.cos(degToRad(5 * r + angleZ)), j);
                /*matrix = m4.xRotate(matrix, Math.PI*2*Math.random());
                matrix = m4.yRotate(matrix, Math.PI*2*Math.random());
                matrix = m4.zRotate(matrix, Math.PI*2*Math.random());*/
                //var matrix = viewProjectionMatrix;

                gl.uniformMatrix4fv(matrixLocation, false, matrix);

                gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
            }
        }
        //gl.flush();

    }
}

function setGeometry(gl) {
    var w = 4;
    var d = 4;
    var h = 12;
    var positions = new Float32Array([
        // front
        0, 0, 0,
        0, h, 0,
        w, 0, 0,
        0, h, 0,
        w, h, 0,
        w, 0, 0,

        // back
        0, 0, d,
        w, 0, d,
        0, h, d,
        0, h, d,
        w, 0, d,
        w, h, d,

        // top
        0, 0, 0,
        w, 0, 0,
        w, 0, d,
        0, 0, 0,
        w, 0, d,
        0, 0, d,

        // bottom
        0, h, 0,
        0, h, d,
        w, h, d,
        0, h, 0,
        w, h, d,
        w, h, 0,

        // left
        0, 0, 0,
        0, 0, d,
        0, h, d,
        0, 0, 0,
        0, h, d,
        0, h, 0,

        // right
        w, 0, 0,
        w, h, 0,
        w, h, d,
        w, 0, 0,
        w, h, d,
        w, 0, d
    ]);

    var matrix = m4.xRotation(Math.PI),
        matrix = m4.translate(matrix, -w * 0.5, -h * 0.5, -d * 0.5);

    for (var ii = 0; ii < positions.length; ii += 3) {
        var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
    }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            // front
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // back
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // top
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            // bottom
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // left
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,

            // right
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220
        ]),
        gl.STATIC_DRAW);
}

main();