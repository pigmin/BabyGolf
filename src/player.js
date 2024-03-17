import { Color3, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, Quaternion, SceneLoader, Vector3 } from '@babylonjs/core';
import { GlobalManager, States } from './globalmanager';
import { InputController } from './inputcontroller';
import { Tools } from './tools';

//import player1MeshUrl from "../assets/models/strange_and_scary.glb";


const BALL_RADIUS = 0.5;

class Player {

    mesh;
  

    moveDirection = Vector3.Zero();
    
    constructor() {
        

    }

    respawn(spawnPoint, exitMesh) {
        this.spawnPoint = spawnPoint;
        this.exitMesh = exitMesh;
    }

    getPosition() {
        return this.mesh.absolutePosition;
    }

    async init() {

    }

    update() {

        this.inputMove();
      
        this.move();

        this.checkCollisions();
    }

    checkCollisions() {
        if (this.exitMesh) {
            if (this.mesh.intersectsMesh(this.exitMesh, false)) {
                console.log("EXIT !!!");
                GlobalManager.gameState = States.STATE_EXITED;
            }
        }
    }

    inputMove() {

      
    }

    move() {
        
        if (this.moveDirection.length() != 0) {


        }
        else {            

        }
        
    }
}

export default Player;