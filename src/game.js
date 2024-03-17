import { Color3, CubeTexture, DirectionalLight, Engine, FollowCamera, FreeCamera,  GlowLayer,  RecastJSPlugin,  Scene, ScenePerformancePriority, ShadowGenerator, Vector3 } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from "@babylonjs/havok";


import Player from './player';
import Arena from './arena';
import { GlobalManager, States } from './globalmanager';

import envSpecularUrl from "../assets/env/environmentSpecular.env";

import { levels } from './levels';

import { InputController } from './inputcontroller';
import { SoundManager } from './soundmanager';




class Game {

    engine;
    canvas;
    scene;


    camera;
    light;

    startTimer;

    arena;
    player1;


    bInspector = false;

    currentLevel = 0;

    constructor(engine, canvas) {
        GlobalManager.engine = engine;
        GlobalManager.canvas = canvas;
        GlobalManager.init(canvas, engine);
    }

    async start() {
        this.startTimer = 0;

        await this.initGame();
        GlobalManager.gameState = States.STATE_MENU;

        this.gameLoop();
        this.endGame();


    }
    endGame() {

    }

    async initGame() {

        GlobalManager.gameState = States.STATE_INIT;

        await this.createScene();

        GlobalManager.engine.displayLoadingUI();

        InputController.init();
        await SoundManager.init();

        this.arena = new Arena();
        await this.arena.init();
        await this.arena.loadLevel(levels[this.currentLevel]);

        //Player creation and init
        this.player1 = new Player(1);
        await this.player1.init();
        this.player1.respawn(this.arena.getSpawnPoint(1), this.arena.getExitMesh());

        //Ennemy(ies) creation and init
        GlobalManager.engine.hideLoadingUI();

        //Draw level temporairement ici, manque des fonctions de "restart/respawn"
        this.arena.drawLevel();
        //GlobalManager.scene.createOrUpdateSelectionOctree();
    }


    async getInitializedHavok() {
        return await HavokPhysics();
    }


    async gameLoop() {

        const divFps = document.getElementById("fps");
        GlobalManager.engine.runRenderLoop(() => {

            GlobalManager.update();

            InputController.update();
            SoundManager.update();
           
            switch (GlobalManager.gameState) {
                case States.STATE_MENU:
                    //TODO menu
                    GlobalManager.gameState = States.STATE_START_GAME;
                    break;
                case States.STATE_START_GAME:
                    Engine.audioEngine.unlock();
                    SoundManager.playMusic(SoundManager.Musics.GAME_MUSIC);


                    GlobalManager.gameState = States.STATE_LEVEL_READY;
                    break;                    
                case States.STATE_LEVEL_READY:
                    GlobalManager.gameState = States.STATE_RUNNING;
                    break;

                case States.STATE_NEW_LEVEL: 
                    break;

                case States.STATE_EXITED: 
                    this.gotoNextLevel();
                    break;

                case States.STATE_RUNNING:
                    this.updateGame();
                    break;

                default:
                    break;
            }

            if (InputController.actions["KeyN"]) {
                this.gotoNextLevel();
            }

            //Debug
            if (InputController.actions["KeyI"]) {
                this.bInspector = !this.bInspector;

                if (this.bInspector) {
                    GlobalManager.gameCamera.detachControl();
                    GlobalManager.debugCamera.attachControl(this.canvas, true);
                    GlobalManager.scene.activeCamera = GlobalManager.debugCamera;

                    Inspector.Show(GlobalManager.scene, { embedMode: false });
                }
                else {
                    GlobalManager.debugCamera.detachControl();
                    GlobalManager.gameCamera.attachControl(this.canvas, true);
                    GlobalManager.scene.activeCamera = GlobalManager.gameCamera;
                    Inspector.Hide();
                }
            }
            //Reset actions
            InputController.resetActions();
            divFps.innerHTML = GlobalManager.engine.getFps().toFixed() + " fps";
            GlobalManager.scene.render();
        });
    }

    updateGame() {

        this.arena.update();

        this.player1.update();

        this.startTimer += GlobalManager.deltaTime;
    }

