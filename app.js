import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, pushMatrix, multTranslation, popMatrix, multRotationX, multRotationZ } from "../../libs/stack.js";

import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as SPHERE from '../../libs/objects/sphere.js';

/** @type {WebGLRenderingContext} */
let gl;
/** @type {WebGLRenderingContextBase} */
let mode;

const HELI_X = 10; // 740
const HELI_Y = 5; // 320
const HELI_Z = HELI_Y;

const VP_DISTANCE = HELI_X;


function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect;
    let mProjection;
    let time;

    gl = setupWebGL(canvas);
    mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    function resize_canvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        aspect = canvas.width / canvas.height;
        mProjection = ortho(
            -VP_DISTANCE * aspect, VP_DISTANCE * aspect,
            -VP_DISTANCE, VP_DISTANCE,
            -3 * VP_DISTANCE, 3 * VP_DISTANCE
        );
    }

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function (event) {
        switch (event.key) {
            case 'w':
                mode = gl.LINES;
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    CYLINDER.init(gl);
    SPHERE.init(gl);

    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    function uploadModelView() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function MainRotor() {
        pushMatrix();
            MainRotorMast();
        popMatrix();

        pushMatrix();
            multTranslation([HELI_X * 0.25, 0, 0]);
            MainRotorBlade();
        popMatrix();

        pushMatrix();
            multRotationY(360 / 3);
            multTranslation([HELI_X * 0.25, 0, 0]);
            MainRotorBlade();
        popMatrix();

        pushMatrix();
            multRotationY(360 / 3 * 2);
            multTranslation([HELI_X * 0.25, 0, 0]);
            MainRotorBlade();
        popMatrix();
    }

    function MainRotorBlade() {
        multScale([HELI_X * 0.5, HELI_Y * 0.06, HELI_Y * 0.15]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function MainRotorMast() {
        multScale([HELI_X * 0.03, HELI_Y * 0.2, HELI_Z * 0.07]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    function TailRotor() {
        

        pushMatrix();
            TailRotorCenter();
        popMatrix();

        pushMatrix();
            multTranslation([HELI_X * 0.05, 0, 0]);
            TailRotorBlade();
        popMatrix();

        pushMatrix();
            multRotationY(360 / 2);
            multTranslation([HELI_X * 0.05, 0, 0]);
            TailRotorBlade();
        popMatrix();
    }

    function TailRotorBlade() {
        multScale([HELI_X * 0.1, HELI_Y * 0.03, HELI_Z * 0.06]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function TailRotorCenter() {
        multScale([HELI_X * 0.02, HELI_Y * 0.1, HELI_Z * 0.047]);
        uploadModelView();
        
        CYLINDER.draw(gl, program, mode);
    }
    
    function LandingSkid() {
        multScale([HELI_X * 0.5, HELI_Y * 0.05, HELI_Z * 0.05]);
        multRotationY(90);
        multRotationX(-90);
        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    function render(t) {
        time = t / 1000;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "mProjection"), false,
            flatten(mProjection)
        );
        
        loadMatrix(lookAt([0, VP_DISTANCE / 2, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
        //loadMatrix(lookAt([0, VP_DISTANCE / 2, 0], [0, 0, 0], [0, 0, 1]));
        //loadMatrix(lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
        
        multRotationY(time * 10);
        TailRotor();
    }

    window.requestAnimationFrame(render);
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))