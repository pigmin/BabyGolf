
import { Vector3 } from '@babylonjs/core';

export const States = Object.freeze({
    STATE_NONE: 0,
    STATE_INIT: 10,
    STATE_LOADING: 20,
    STATE_PRE_INTRO: 22,
    STATE_MENU: 25,
    STATE_START_INTRO: 28,
    STATE_INTRO: 30,
    STATE_START_GAME: 35,
    STATE_NEW_LEVEL: 45,
    STATE_LEVEL_READY: 55,
    STATE_RUNNING: 60,
    STATE_PAUSE: 70,
    STATE_EXITED: 75,
    STATE_LOOSE: 80,
    STATE_GAME_OVER: 90,
    STATE_END: 100,
});

export const PhysMasks = Object.freeze({
    PHYS_MASK_PLAYER: 1,
    PHYS_MASK_GROUND: 2,
    PHYS_MASK_PROPS: 4,
    PHYS_MASK_ENNEMIES: 16,

    PHYS_MASK_ALL: 0xffffffff
});


class GlobalManager {

    engine;
    canvas;
    scene;
    camera;

    playersMeshCollider = [];
    

    gameCamera;
    debugCamera;
    gizmoManager;
    gravityVector = new Vector3(0, -9.81, 0);

    gameState = States.STATE_NONE;
    bPause = false;

    lights = [];
    shadowGenerators = [];

    deltaTime;

    menuUI;
    gameUI;

    constructor() {

    }

    static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] || new this());
    }

    init(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
    }

    update() {
        this.deltaTime = this.engine.getDeltaTime() / 1000.0;
    }

    addLight(light) {
        this.lights.push(light);
    }
    addShadowGenerator(shadowGen) {
        this.shadowGenerators.push(shadowGen);
    }

    addShadowCaster(object, bChilds) {
        bChilds = bChilds || false;
        for (let shad of this.shadowGenerators) {
            shad.addShadowCaster(object, bChilds);
        }
    }
    removeShadowCaster(object, bChilds) {
        bChilds = bChilds || false;
        for (let shad of this.shadowGenerators) {
            shad.removeShadowCaster(object, bChilds);
        }
    }
}

const { instance } = GlobalManager;
export { instance as GlobalManager };