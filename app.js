import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, mult, rotateX, rotateY } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, pushMatrix, multTranslation, popMatrix, multRotationX, multRotationZ } from "../../libs/stack.js";
import { GUI } from '../../libs/dat.gui.module.js';

import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';

class Axonometric {
    constructor(gamma, theta) {
        /**@type {number} */
        this.gamma = gamma;
        /**@type {number} */
        this.theta = theta;
    }
}

const VP_DISTANCE = 200;

function setup(shaders) {
    /** @type {WebGLRenderingContext} */
    let gl;
    let canvas = document.getElementById("gl-canvas");

    let mode;
    let mView;
    let mProjection;
    let time;

    let axonometric = new Axonometric(315, 35);

    gl = setupWebGL(canvas);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    CYLINDER.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    function resize_canvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        const aspect = canvas.width / canvas.height;
        mProjection = ortho(
            -VP_DISTANCE * aspect, VP_DISTANCE * aspect,
            -VP_DISTANCE, VP_DISTANCE,
            -3 * VP_DISTANCE, 3 * VP_DISTANCE
        );
    }

    function axPerspective() {
        mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
        mView = mult(mView, rotateX(this.theta));
        mView = mult(mView, rotateY(this.gamma));
    }

    // Initialize canvas, mode and view
    resize_canvas();
    mode = gl.TRIANGLES;
    axPerspective();

    //#region GUI
    const gui = new GUI();
    const axView = gui.addFolder("Axonometric View");
    axView.add(axonometric, "theta", 0, 360).onChange(axPerspective);
    axView.add(axonometric, "gamma", 0, 360).onChange(axPerspective);
    axView.open();
    //#endregion

    //#region Events
    window.addEventListener("resize", resize_canvas);

    document.addEventListener("keydown", function (event) {
        switch (event.key) {
            case 'w':
                mode = gl.LINES;
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case '1':
                axPerspective();
                break;
            case '2':
                mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
                break;
            case '3':
                mView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, 1]);
                break;
            case '4':
                mView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
                break;
        }
    });
    //#endregion

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
            multRotationY(time * 500);
            MainRotor();
        popMatrix();
    }

    //#region Body
    function Body() {
        pushMatrix();
            MainBody();
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

    function MainBody() {
        setColor([255, 0, 0]);
        multScale([56, 28, 28]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

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
            multTranslation([26, 7, 0]);
            multRotationZ(time * -500);
            TailRotors();
        popMatrix();
    }

    function TailRotors() {
        pushMatrix();
            multTranslation([0, 0, 6]);
            multRotationX(90);
            TailRotor();
        popMatrix();
        
        pushMatrix();
            multTranslation([0, 0, -6]);
            multRotationX(-90);
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

        gl.uniform4fv(
            gl.getUniformLocation(program, "uLightPos"),
            flatten(mult(mView, [0.0, VP_DISTANCE, 0.0, 1.0]))
        );
        
        loadMatrix(mView);
        
        multRotationY(time * -50);
        multTranslation([100, 0, 0]);
        multRotationX(10);
        multRotationY(90);
        Helicopter();
    }

    window.requestAnimationFrame(render);
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))