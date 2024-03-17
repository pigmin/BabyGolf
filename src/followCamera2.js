import { Quaternion, TmpVectors, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { FollowCamera } from '@babylonjs/core/Cameras/followCamera';
import { Tools } from '@babylonjs/core/Misc/tools';
import { Node } from '@babylonjs/core/node';
import { Engine, FollowCameraInputsManager, TargetCamera } from '@babylonjs/core';

Node.AddNodeConstructor("FollowCamera2", (name, scene) => {
    return () => new FollowCamera2(name, Vector3.Zero(), scene);
});

/**
 * A follow camera takes a mesh as a target and follows it as it moves. Both a free camera version followCamera and
 * an arc rotate version arcFollowCamera are available.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
 */
export class FollowCamera2 extends TargetCamera {

    /**
        * Define the collision ellipsoid of the camera.
        * This is helpful to simulate a camera body like the player body around the camera
        * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions#arcrotatecamera
        */

    ellipsoid = new Vector3(0.5, 1, 0.5);

    /**
     * Define an offset for the position of the ellipsoid around the camera.
     * This can be helpful to determine the center of the body near the gravity center of the body
     * instead of its head.
     */

    ellipsoidOffset = new Vector3(0, 0, 0);

    /**
     * Enable or disable collisions of the camera with the rest of the scene objects.
     */

    checkCollisions = false;

    /**
     * Enable or disable gravity on the camera.
     */

    applyGravity = false;

    /**
 * Event raised when the camera collide with a mesh in the scene.
 */
    onCollide = null;

    _collider;
    _needMoveForGravity = false;
    _oldPosition = Vector3.Zero();
    _diffPosition = Vector3.Zero();
    _newPosition = Vector3.Zero();

    /** @internal */
    _localDirection;
    /** @internal */
    _transformedDirection;

    /**
     * Distance the follow camera should follow an object at
     */
    radius = 12;

    /**
     * Minimum allowed distance of the camera to the axis of rotation
     * (The camera can not get closer).
     * This can help limiting how the Camera is able to move in the scene.
     */
    lowerRadiusLimit = null;

    /**
     * Maximum allowed distance of the camera to the axis of rotation
     * (The camera can not get further).
     * This can help limiting how the Camera is able to move in the scene.
     */
    upperRadiusLimit = null;

    /**
     * Define a rotation offset between the camera and the object it follows
     */
    rotationOffset = 0;

    /**
     * Minimum allowed angle to camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */
    lowerRotationOffsetLimit = null;

    /**
     * Maximum allowed angle to camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */
    upperRotationOffsetLimit = null;

    /**
     * Define a height offset between the camera and the object it follows.
     * It can help following an object from the top (like a car chasing a plane)
     */

    heightOffset = 4;

    /**
     * Minimum allowed height of camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */

    lowerHeightOffsetLimit = null;

    /**
     * Maximum allowed height of camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */

    upperHeightOffsetLimit = null;

    /**
     * Define how fast the camera can accelerate to follow it s target.
     */

    cameraAcceleration = 0.05;

    /**
     * Define the speed limit of the camera following an object.
     */

    maxCameraSpeed = 20;

    /**
     * Define the target of the camera.
     */
    lockedTarget = null;

    inputs;

    maxCameraRotationSpeed = 1.0 * Math.PI;

    constructor(name, position, scene, lockedTarget) {
        super(name, position, scene);

        this.position.copyFrom(position);
        this.lockedTarget = lockedTarget;
        this.inputs = new FollowCameraInputsManager(this);
        this.inputs.addKeyboard().addMouseWheel().addPointers();

        if (this.lockedTarget)
            this.rotationQuaternion = this.lockedTarget.absoluteRotationQuaternion;
        // Uncomment the following line when the relevant handlers have been implemented.
        // this.inputs.addKeyboard().addMouseWheel().addPointers().addVRDeviceOrientation();
    }

    /**
         * Attached controls to the current camera.
         * @param ignored defines an ignored parameter kept for backward compatibility.
         * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
         */
    attachControl(ignored, noPreventDefault) {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this.inputs.attachElement(noPreventDefault);

        this._reset = () => { };
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        this.inputs.detachElement();

        if (this._reset) {
            this._reset();
        }
    }


    // Collisions
    _collisionMask = -1;

    /**
     * Define a collision mask to limit the list of object the camera can collide with
     */
    get collisionMask() {
        return this._collisionMask;
    }

    set collisionMask(mask) {
        this._collisionMask = !isNaN(mask) ? mask : -1;
    }

    /**
     * @internal
     */
    _collideWithWorld(displacement) {
        let globalPosition;

        if (this.parent) {
            globalPosition = Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
        } else {
            globalPosition = this.position;
        }

        globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
        this._oldPosition.addInPlace(this.ellipsoidOffset);

        const coordinator = this.getScene().collisionCoordinator;
        if (!this._collider) {
            this._collider = coordinator.createCollider();
        }

        this._collider._radius = this.ellipsoid;
        this._collider.collisionMask = this._collisionMask;

        //no need for clone, as long as gravity is not on.
        let actualDisplacement = displacement;

        //add gravity to the direction to prevent the dual-collision checking
        if (this.applyGravity) {
            //this prevents mending with cameraDirection, a global variable of the free camera class.
            actualDisplacement = displacement.add(this.getScene().gravity);
        }

        coordinator.getNewPosition(this._oldPosition, actualDisplacement, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
    }

    _onCollisionPositionChange = (collisionId, newPosition, collidedMesh) => {
        this._newPosition.copyFrom(newPosition);

        this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

        if (this._diffPosition.length() > Engine.CollisionsEpsilon) {
            this.position.addToRef(this._diffPosition, this._deferredPositionUpdate);
            if (!this._deferOnly) {
                this.position.copyFrom(this._deferredPositionUpdate);
            } else {
                this._deferredUpdated = true;
            }
            // call onCollide, if defined. Note that in case of deferred update, the actual position change might happen in the next frame.
            if (this.onCollide && collidedMesh) {
                this.onCollide(collidedMesh);
            }
        }
    };


    /**
     * Enable movement without a user input. This allows gravity to always be applied.
     */
    set needMoveForGravity(value) {
        this._needMoveForGravity = value;
    }

    /**
     * When true, gravity is applied whether there is user input or not.
     */
    get needMoveForGravity() {
        return this._needMoveForGravity;
    }

    /** @internal */
    _decideIfNeedsToMove() {
        return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
    }

    /** @internal */
    _updatePosition() {
        if (this.checkCollisions && this.getScene().collisionsEnabled) {
            this._collideWithWorld(this.cameraDirection);
        } else {
            super._updatePosition();
        }
    }

    /** @internal */
    _checkInputs() {
        if (!this._localDirection) {
            this._localDirection = Vector3.Zero();
            this._transformedDirection = Vector3.Zero();
        }
        this.inputs.checkInputs();
        this._checkLimits();
        super._checkInputs();
        if (this.lockedTarget) {
            this._follow(this.lockedTarget);
        }
    }

    _checkLimits() {
        if (this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit) {
            this.radius = this.lowerRadiusLimit;
        }
        if (this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit) {
            this.radius = this.upperRadiusLimit;
        }

        if (this.lowerHeightOffsetLimit !== null && this.heightOffset < this.lowerHeightOffsetLimit) {
            this.heightOffset = this.lowerHeightOffsetLimit;
        }
        if (this.upperHeightOffsetLimit !== null && this.heightOffset > this.upperHeightOffsetLimit) {
            this.heightOffset = this.upperHeightOffsetLimit;
        }

        if (this.lowerRotationOffsetLimit !== null && this.rotationOffset < this.lowerRotationOffsetLimit) {
            this.rotationOffset = this.lowerRotationOffsetLimit;
        }
        if (this.upperRotationOffsetLimit !== null && this.rotationOffset > this.upperRotationOffsetLimit) {
            this.rotationOffset = this.upperRotationOffsetLimit;
        }
    }



    _follow(cameraTarget) {
        if (!cameraTarget) {
            return;
        }

        const rotMatrix = TmpVectors.Matrix[0];
        cameraTarget.absoluteRotationQuaternion.toRotationMatrix(rotMatrix);

        /*
                Quaternion.SlerpToRef(this.rotationQuaternion, cameraTarget.absoluteRotationQuaternion, this.maxCameraRotationSpeed, this.rotationQuaternion);
                this.rotationQuaternion.toRotationMatrix(rotMatrix);
        */
        const yRotation = Math.atan2(rotMatrix.m[8], rotMatrix.m[10]);


        const radians = Tools.ToRadians(this.rotationOffset) + yRotation;

        const targetPosition = cameraTarget.getAbsolutePosition();
        const targetX = targetPosition.x + Math.sin(radians) * this.radius;

        const targetZ = targetPosition.z + Math.cos(radians) * this.radius;
        const dx = targetX - this.position.x;
        const dy = targetPosition.y + this.heightOffset - this.position.y;
        const dz = targetZ - this.position.z;
        let vx = dx * this.cameraAcceleration * 2; //this is set to .05
        let vy = dy * this.cameraAcceleration;
        let vz = dz * this.cameraAcceleration * 2;

        if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
            vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
            vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
            vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

       // this.position.addInPlaceFromFloats(vx, vy, vz);
       this.cameraDirection.set(vx, vy, vz);

       this.setTarget(targetPosition);
    }


    /**
     * Gets the camera class name.
     * @returns the class name
     */
    getClassName() {
        return "FollowCamera2";
    }
}
