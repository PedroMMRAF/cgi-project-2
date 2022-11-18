import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, mult, rotateX, rotateY, inverse, transpose, mat4 } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, pushMatrix, multTranslation, popMatrix, multRotationX, multRotationZ } from "../../libs/stack.js";
import { GUI } from '../../libs/dat.gui.module.js';

import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';

/** @type {WebGLRenderingContext} */
let gl;
let program;
let mode, time, axonometric;
let mView, mProjection;

let heli = {
    rotation: 0,
    vertical: 0,
}

const UNITS_METER = 10;
const VP_DISTANCE = 200;

function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);
    gl.clearColor(0.30, 0.42, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    CYLINDER.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);

    axonometric = {
        theta: 25,
        gamma: -45,
        scale: 0.75,
    };

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    resize_canvas();
    mode = gl.TRIANGLES;

    const gui = new GUI();
    const axView = gui.addFolder("Axonometric View");
    axView.add(axonometric, "theta", -180, 180).listen();
    axView.add(axonometric, "gamma", -180, 180).listen();
    axView.add(axonometric, "scale", 0.5, 3);
    axView.open();

    function resize_canvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        const aspect = canvas.width / canvas.height;
        mProjection = ortho(
            -VP_DISTANCE * aspect, VP_DISTANCE * aspect,
            -VP_DISTANCE, VP_DISTANCE,
            -4 * VP_DISTANCE, 4 * VP_DISTANCE
        );
    }

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
                axonometric.theta = 25;
                axonometric.gamma = -45;
                break;
            case '2':
                axonometric.theta = 0;
                axonometric.gamma = 0;
                break;
            case '3':
                axonometric.theta = 90;
                axonometric.gamma = 0;
                break;
            case '4':
                axonometric.theta = 0;
                axonometric.gamma = 90;
                break;
        }
    });
    //#endregion

    function uploadModelView() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mInvModelView"), false,
                            flatten(transpose(inverse(modelView()))));
    }

    function uploadColor(v) {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), v.map(x => x/255))
    }

    function Scene() {
        pushMatrix();
            multRotationY(time * -50);
            multTranslation([200, 50, 0]);
            multRotationX(10);
            multRotationY(90);
            Helicopter();
        popMatrix();

        pushMatrix();
            multTranslation([0,0,0]);
            Floor();
        popMatrix();

        pushMatrix();
            EiffelTower();
        popMatrix();
    }

    //#region EiffelTower
    function EiffelTower() {
        uploadColor([207, 144, 63]);
        multTranslation([0, 25, 0]);
        
        for (let i = 0; i < 4; i++) {
            pushMatrix();
                multRotationY(90 * i);
                multTranslation([40, 0, -40]);
                EiffelLeg()
            popMatrix();
        }

        pushMatrix();
            multTranslation([0, 250, 0]);
            EiffelTop()
        popMatrix();
    }

    function EiffelLeg() {
        pushMatrix();   
            EiffelLegP1();
        popMatrix();

        pushMatrix();
            multTranslation([-35.5, 23, 8]);
            EiffelFloor1();
        popMatrix();

        multTranslation([-14, 52, 14]);

        pushMatrix();
            EiffelLegP2();
        popMatrix();

        pushMatrix();
            multTranslation([-24.5, 23, 2]);
            EiffelFloor2();
        popMatrix();

        multTranslation([-12, 106, 12]);

        pushMatrix();
            EiffelLegP3();
        popMatrix();
    }

    function EiffelLegP1() {
        multRotationZ(20);
        multRotationX(20);
        multScale([15, 60, 15]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function EiffelLegP2() {
        multRotationZ(10);
        multRotationX(10);
        multScale([15, 60, 15]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function EiffelLegP3() {
        multRotationZ(5);
        multRotationX(5);
        multScale([15, 160, 15]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function EiffelFloor1() {
        multScale([70, 15, 15]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function EiffelFloor2() {
        multScale([60, 15, 15]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function EiffelTop() {
        multScale([15, 40, 15]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }
    //#endregion

    //#region Floor
    function Floor() {
        pushMatrix();
            BaseFloor();
        popMatrix();

        pushMatrix();
            RoundaboutOuter();
        popMatrix();

        pushMatrix();
            RoundaboutInner();
        popMatrix();

        pushMatrix();
            RoundaboutStripes();
        popMatrix();
    }

    function BaseFloor() {
        uploadColor([70, 70, 70]);
        multScale([800, 5, 800]);
        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    function RoundaboutOuter() {
        uploadColor([10, 10, 10]);
        multScale([500, 6, 500]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function RoundaboutInner() {
        uploadColor([162, 173, 21]);
        multScale([300, 7, 300]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function RoundaboutStripes() {
        for (let i = 0; i < 360; i += 40) {
            pushMatrix();
                multRotationY(i);
                multTranslation([0, 0, 200]);
                RoundaboutStripe();
            popMatrix();
        }
    }

    function RoundaboutStripe() {
        uploadColor([240, 240, 240]);
        multScale([50, 7, 7]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    //#endregion

    //#region Helicopter
    function Helicopter() {
        pushMatrix();
            Body();
        popMatrix();

        pushMatrix();
            multTranslation([3, 18, 0]);
            multRotationY(time * 2000);
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
        uploadColor([255, 0, 0]);
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
        uploadColor([255, 183, 0]);
        multScale([2, 16, 2]);
        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    function Skid() {
        uploadColor([255, 183, 0]);
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
            multRotationZ(time * -2000);
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
        uploadColor([255, 0, 0]);
        multScale([52, 8, 8]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function TailBoomSmall() {
        uploadColor([255, 0, 0]);
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
        uploadColor([127, 127, 127]);
        multScale([10, 1, 3]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function TailRotorMast() {
        uploadColor([255, 0, 0]);
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
        uploadColor([127, 127, 127]);
        multScale([50, 3, 6]);
        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }

    function MainRotorMast() {
        uploadColor([255, 0, 0]);
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

        // Camera projection
        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "mProjection"), false,
            flatten(mProjection)
        );

        loadMatrix(lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
        multRotationX(axonometric.theta);
        multRotationY(axonometric.gamma);
        multScale([axonometric.scale, axonometric.scale, axonometric.scale]);

        // Light direction
        gl.uniform4fv(
            gl.getUniformLocation(program, "uLightDir"),
            flatten(mult(modelView(), [0, 5, 2, 0.0]))
        );

        Scene();
    }

    window.requestAnimationFrame(render);
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))