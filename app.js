import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, mult, rotateX, rotateY, inverse, transpose, mat4, vec2, perspective, vec4, vec3, translate } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, pushMatrix, multTranslation, popMatrix, multRotationX, multRotationZ } from "../../libs/stack.js";
import { GUI } from '../../libs/dat.gui.module.js';

import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';

/** @type {WebGLRenderingContext} */
let gl;
let program;
let mode, time, delta, axonometric, aspect;
let mProjection, mView, invView, isPerspective;

let heli = {
    horz: {
        pos: 0,
        speed: 0,
        accel: 0,
    },
    vert: {
        pos: 24,
        speed: 0,
        accel: 0,
    },
    rotor: {
        pos: 0,
        speed: 0,
        accel: 0,
    },
    height: 0,
    lifting: false,
    coords: vec3(),
    forward: vec3(),
}

const GROUND_HEIGHT = 5;

const VP_DISTANCE = 400;

const RED = [1.00, 0.00, 0.00];
const BLUE = [0.00, 0.00, 1.00];
const DARK_GREEN = [0.15, 0.40, 0.15];
const LIGHT_YELLOW = [1.00, 1.00, 0.55];
const GOLD_YELLOW = [1.00, 0.72, 0.00];
const WHITE = [1.00, 1.00, 1.00];
const GRAY = [0.50, 0.50, 0.50];
const DARK_GRAY = [0.20, 0.20, 0.20];
const FLOOR_GRAY = [0.27, 0.27, 0.27];
const EIFFEL_COLOR = [0.81, 0.56, 0.25];
const ROOF_COLOR = [0.75, 0.42, 0.34];


