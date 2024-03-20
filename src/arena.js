import { Color3, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, SceneLoader, StandardMaterial, Vector3 } from '@babylonjs/core';
import { GlobalManager, PhysMasks } from './globalmanager';

class Arena {

    mesh;

    playerSpawnPoint1 = Vector3.Zero();


    assetContainer = null;

    holeMesh = null;
    doorTriggers = [];

    navmeshdebug = null;
    matdebug;

    constructor() {
    }

    async init() {
        this.matdebug = new StandardMaterial('matdebug', GlobalManager.scene);
        this.matdebug.diffuseColor = new Color3(1.0, 0.2, 0.2);
        this.matdebug.alpha = 0.5;

    }

    async loadLevel(level) {
        
        if (this.assetContainer != null)
            this.disposeLevel();

        this.assetContainer = await SceneLoader.LoadAssetContainerAsync("", level.model, GlobalManager.scene);

        this.assetContainer.addAllToScene();

        for (let aNode of this.assetContainer.transformNodes) {
            if (aNode.name.includes("SPAWN_P1")) {
                //Player start 
                this.playerSpawnPoint1.copyFrom(aNode.getAbsolutePosition());
                aNode.dispose();
            }
           
        }

        for (let anim of this.assetContainer.animationGroups) {
            anim.stop();
        }

        for (let childMesh of this.assetContainer.meshes) {

            let extras = null;
            if (childMesh.metadata && childMesh.metadata.gltf && childMesh.metadata.gltf.extras) {
                extras = childMesh.metadata.gltf.extras;
                //Recup les datas supp.

                console.log(extras);
            }


            if (childMesh.getTotalVertices() > 0) {
                //Objet 3D

                if (extras) {
                    if (extras.collisions)
                        childMesh.checkCollisions = true;

                    if (extras.hole) {
                        childMesh.checkCollisions = false;
                        childMesh.visibility = 0.0; 
                        this.holeMesh = childMesh;
                    }
                    else if (extras.door_trigger) {
                        childMesh.checkCollisions = false;
                        childMesh.visibility = 0.0; 
                        let doorTrigger = { trigger: childMesh,
                            doorName : extras.door_trigger,
                            triggered : false, 
                            openAnim :  GlobalManager.scene.getAnimationGroupByName(extras.door_trigger + "_Open") };
                       this.doorTriggers.push( doorTrigger );
                    }
                    else {
                        childMesh.receiveShadows = true;
                        GlobalManager.addShadowCaster(childMesh);
                    }
                }                 
            }
            else {
                //RAS
            }

        }



    }


    drawLevel() {
        
    }

    disposeLevel() {
        if (this.navmeshdebug)
            this.navmeshdebug.dispose();
        this.holeMesh = null;
        this.doorTriggers = [];
        for (let childMesh of this.assetContainer.meshes) {

            if (childMesh.getTotalVertices() > 0) {
                GlobalManager.removeShadowCaster(childMesh);
            }

        }
        this.assetContainer.removeAllFromScene();
    }

    getSpawnPoint(playerIndex) {
        if (playerIndex == 1)
            return this.playerSpawnPoint1.clone();
        else
            return this.playerSpawnPoint2.clone();
    }

    getHoleMesh() {
        return this.holeMesh;
    }

    update() {
        this.checkTriggers();
    }

    checkTriggers() {
        for (let i = 0; i < this.doorTriggers.length; i++) {
            let doorTrigger = this.doorTriggers[i];
            if (!doorTrigger.triggered) {
                const areIntersecting1 = GlobalManager.playersMeshCollider[1].intersectsMesh(doorTrigger.trigger, false);
                const areIntersecting2 = GlobalManager.playersMeshCollider[2].intersectsMesh(doorTrigger.trigger, false);
                if (areIntersecting1 || areIntersecting2) {
                    //On cherche la porte
                    let doorMesh = GlobalManager.scene.getMeshByName(doorTrigger.doorName);
                    if (doorMesh) {
                        if (doorTrigger.openAnim)
                            doorTrigger.openAnim.play(false);
                        else {
                            doorMesh.visibility = 0;
                            doorMesh.checkCollisions = false;
                        }
                    }
                    doorTrigger.triggered = true;
                }
            }
        }
    }

}

export default Arena;