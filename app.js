import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, pushMatrix, multTranslation, popMatrix, multRotationX, multRotationZ } from "../../libs/stack.js";

import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';

/** @type {WebGLRenderingContext} */
let gl;
/** @type {WebGLRenderingContextBase} */
let mode;

const VP_DISTANCE = 100;
const VP_SQRT_DISTANCE = Math.sqrt(VP_DISTANCE);

let perspective = lookAt([VP_SQRT_DISTANCE, VP_SQRT_DISTANCE, VP_SQRT_DISTANCE], [0, 0, 0], [0, 1, 0]);

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
            case '1':
                perspective = lookAt([VP_SQRT_DISTANCE, VP_SQRT_DISTANCE, VP_SQRT_DISTANCE], [0, 0, 0], [0, 1, 0]);
                break;
            case '2':
                perspective = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
                break;
            case '3':
                perspective = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, 1]);
                break;
            case '4':
                perspective = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    CYLINDER.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);

    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    function uploadModelView() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function setColor(v) {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), v)
    }

    //#region Helicopter
    function Helicopter() {
        pushMatrix();
            Body();
        popMatrix();

        pushMatrix();
            multTranslation([3, 18, 0]);
            MainRotor();
        popMatrix();
            
        pushMatrix();
            multTranslation([0, -24, 0]);
            LandingSkids();
        popMatrix();
            
        pushMatrix();
            multTranslation([40, 6, 0]);
            TailBoom();
        popMatrix();
    }

    //#region Body
    function Body() {
        setColor([255, 0, 0]);
        multScale([56, 28, 28]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }
    //#endregion

    //#region Main Rotor
    function MainRotor() {
        pushMatrix();
            MainRotorMast();
        popMatrix();

        pushMatrix();
            multTranslation([25, 0, 0]);
            MainRotorBlade();
        popMatrix();

        pushMatrix();
            multRotationY(360 / 3);
            multTranslation([25, 0, 0]);
            MainRotorBlade();
        popMatrix();

        pushMatrix();
            multRotationY(360 / 3 * 2);
            multTranslation([25, 0, 0]);
            MainRotorBlade();
        popMatrix();
    }

    function MainRotorBlade() {
        setColor([127, 127, 127]);
        multScale([50, 3, 6]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function MainRotorMast() {
        setColor([255, 0, 0]);
        multScale([3, 10, 3]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }
    //#endregion

    //#region Landing Skids
    function LandingSkids() {
        pushMatrix();
            multTranslation([0, 0, 16]);
            multRotationX(-30);
            LandingSkid();
        popMatrix();

        pushMatrix();
            multTranslation([0, 0, -16]);
            multRotationX(30);
            LandingSkid();
        popMatrix();
    }
    
    function LandingSkid() {
        pushMatrix();
            Skid();
        popMatrix();
        
        pushMatrix();
            multRotationZ(-10);
            multTranslation([-12, 6, 0]);
            SkidArm();
        popMatrix();
        
        pushMatrix();
            multRotationZ(10);
            multTranslation([12, 6, 0]);
            SkidArm();
        popMatrix();
    }

    function SkidArm() {
        setColor([255, 183, 0]);
        multScale([2, 16, 2]);
        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    function Skid() {
        setColor([255, 183, 0]);
        multScale([50, 2, 2]);
        multRotationZ(90);
        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }
    //#endregion

    //#region Tail Boom
    function TailBoom() {
        pushMatrix();
            TailBoomLarge();
        popMatrix();

        pushMatrix();
            multTranslation([26, 7, 0]);
            TailBoomSmall();
        popMatrix();

        pushMatrix();
            multTranslation([26, 7, 6]);
            multRotationX(90);
            TailRotor();
        popMatrix();
    }

    function TailBoomLarge() {
        setColor([255, 0, 0]);
        multScale([52, 8, 8]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function TailBoomSmall() {
        setColor([255, 0, 0]);
        multRotationZ(60);
        multScale([15, 8, 8]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    //#region Tail Rotor
    function TailRotor() {
        pushMatrix();
            TailRotorMast();
        popMatrix();

        pushMatrix();
            multTranslation([5, 0, 0]);
            TailRotorBlade();
        popMatrix();

        pushMatrix();
            multRotationY(360 / 2);
            multTranslation([5, 0, 0]);
            TailRotorBlade();
        popMatrix();
    }

    function TailRotorBlade() {
        setColor([127, 127, 127]);
        multScale([10, 1, 3]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function TailRotorMast() {
        setColor([255, 0, 0]);
        multScale([2, 5, 2]);
        uploadModelView();
        
        CYLINDER.draw(gl, program, mode);
    }
    //#endregion
    
    //#endregion
    
    //#endregion

    function render(t) {
        time = t / 1000;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "mProjection"), false,
            flatten(mProjection)
        );
        
        loadMatrix(perspective);
        
        //multRotationY(time * 10);
        multScale([-1, 1, 1]);
        Helicopter();
    }

    window.requestAnimationFrame(render);
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))