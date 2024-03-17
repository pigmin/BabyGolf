import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { GamepadManager } from '@babylonjs/core/Gamepads/gamepadManager';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents';
import { Scalar } from '@babylonjs/core/Maths/math.scalar';

import { GlobalManager } from "./globalmanager";

class InputController {

    #gamepadManager;

    #axisP1 = new Vector2(0, 0);
    #axisP2 = new Vector2(0, 0);
    #axisP3 = new Vector2(0, 0);
    #axisP4 = new Vector2(0, 0);
    #bGamePadConnected = false;

    inputMap = {};
    actions = {};

    static get instance() {
        return (globalThis[Symbol.for(`PF_${InputController.name}`)] ||= new this());
    }

    constructor() {

    }

    init() {

        this.#gamepadManager = new GamepadManager();

        GlobalManager.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.inputMap[kbInfo.event.code] = true;
                    //console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.inputMap[kbInfo.event.code] = false;
                    this.actions[kbInfo.event.code] = true;
                    //console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
            }
        });

        this.#gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
            console.log("Connected: " + gamepad.id);
            this.bGamePadConnected = true;

            gamepad.onButtonDownObservable.add((button, state) => {
                //Button has been pressed
                this.actions["Space"] = true;
                console.log(button + " pressed");
            });
            gamepad.onButtonUpObservable.add((button, state) => {
                console.log(button + " released");
            });
            gamepad.onleftstickchanged((values) => {
                //Left stick has been moved
                //console.log("x:" + values.x.toFixed(3) + " y:" + values.y.toFixed(3));

                this.#axisP1.x = values.x.toFixed(3);
                this.#axisP1.y = -values.y.toFixed(3);
            });

            gamepad.onrightstickchanged((values) => {
                //console.log("x:" + values.x.toFixed(3) + " y:" + values.y.toFixed(3));
            });
        });

        this.#gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state) => {
            console.log("Disconnected: " + gamepad.id);
            this.bGamePadConnected = false;
        });

    }

    update() {

        if (!this.bGamePadConnected) {

            //P1
            if (this.inputMap["KeyA"])
                this.#axisP1.x = Scalar.MoveTowards(this.#axisP1.x, -1, 10 * GlobalManager.deltaTime);
            else if (this.inputMap["KeyD"])
                this.#axisP1.x = Scalar.MoveTowards(this.#axisP1.x, 1, 10 * GlobalManager.deltaTime);
            else
                this.#axisP1.x = Scalar.MoveTowards(this.#axisP1.x, 0, 10 * GlobalManager.deltaTime);

            if (this.inputMap["KeyS"])
                this.#axisP1.y = Scalar.MoveTowards(this.#axisP1.y, -1, 10 * GlobalManager.deltaTime);
            else if (this.inputMap["KeyW"])
                this.#axisP1.y = Scalar.MoveTowards(this.#axisP1.y, 1, 10 * GlobalManager.deltaTime);
            else
                this.#axisP1.y = Scalar.MoveTowards(this.#axisP1.y, 0, 10 * GlobalManager.deltaTime);

            //P2
            if (this.inputMap["KeyK"])
                this.#axisP2.x = Scalar.MoveTowards(this.#axisP2.x, -1, 10 * GlobalManager.deltaTime);
            else if (this.inputMap["Semicolon"])
                this.#axisP2.x = Scalar.MoveTowards(this.#axisP2.x, 1, 10 * GlobalManager.deltaTime);
            else
                this.#axisP2.x = Scalar.MoveTowards(this.#axisP2.x, 0, 10 * GlobalManager.deltaTime);

            if (this.inputMap["KeyL"])
                this.#axisP2.y = Scalar.MoveTowards(this.#axisP2.y, -1, 10 * GlobalManager.deltaTime);
            else if (this.inputMap["KeyO"])
                this.#axisP2.y = Scalar.MoveTowards(this.#axisP2.y, 1, 10 * GlobalManager.deltaTime);
            else
                this.#axisP2.y = Scalar.MoveTowards(this.#axisP2.y, 0, 10 * GlobalManager.deltaTime);
        }
    }

    resetActions() {
        this.actions = {};
    }

    //Section "Virtuelle", on fait une abstraction entre le device et les comportements
    //A terme il faudrait gérer des mappings, un choix de device, une sensibilité, etc.

    //Retourne l'axe de déplacement du P1, soit clavier, soit manette
    getAxisVectorP1() {
        return this.#axisP1;
    }

    //Retourne l'axe de déplacement du P1, soit clavier, soit manette
    getAxisVector(playerIndex) {
        if (playerIndex == 1)
            return this.#axisP1;
        else if (playerIndex == 2)
            return this.#axisP2;
        else if (playerIndex == 3)
            return this.#axisP3;
        else
            return this.#axisP4;

    }

}

//Destructuring on ne prends que la propriété statique instance
const { instance } = InputController;
export { instance as InputController };
