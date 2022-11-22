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

        pushMatrix();
            Roads();
        popMatrix();

        pushMatrix();
            Garden();
        popMatrix();

        pushMatrix();
            Building();
        popMatrix();

        pushMatrix();
            Cars();
        popMatrix();
        
        pushMatrix();
            ParkingLot();
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
        multScale([500, 7, 500]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function RoundaboutInner() {
        uploadColor([162, 173, 21]);
        multScale([300, 8, 300]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function RoundaboutStripes() {
        for (let i = 0; i < 360; i += 40) {
            pushMatrix();
                multRotationY(i);
                multTranslation([0, 0, 200]);
                Stripe();
            popMatrix();
        }
    }

    function Stripe() {
        uploadColor([240, 240, 240]);
        multScale([50, 8, 7]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function Roads(){
        pushMatrix();
            Road();
        popMatrix();
        pushMatrix();
            multRotationY(90);
            Road();
        popMatrix();
        pushMatrix();
            RoadStripes();
        popMatrix();
    }

    function Road(){
        uploadColor([10, 10, 10]);
        multScale([150, 7, 800]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function RoadStripes(){
        pushMatrix();
            multTranslation([-370, 0, 0]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([-270, 0, 0]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([270, 0, 0]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([370, 0, 0]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0, -370]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0, -270]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0, 270]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0, 370]);
            multRotationY(90);
            Stripe();
        popMatrix();
    }

    function Garden(){
        pushMatrix();
            GardenGrass();
        popMatrix();
        pushMatrix();
            Lake();
        popMatrix();
        pushMatrix();
            Trees();
        popMatrix();
    }

    function GardenGrass(){
        uploadColor([162, 173, 21]);
        multTranslation([200, 0, 200]);
        multScale([400, 6, 400]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function Lake(){
        uploadColor([0, 102, 170]);
        multTranslation([265, 0, 275]);
        multScale([200, 7, 200]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function Trees(){
        pushMatrix();
            multTranslation([350, 0, 150]);
            Tree();
        popMatrix();
        pushMatrix();
            multTranslation([150, 0, 350]);
            Tree();
        popMatrix();
    }

    function Tree(){
        pushMatrix();
            Log();
        popMatrix();
        pushMatrix();
            Leaves();
        popMatrix();

    }

    function Log(){
        uploadColor([202, 83, 2]);
        multTranslation([0, 35, 0]);
        multScale([10, 70, 10]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)

    }

    function Leaves(){
        uploadColor([126, 185, 3]);
        multTranslation([0, 70, 0]);
        multScale([70, 55, 70]);
        uploadModelView();

        SPHERE.draw(gl, program, mode)

    }
    function Building(){
        pushMatrix();
            Structure();
        popMatrix();
        pushMatrix();
            Windows();
        popMatrix();
        pushMatrix();
            BuildingDoor();
        popMatrix();
        pushMatrix();
            Heliport()
        popMatrix();
        
    }

    function Structure(){
        uploadColor([46, 47, 52]);
        multTranslation([-230, 110, 300]);
        multScale([120, 220, 120]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function Windows(){
        pushMatrix();
            multTranslation([-170, 180, 340]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 180, 300]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 180, 260]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 130, 340]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 130, 300]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 130, 260]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 80, 340]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 80, 300]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-170, 80, 260]);
            Window();
        popMatrix();
    }

    function Window(){
        uploadColor([255, 253, 141]);
        multRotationZ(90);
        multScale([30, 1, 20]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function BuildingDoor(){
        uploadColor([171, 108, 80]);
        multTranslation([-170, 20, 300])
        multRotationZ(90);
        multScale([40, 1, 30]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function Heliport(){
        pushMatrix();
            multTranslation([-230, 220, 300]);
            HeliPortOuterCircle();
        popMatrix();
        pushMatrix();
            multTranslation([-230, 220, 300]);
            HeliPortInnerCircle();
        popMatrix();
        pushMatrix();
            multTranslation([-230, 220, 300]);
            HeliportHorizontalStripe();
        popMatrix();
        pushMatrix();
            multTranslation([-230, 220, 280]);
            HeliportVerticalStripe();
        popMatrix();
        pushMatrix();
            multTranslation([-230, 220, 320]);
            HeliportVerticalStripe();
        popMatrix();
        
    }

    function HeliPortOuterCircle(){
        uploadColor([254, 254, 254]);
        multScale([120, 1, 120]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function HeliPortInnerCircle(){
        uploadColor([28, 28, 28]);
        multScale([100, 2, 100]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function HeliportHorizontalStripe(){
        uploadColor([254, 254, 254]);
        multScale([10, 3, 40]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function HeliportVerticalStripe(){
        uploadColor([254, 254, 254]);
        multRotationY(90);
        multScale([10, 3, 60]);
        uploadModelView();

        CUBE.draw(gl, program, mode)
    }

    function Cars(){
        pushMatrix();
            multTranslation([0,0,-160]);
            RedCar();
        popMatrix();
        pushMatrix();
            multTranslation([55,0,-160]);
            BlueCar();
        popMatrix();
        pushMatrix();
            multTranslation([-55,0,-160]);
            GreenCar();
        popMatrix();
        pushMatrix();
            multTranslation([-110,0,-160]);
            RedCar();
        popMatrix();
        pushMatrix();
            multTranslation([160,0,-515]);
            multRotationY(-90);
            BlueCar();
        popMatrix();
        pushMatrix();
            multTranslation([160,0,-570]);
            multRotationY(-90);
            GreenCar();
        popMatrix();
        pushMatrix();
            multTranslation([160,0,-460]);
            multRotationY(-90);
            RedCar();
        popMatrix();
        pushMatrix();
            multTranslation([80,0,-245]);
            multRotationY(-90);
            BlueCar();
        popMatrix();
        pushMatrix();
            multTranslation([-235,0,-80]);
            RedCar();
        popMatrix();
        pushMatrix();
            multTranslation([-80,0,250]);
            multRotationY(90);
            GreenCar();
        popMatrix();
        pushMatrix();
            multTranslation([40,0,-245]);
            multRotationY(200);
            BlueCar();
        popMatrix();
        pushMatrix();
            multTranslation([25,0,200]);
            multRotationY(25);
            GreenCar();
        popMatrix();
        pushMatrix();
            multTranslation([250,0,100]);
            multRotationY(180);
            RedCar();
        popMatrix();
    }
    function GreenCar(){
        pushMatrix();
            CarWheels();
        popMatrix();
        pushMatrix();
            uploadColor([37, 101, 37]);
            multTranslation([288, 17, -212]);
            CarLowerBody();
        popMatrix();
        pushMatrix();
            uploadColor([37, 101, 37]);
            multTranslation([288, 27, -212]);
            CarUpperBody();
        popMatrix();
        pushMatrix();
            CarHeadlights();
        popMatrix();
    }


    function RedCar(){
        pushMatrix();
            CarWheels();
        popMatrix();
        pushMatrix();
            uploadColor([222, 0, 0]);
            multTranslation([288, 17, -212]);
            CarLowerBody();
        popMatrix();
        pushMatrix();
            uploadColor([222, 0, 0]);
            multTranslation([288, 27, -212]);
            CarUpperBody();
        popMatrix();
        pushMatrix();
            CarHeadlights();
        popMatrix();
    }
    function BlueCar(){
        pushMatrix();
            CarWheels();
        popMatrix();
        pushMatrix();
            uploadColor([0, 0, 255]);
            multTranslation([288, 17, -212]);
            CarLowerBody();
        popMatrix();
        pushMatrix();
            uploadColor([0, 0, 255]);
            multTranslation([288, 27, -212]);
            CarUpperBody();
        popMatrix();
        pushMatrix();
            CarHeadlights();
        popMatrix();
    }

    function CarHeadlights(){
        pushMatrix();
            multTranslation([280, 17, -187]);
            CarHeadlight();
        popMatrix();
        pushMatrix();
            multTranslation([296, 17, -187]);
            CarHeadlight();
        popMatrix();
    }

    function CarHeadlight(){
        uploadColor([255, 253, 141]);
        multRotationX(90);
        multScale([5,1,5]);
        uploadModelView();

        CYLINDER.draw(gl ,program, mode);
    }

    function CarUpperBody(){
        multRotationY(90);
        multScale([22,10,25]);
        uploadModelView();

        CUBE.draw(gl,program,mode)
    }

    function CarLowerBody(){
        multRotationY(90);
        multScale([50,15,25]);
        uploadModelView();

        CUBE.draw(gl,program,mode)
    }

    function CarWheels(){
        pushMatrix();
            multTranslation([300, 8, -200]);
            CarWheel();
        popMatrix();
        pushMatrix();
            multTranslation([276, 8, -200]);
            CarWheel();
        popMatrix();
        pushMatrix();
            multTranslation([300, 8, -225]);
            CarWheel();
        popMatrix();
        pushMatrix();
            multTranslation([276, 8, -225]);
            CarWheel();
        popMatrix();
    }

    function CarWheel(){
        uploadColor([51, 45, 47]);
        multRotationZ(90);
        multScale([10,5,10]);
        uploadModelView();

        CYLINDER.draw(gl, program, mode)
    }

    function ParkingLot(){
        pushMatrix();
            multTranslation([365, 0, -374]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([310, 0, -374]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([255, 0, -374]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([200, 0, -374]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([145, 0, -374]);
            multRotationY(90);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([375, 0, -310]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([375, 0, -255]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([375, 0, -200]);
            Stripe();
        popMatrix();
        pushMatrix();
            multTranslation([375, 0, -145]);
            Stripe();
        popMatrix();
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