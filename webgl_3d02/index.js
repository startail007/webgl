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

function radToDeg(r) {
    return r * 180 / Math.PI;
}

function degToRad(d) {
    return d * Math.PI / 180;
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

    var geometry = setGeometry(gl);


    var colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    setColors(gl);


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

        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

        gl.enableVertexAttribArray(colorLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0)
    }

    function drawScene() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var projectionMatrix = m4.perspective(fieldOfViewRadians, gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 2000);

        var radius = 700;
        var cameraMatrix = m4.yRotation(degToRad(angleY));
        cameraMatrix = m4.xRotate(cameraMatrix, degToRad(angleX));
        cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius);

        var viewMatrix = m4.inverse(cameraMatrix);

        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        var rr = 6;
        for (var j = -30; j <= 30; j++) {
            for (var i = -27; i <= 27 - Math.abs(j) % 2; i++) {
                var xx = ((Math.abs(j) % 2) * 0.5 + i) * rr * Math.sqrt(3);
                var yy = 1.5 * j * rr;
                var r = Math.sqrt(xx * xx + yy * yy);
                var t = EasingFunctions.easeOutQuart(1 - Math.min(1, r / 270));
                var matrix = m4.translate(viewProjectionMatrix, xx, t * 20 * (1 + Math.cos(degToRad(2 * r + angleZ))), yy);
                gl.uniformMatrix4fv(matrixLocation, false, matrix);
                gl.drawArrays(gl.TRIANGLES, 0, geometry.length);

            }
        }
        //gl.flush();

    }
}

function setGeometry(gl) {
    var h = 20;
    var r = 5.5;
    var ax0 = r * 0;
    var ax1 = r * Math.sqrt(3) * 0.5;
    var ax2 = r * Math.sqrt(3) * 0.5;
    var ax3 = r * 0;
    var ax4 = r * -Math.sqrt(3) * 0.5;
    var ax5 = r * -Math.sqrt(3) * 0.5;

    var ay0 = r * 1;
    var ay1 = r * 0.5;
    var ay2 = r * -0.5;
    var ay3 = r * -1;
    var ay4 = r * -0.5;
    var ay5 = r * 0.5;

    var positions = new Float32Array([
        // top  
        0, h, 0,
        ax0, h, ay0,
        ax1, h, ay1,

        0, h, 0,
        ax1, h, ay1,
        ax2, h, ay2,

        0, h, 0,
        ax2, h, ay2,
        ax3, h, ay3,

        0, h, 0,
        ax3, h, ay3,
        ax4, h, ay4,

        0, h, 0,
        ax4, h, ay4,
        ax5, h, ay5,

        0, h, 0,
        ax5, h, ay5,
        ax0, h, ay0,

        // bottom

        0, 0, 0,
        ax1, 0, ay1,
        ax0, 0, ay0,

        0, 0, 0,
        ax2, 0, ay2,
        ax1, 0, ay1,

        0, 0, 0,
        ax3, 0, ay3,
        ax2, 0, ay2,

        0, 0, 0,
        ax4, 0, ay4,
        ax3, 0, ay3,

        0, 0, 0,
        ax5, 0, ay5,
        ax4, 0, ay4,

        0, 0, 0,
        ax0, 0, ay0,
        ax5, 0, ay5,

        // a0
        ax0, 0, ay0,
        ax1, 0, ay1,
        ax0, h, ay0,

        ax0, h, ay0,
        ax1, 0, ay1,
        ax1, h, ay1,

        // a1
        ax1, 0, ay1,
        ax2, 0, ay2,
        ax1, h, ay1,

        ax1, h, ay1,
        ax2, 0, ay2,
        ax2, h, ay2,

        // a2
        ax2, 0, ay2,
        ax3, 0, ay3,
        ax2, h, ay2,

        ax2, h, ay2,
        ax3, 0, ay3,
        ax3, h, ay3,

        // a3
        ax3, 0, ay3,
        ax4, 0, ay4,
        ax3, h, ay3,

        ax3, h, ay3,
        ax4, 0, ay4,
        ax4, h, ay4,

        // a4
        ax4, 0, ay4,
        ax5, 0, ay5,
        ax4, h, ay4,

        ax4, h, ay4,
        ax5, 0, ay5,
        ax5, h, ay5,

        // a5
        ax5, 0, ay5,
        ax0, 0, ay0,
        ax5, h, ay5,

        ax5, h, ay5,
        ax0, 0, ay0,
        ax0, h, ay0,

    ]);

    var matrix = m4.xRotation(Math.PI),
        matrix = m4.translate(matrix, 0, -h * 0.5, 0);

    for (var ii = 0; ii < positions.length; ii += 3) {
        var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
    }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return {
        length: positions.length / 3
    };
}

function setColors(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([


            // top
            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

            70, 200, 210,
            70, 200, 210,
            70, 200, 210,

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

            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            200, 200, 70,
            200, 200, 70,
            200, 200, 70,

            // a0
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,
            200, 70, 120,

            // a1
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,
            80, 70, 200,

            // a2
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,
            210, 100, 70,

            // a3
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,
            160, 160, 220,

            // a4
            110, 100, 70,
            110, 100, 70,
            110, 100, 70,
            110, 100, 70,
            110, 100, 70,
            110, 100, 70,

            // a5
            20, 160, 120,
            20, 160, 120,
            20, 160, 120,
            20, 160, 120,
            20, 160, 120,
            20, 160, 120,
        ]),
        gl.STATIC_DRAW);
}

main();