function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);
    gl.clearColor(0.30, 0.42, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    CYLINDER.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);
    PYRAMID.init(gl);

    axonometric = {
        theta: 25,
        gamma: -45,
    };

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    resizeCanvas();
    setAxonometric();
    orthoProj();
    mode = gl.TRIANGLES;

    const gui = new GUI();
    const axView = gui.addFolder("Axonometric View");
    axView.add(axonometric, "theta", -180, 180).onChange(setAxonometric);
    axView.add(axonometric, "gamma", -180, 180).onChange(setAxonometric);
    axView.open();

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        aspect = canvas.width / canvas.height;
        if (axonometric.active)
            orthoProj();
        else
            perspProj();
    }

    function calcInvView() {
        invView = inverse(mView);
    }

    function setAxonometric() {
        mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
        mView = mult(mView, rotateX(axonometric.theta));
        mView = mult(mView, rotateY(axonometric.gamma));
        calcInvView();
    }

    function orthoProj() {
        isPerspective = false;
        mProjection = ortho(
            -VP_DISTANCE * aspect, VP_DISTANCE * aspect,
            -VP_DISTANCE, VP_DISTANCE,
            -4 * VP_DISTANCE, 4 * VP_DISTANCE
        );
    }

    function perspProj() {
        isPerspective = true;
        mProjection = perspective(80, aspect, 1, -2 * VP_DISTANCE);
    }

    window.addEventListener("resize", resizeCanvas);

    document.addEventListener("keydown", function (event) {
        switch (event.key) {
            case 'w':
                mode = gl.LINES;
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case 'ArrowLeft':
                heli.horz.accel = 10;
                break;
            case 'ArrowDown':
                heli.vert.accel = -10;
                break;
            case 'ArrowUp':
                heli.lifting = true;
                heli.vert.accel = 10;
                break;
            case '1':
                gui.show();
                setAxonometric();
                orthoProj();
                break;
            case '2':
                gui.hide();
                mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
                calcInvView();
                orthoProj();
                break;
            case '3':
                gui.hide();
                mView = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, 1]);
                calcInvView();
                orthoProj();
                break;
            case '4':
                gui.hide();
                mView = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]);
                calcInvView();
                orthoProj();
                break;
            case '5':
                gui.hide();
                perspProj();
                break;
        }
    });

    document.addEventListener("keyup", function (event) {
        switch (event.key) {
            case 'ArrowLeft':
                heli.horz.accel = 0;
                break;
            case 'ArrowUp':
                heli.lifting = false;
            case 'ArrowDown':
                heli.vert.accel = 0;
                break;
        }
    })

    function uploadModelView() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false,
                            flatten(modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mInvModelView"), false,
                            flatten(transpose(inverse(modelView()))));
    }

    function uploadColor(color) {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), color);
    }

    //#region Eiffel Tower
    function EiffelTower() {
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
        Cube(EIFFEL_COLOR);
    }

    function EiffelLegP2() {
        multRotationZ(10);
        multRotationX(10);
        multScale([15, 60, 15]);
        Cube(EIFFEL_COLOR);
    }

    function EiffelLegP3() {
        multRotationZ(5);
        multRotationX(5);
        multScale([15, 160, 15]);
        Cube(EIFFEL_COLOR);
    }

    function EiffelFloor1() {
        multScale([70, 15, 15]);
        Cube(EIFFEL_COLOR);
    }

    function EiffelFloor2() {
        multScale([60, 15, 15]);
        Cube(EIFFEL_COLOR);
    }

    function EiffelTop() {
        multScale([15, 40, 15]);
        Cube(EIFFEL_COLOR);
    }
    //#endregion

    //#region Decorations
    function Decorations() {
        pushMatrix();
            Floor();
        popMatrix();

        pushMatrix();
            Roundabout();
        popMatrix();

        pushMatrix();
            Roads();
        popMatrix();

        pushMatrix();
            multTranslation([200, 0, 200]);
            Garden();
        popMatrix();

        pushMatrix();
            multTranslation([-230, 110, 300]);
            Building();
        popMatrix();

        pushMatrix();
            Cars();
        popMatrix();
        
        pushMatrix();
            multTranslation([285, 0, -285]);
            ParkingLot();
        popMatrix();

        pushMatrix();
            multTranslation([100,0,-230]);
            multRotationY(40);
            House();
        popMatrix();
    }

    function Floor() {
        multScale([800, GROUND_HEIGHT, 800]);
        Cube(FLOOR_GRAY);
    }

    function Stripe() {
        multScale([50, 8, 7]);
        Cube(WHITE);
    }
    //#endregion

    //#region Roundabout
    function Roundabout() {
        pushMatrix();
            RoundaboutRoad();
        popMatrix();

        pushMatrix();
            RoundaboutGrass();
        popMatrix();

        pushMatrix();
            RoundaboutStripes();
        popMatrix();
    }

    function RoundaboutRoad() {
        multScale([500, 7, 500]);
        Cylinder([0.04, 0.04, 0.04]);
    }

    function RoundaboutGrass() {
        multScale([300, 8, 300]);
        Cylinder([0.64, 0.68, 0.08]);
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
    //#endregion

    //#region Roads
    function Roads(){
        pushMatrix();
            Road();
        popMatrix();

        pushMatrix();
            multRotationY(90);
            Road();
        popMatrix();
    }

    function Road(){
        pushMatrix();
            multScale([800, 7, 150]);
            Cube([0.04, 0.04, 0.04]);
        popMatrix();

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
    }

    function Cars(){
        pushMatrix();
            multTranslation([-40, 0, -300]);
            Car(RED);
        popMatrix();

        pushMatrix();
            multTranslation([300, 0, -40]);
            multRotationY(-90);
            Car(BLUE);
        popMatrix();

        pushMatrix();
            multTranslation([-300, 0, 40]);
            multRotationY(90);
            Car(DARK_GREEN);
        popMatrix();

        pushMatrix();
            multTranslation([40, 0, 300]);
            multRotationY(180);
            Car(RED);
        popMatrix();
    }
    //#endregion

    //#region Garden
    function Garden() {
        pushMatrix();
            GardenGrass();
        popMatrix();

        pushMatrix();
            multTranslation([65, 0, 75]);
            Lake();
        popMatrix();

        pushMatrix();
            Trees();
        popMatrix();
    }

    function GardenGrass(){
        multScale([400, 6, 400]);
        Cube([0.64, 0.68, 0.08]);
    }

    function Lake(){
        multScale([200, 7, 200]);
        Cylinder([0.00, 0.40, 0.67])
    }

    function Trees(){
        pushMatrix();
            multTranslation([150, 0, -50]);
            Tree();
        popMatrix();

        pushMatrix();
            multTranslation([-50, 0, 150]);
            Tree();
        popMatrix();
    }

    function Tree(){
        pushMatrix();
            multTranslation([0, 35, 0]);
            Log();
        popMatrix();
        
        pushMatrix();
            multTranslation([0, 70, 0]);
            Leaves();
        popMatrix();
    }

    function Log(){
        multScale([10, 70, 10]);
        Cylinder([0.79, 0.33, 0.01]);
    }

    function Leaves(){
        multScale([70, 55, 70]);
        Sphere([0.49, 0.73, 0.01]);
    }
    //#endregion

    //#region Building
    function Building(){
        pushMatrix();
            Structure();
        popMatrix();

        pushMatrix();
            multTranslation([60, 70, 40]);
            Windows();
        popMatrix();

        pushMatrix();
            multTranslation([60, -90, 0]);
            BuildingDoor();
        popMatrix();

        pushMatrix();
            multTranslation([0, 110, 0]);
            Heliport()
        popMatrix();
        
    }

    function Structure(){
        multScale([120, 220, 120]);
        Cube(DARK_GRAY);
    }

    function Windows(){
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                pushMatrix();
                    multTranslation([0, -50 * y, -40 * z]);
                    Window();
                popMatrix();
            }
        }
    }

    function Window(){
        multRotationZ(90);
        multScale([30, 1, 20]);
        Cube(LIGHT_YELLOW);
    }

    function BuildingDoor(){
        multRotationZ(90);
        multScale([40, 1, 30]);
        Cube([0.67, 0.42, 0.31]);
    }

    function Heliport(){
        pushMatrix();
            HeliPortOuterCircle();
        popMatrix();

        pushMatrix();
            HeliPortInnerCircle();
        popMatrix();

        pushMatrix();
            HeliportHorizontalStripe();
        popMatrix();

        pushMatrix();
            multTranslation([0, 0, -20]);
            HeliportVerticalStripe();
        popMatrix();

        pushMatrix();
            multTranslation([0, 0, 20]);
            HeliportVerticalStripe();
        popMatrix();
        
    }

    function HeliPortOuterCircle(){
        multScale([120, 1, 120]);
        Cylinder(WHITE);
    }

    function HeliPortInnerCircle(){
        multScale([100, 2, 100]);
        Cylinder([0.11, 0.11, 0.11]);
    }

    function HeliportHorizontalStripe(){
        multScale([10, 3, 40]);
        Cube(WHITE);
    }

    function HeliportVerticalStripe(){
        multRotationY(90);
        multScale([10, 3, 60]);
        Cube(WHITE);
    }
    //#endregion

    //#region Parking Lot
    const PARKED_X = [
        RED, DARK_GREEN, null
    ]

    const PARKED_Z = [
        DARK_GREEN, BLUE, RED
    ]

    function ParkingLot(){
        for (let i = 0; i < 4; i++) {
            pushMatrix();
                multTranslation([30 - i * 60, 0, -90]);
                multRotationY(90);
                Stripe();
            popMatrix();
        }

        for (let i = 0; i < 3; i++) {
            if (!PARKED_X[i]) continue;

            pushMatrix();
                multTranslation([i * -60, 0, -90]);
                Car(PARKED_X[i]);
            popMatrix();
        }

        for (let i = 0; i < 4; i++) {
            pushMatrix();
                multTranslation([90, 0, -30 + i * 60]);
                Stripe();
            popMatrix();
        }

        for (let i = 0; i < 3; i++) {
            if (!PARKED_Z[i]) continue;

            pushMatrix();
                multTranslation([90, 0, i * 60]);
                multRotationY(-90);
                Car(PARKED_Z[i]);
            popMatrix();
        }
    }
    //#endregion

    //#region Car
    function Car(color) {
        multTranslation([0, 17, 0]);

        pushMatrix();
            CarWheels();
        popMatrix();

        pushMatrix();
            multRotationY(90);
            CarBody(color);
        popMatrix();

        pushMatrix();
            CarHeadlights();
        popMatrix();
    }

    function CarHeadlights(){
        pushMatrix();
            multTranslation([-8, 0, 25]);
            CarHeadlight();
        popMatrix();

        pushMatrix();
            multTranslation([8, 0, 25]);
            CarHeadlight();
        popMatrix();
    }

    function CarHeadlight(){
        multRotationX(90);
        multScale([5, 1, 5]);
        Cylinder(LIGHT_YELLOW);
    }

    function CarBody(color) {
        pushMatrix();
            CarLowerBody(color);
        popMatrix();

        pushMatrix();
            multTranslation([0, 10, 0]);
            CarUpperBody(color);
        popMatrix();
    }

    function CarUpperBody(color) {
        multScale([22, 10, 25]);
        Cube(color);
    }

    function CarLowerBody(color) {
        multScale([50, 15, 25]);
        Cube(color);
    }

    function CarWheels(){
        pushMatrix();
            multTranslation([12, -8, 12]);
            CarWheel();
        popMatrix();

        pushMatrix();
            multTranslation([-12, -8, 12]);
            CarWheel();
        popMatrix();

        pushMatrix();
            multTranslation([12, -8, -12]);
            CarWheel();
        popMatrix();

        pushMatrix();
            multTranslation([-12, -8, -12]);
            CarWheel();
        popMatrix();
    }

    function CarWheel(){
        multRotationZ(90);
        multScale([10, 5, 10]);
        Cylinder(DARK_GRAY);
    }
    function House(){
        pushMatrix();
            multTranslation([-255, 50, -270]);
            HouseStructure();
        popMatrix();

        pushMatrix();
            multTranslation([-255, 150, -270]);
            Roof();
        popMatrix();

        pushMatrix();
            multTranslation([-255, 20, -195]);
            HouseDoor();
        popMatrix();

        pushMatrix();
            multTranslation([-320, 60, -195]);
            HouseWindow();
        popMatrix();

        pushMatrix();
            multTranslation([-190, 60, -195]);
            HouseWindow();
        popMatrix();

    }

    function HouseWindow(){
        multRotationX(90);
        multScale([40,1,30]);
        Cube([0.49, 0.64, 0.74]);
    }

    function HouseDoor(){
        multRotationX(90);
        multScale([30,1,40]);
        Cube([0.51, 0.28, 0.3]);
    }

    function Roof(){
        multScale([200, 100, 150]);
        Pyramid(ROOF_COLOR);
    }

    function HouseStructure(){
        multScale([200, 100, 150]);
        Cube(WHITE);

    }
    //#endregion

    //#region Helicopter
    function Helicopter() {
        pushMatrix();
            Body();
        popMatrix();

        pushMatrix();
            multTranslation([3, 18, 0]);
            multRotationY(heli.rotor.pos);
            MainRotor();
        popMatrix();
    }

    function Body() {
        pushMatrix();
            multScale([56, 28, 28]);
            Sphere(RED);
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
        const mModel = mult(invView, modelView());
        const bottom = mult(mModel, [-50, -2, 0, 1]);
        heli.height = heli.coords[1] - bottom[1];

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
        multScale([2, 16, 2]);
        Cube(GOLD_YELLOW);
    }

    function Skid() {
        multScale([50, 2, 2]);
        multRotationZ(90);
        Cylinder(GOLD_YELLOW);
    }
    
    function TailBoom() {
        pushMatrix();
            TailBoomLarge();
        popMatrix();

        pushMatrix();
            multTranslation([26, 7, 0]);
            TailBoomSmall();
        popMatrix();
    }

    function TailBoomLarge() {
        multScale([52, 8, 8]);
        Sphere(RED);
    }

    function TailBoomSmall() {
        pushMatrix();
            multRotationZ(70);
            multScale([15, 8, 8]);
            Sphere(RED);
        popMatrix();

        pushMatrix();
            multRotationZ(-heli.rotor.pos);
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

    function TailRotor() {
        pushMatrix();
            TailRotorHandle();
        popMatrix();

        for (let i = 0; i < 2; i++) {
            pushMatrix();
                multRotationY(i * 180);
                multTranslation([5, 0, 0]);
                TailRotorBlade();
            popMatrix();
        }
    }

    function TailRotorHandle() {
        multScale([2, 5, 2]);
        Cylinder(RED);
    }
    
    function TailRotorBlade() {
        multScale([10, 1, 3]);
        Sphere(GRAY);
    }
    
    function MainRotor() {
        pushMatrix();
            MainRotorMast();
        popMatrix();

        for (let i = 0; i < 3; i++) {
            pushMatrix();
                multRotationY(i * 120);
                multTranslation([25, 0, 0]);
                MainRotorBlade();
            popMatrix();
        }
    }

    function MainRotorBlade() {
        multScale([50, 3, 6]);
        Sphere(GRAY);
    }

    function MainRotorMast() {
        multScale([3, 10, 3]);
        Cylinder(RED);
    }
    //#endregion

    //#region Base Models
    function Cube(color) {
        uploadColor(color);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function Sphere(color) {
        uploadColor(color);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }
    
    function Cylinder(color) {
        uploadColor(color);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }

    function Pyramid(color){
        uploadColor(color);
        uploadModelView();
        PYRAMID.draw(gl, program, mode);
    }
    //#endregion
    
    function GlobalLight(pos) {
        gl.uniform4fv(
            gl.getUniformLocation(program, "uLightDir"),
            flatten(mult(mView, pos))
        );
    }

    function updateHeli() {
        const vDecay = heli.vert.speed * 0.3;
        heli.vert.speed += (heli.vert.accel - vDecay) / delta;
        heli.vert.pos += heli.vert.speed / delta;

        const onGround = heli.vert.pos - 1 <= heli.height + GROUND_HEIGHT;
        if (onGround && !heli.lifting) {
            heli.vert.speed = 0;
            heli.vert.pos = heli.height + GROUND_HEIGHT;
            heli.horz.accel = 0;
        }

        const hDecay = heli.horz.speed * 0.3;
        heli.horz.speed += (heli.horz.accel - hDecay) / delta;
        heli.horz.pos += heli.horz.speed / delta;
        heli.horz.pos %= 360;

        heli.rotor.accel = !onGround ? 80 + 2 * heli.horz.speed : 0;
        const rDecay = heli.rotor.speed * 0.3;
        heli.rotor.speed += (heli.rotor.accel - rDecay) / delta;
        heli.rotor.pos += heli.rotor.speed / delta;
    }

    function Scene() {
        pushMatrix();
            if (delta > 0)
                updateHeli();

            multRotationY(-heli.horz.pos);
            multTranslation([200, heli.vert.pos, 0]);
            multRotationX(heli.horz.speed / 2);
            multRotationY(90);

            const mModel = mult(invView, modelView())
            heli.coords = vec3(mult(mModel, [-40.0, 0, 0, 1.0]));
            heli.forward = vec3(mult(mModel, [-41.0, 0, 0, 1.0]));

            Helicopter();
        popMatrix();

        pushMatrix();
            Decorations();
        popMatrix();

        pushMatrix();
            EiffelTower();
        popMatrix();
    }

    function render(t) {
        delta = time === undefined ? 0 : t - time;
        time = t;

        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        // Camera projection
        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "mProjection"), false,
            flatten(mProjection)
        );
        
        // Set camera point of view for the perspective camera
        if (isPerspective) {
            mView = lookAt(heli.coords, heli.forward, [0, 1, 0]);
            calcInvView();
        }

        loadMatrix(mView);
        
        GlobalLight([0, 5, 2, 0]);
        Scene();
    }

    window.requestAnimationFrame(render);
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))