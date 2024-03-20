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

    respawn(spawnPoint, holeMesh) {
        this.spawnPoint = spawnPoint;
        this.holeMesh = holeMesh;

        this.mesh.position.copyFrom(this.spawnPoint);
    }

    getPosition() {
        return this.mesh.absolutePosition;
    }

    async init() {
        this.mesh = MeshBuilder.CreateSphere("ballP1", { diameter : 0.427 });
    }

    update() {

        this.inputMove();
      
        this.move();

        this.checkCollisions();
    }

    checkCollisions() {
        if (this.holeMesh) {
            if (this.mesh.intersectsMesh(this.holeMesh, false)) {
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