    async createScene() {

       
        this.havokInstance = await this.getInitializedHavok();
        GlobalManager.scene = new Scene(GlobalManager.engine);
        //Pour les collisions internes de babylonjs :
        GlobalManager.scene.collisionsEnabled = true;
        GlobalManager.scene.performancePriority = ScenePerformancePriority.BackwardCompatible;
        //Database.IDBStorageEnabled = true;

        const hk = new HavokPlugin(true, this.havokInstance);
        // enable physics in the scene with a gravity
        GlobalManager.scene.enablePhysics(GlobalManager.gravityVector, hk);
        
        GlobalManager.scene.clearColor = new Color3(.5, .5, 1);
        GlobalManager.scene.ambientColor = new Color3(1, 1, 1);

        // This creates and positions a free camera (non-mesh)
        GlobalManager.gameCamera = new FollowCamera("FollowCam", new Vector3(0, 250, 15), GlobalManager.scene);
        GlobalManager.gameCamera.heightOffset = 50.0;
        GlobalManager.gameCamera.lowerHeightOffsetLimit = 40.0;
        GlobalManager.gameCamera.upperHeightOffsetLimit = 60;
        GlobalManager.gameCamera.rotationOffset = 0;

        GlobalManager.gameCamera.radius = -100;
        GlobalManager.gameCamera.lowerRadiusLimit = -120;
        GlobalManager.gameCamera.upperRadiusLimit = -80;

        GlobalManager.gameCamera.maxCameraSpeed = 1.0;
        GlobalManager.gameCamera.cameraAcceleration = 0.05;
        GlobalManager.gameCamera.minZ = 0.05;
        GlobalManager.gameCamera.maxZ = 1000;
        GlobalManager.gameCamera.ellipsoid = new Vector3(5, 5, 5);

        GlobalManager.gameCamera.wheelPrecision = 0.5; //Mouse wheel speed
        GlobalManager.gameCamera.attachControl(this.canvas, true);
        GlobalManager.gameCamera.inputs.attached.pointers.angularSensibilityX = 1.5;
        GlobalManager.gameCamera.inputs.attached.pointers.angularSensibilityY = 2.0;


        GlobalManager.debugCamera = new FreeCamera("debugCam", new Vector3(0, 8, -10), GlobalManager.scene);
        GlobalManager.debugCamera.maxZ = 10000;
        GlobalManager.debugCamera.inputs.addMouseWheel();
        /*
                // Set up new rendering pipeline
                var pipeline = new DefaultRenderingPipeline("default", true, GlobalManager.scene, [GlobalManager.gameCamera]);
        
                // Tone mapping
                GlobalManager.scene.imageProcessingConfiguration.toneMappingEnabled = true;
                GlobalManager.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
                GlobalManager.scene.imageProcessingConfiguration.exposure = 2;
        */
                let envOptions = {
                    createGround: false,
                    createSkybox : false,
                    cameraExposure : 1,
                    environmentTexture : new CubeTexture(envSpecularUrl, GlobalManager.scene),
                };
                GlobalManager.scene.createDefaultEnvironment(envOptions);
                GlobalManager.scene.environmentIntensity = 0.35;
                
                // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
                let light = new DirectionalLight("light", new Vector3(1, 10, 0), GlobalManager.scene);
                light.direction = new Vector3(0.2, -1, 0.4);
                light.diffuse = new Color3(1, 1, 1);
                light.autoCalcShadowZBounds = true;
                light.autoUpdateExtends = true;

                // Default intensity is 1. Let's dim the light a small amount
                light.intensity = 1.0;
                GlobalManager.addLight(light);
        
                let shadowGen = new ShadowGenerator(2048, light);
                shadowGen.useBlurCloseExponentialShadowMap = true;
                shadowGen.bias = 0.01;
                GlobalManager.addShadowGenerator(shadowGen);


        SoundManager.playMusic(SoundManager.Musics.MENU_MUSIC);

    }

    gotoNextLevel() {
        GlobalManager.gameState = States.STATE_NEW_LEVEL;
        this.currentLevel++;
        if (this.currentLevel >= levels.length)
            this.currentLevel = 0;

        GlobalManager.gameState = States.STATE_NEW_LEVEL;
        GlobalManager.engine.displayLoadingUI();
        this.arena.loadLevel(levels[this.currentLevel]).then( () => {


            this.player1.respawn(this.arena.getSpawnPoint(1), this.arena.getExitMesh());

            GlobalManager.engine.hideLoadingUI();
            GlobalManager.gameState = States.STATE_LEVEL_READY;

        });        
    }
}

export default Game;