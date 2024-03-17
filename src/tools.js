import { Vector3, Matrix, Quaternion } from "@babylonjs/core/Maths/math.vector";
import { GlobalManager } from './globalmanager';


class Tools {

    canvas;
    engine;


    static get instance() {
        return (globalThis[Symbol.for(`PF_${Tools.name}`)] ||= new this());
    }

    constructor() {

    }

    init(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
    }

    update() {

    }

    clampMagnitudeInPlace(vector, maxLength) {
        // Calculer la longueur (magnitude) actuelle du vecteur
        let currentLength = vector.length();

        // Si la longueur est déjà inférieure ou égale à maxLength, renvoyer le vecteur initial
        if (currentLength <= maxLength) {
            return vector;
        }

        // Retourner le vecteur redimensionné
        vector.scaleInPlace(maxLength / currentLength);
    }

    getUpVector(_mesh) {
        let up_local = _mesh.getDirection(Vector3.UpReadOnly);
        return up_local.normalize();
    }

    getForwardVector(_mesh) {
        let forward_local = _mesh.getDirection(Vector3.LeftHandedForwardReadOnly);
        return forward_local.normalize();
    }

    getRightVector(_mesh) {
       
        let right_local = _mesh.getDirection(Vector3.RightReadOnly);
        return right_local.normalize();
    }
    
    
    Quaternion_LookRotation(target, up) {

        var right = Vector3.Cross(up, target).normalize();
        var correctedUp = Vector3.Cross(target, right).normalize();

        var mat = Matrix.FromValues(
            right.x, correctedUp.x, target.x, 0,
            right.y, correctedUp.y, target.y, 0,
            right.z, correctedUp.z, target.z, 0,
            0, 0, 0, 1
        );

        var quaternion = new Quaternion();
        quaternion.fromRotationMatrix(mat);
        return quaternion;
    }

    shortestRotationBetweenQuatertions(q1, q2) {
        // Normalize the quaternions
        q1.normalize();
        q2.normalize();

        // Calculate the inverse of the first quaternion
        let q1Inverse;
        if (Quaternion.Dot(q1, q2) < 0)
            q1Inverse = q1.scale(-1);
        else
            q1Inverse = q1.clone();

        q1Inverse.conjugateInPlace();
        q1Inverse.normalize();

        // Compute the relative rotation
        let qRel = q2.multiply(q1Inverse);

        // Normalize the result to get the shortest rotation
        qRel.normalize();

        return qRel;
    }

  
    toAngleAxis(quaternion) {
        quaternion.normalize();
        let angle = 2 * Math.acos(quaternion.w);
        let s = Math.sqrt(1 - quaternion.w * quaternion.w); // Sinon, l'axe n'est pas normalisé
        let axis;

        if (s < 0.001) { // Si s est proche de zéro, l'angle est proche de 0 ou 180 degrés
            axis = new Vector3(quaternion.x, quaternion.y, quaternion.z); // L'axe n'est pas important
        } else {
            axis = new Vector3(quaternion.x / s, quaternion.y / s, quaternion.z / s); // L'axe normalisé
        }
        return { angle: angle, axis : axis };
    }

    getTorqueToAlignVectors(mass, fromVector, toVector) {
        // Normaliser les vecteurs
        fromVector.normalize();
        toVector.normalize();

        // Calculer l'axe de rotation et l'angle
        const axis = Vector3.Cross(fromVector, toVector).normalize();
        const angle = Math.acos(Vector3.Dot(fromVector, toVector));

        // Calculer le couple nécessaire
        const torque = axis.scale(angle * mass);

        // Appliquer le couple
        return torque;
    }

    getTorqueToAlignQuaternions(mass, fromQuaternion, toQuaternion) {
        // Calculer le quaternion de rotation nécessaire
        const requiredRotation = toQuaternion.multiply(fromQuaternion.invert());

        // Convertir le quaternion en axe et angle
        const axisAngle = this.toAngleAxis(requiredRotation);
        const axis = axisAngle.axis;
        let angle = axisAngle.angle;

        // Normaliser l'angle pour qu'il soit entre -PI et PI
        angle = angle > Math.PI ? angle - 2 * Math.PI : angle;
        angle = angle < -Math.PI ? angle + 2 * Math.PI : angle;

        // Calculer le couple en fonction de l'axe et de l'angle
        // La magnitude du couple peut être ajustée en fonction des besoins de votre simulation
        const torque = axis.scale(angle * mass);

        // Appliquer le couple
        return torque;
    }

    applyTorque(torqueWorld, body) {

        let massProps = body.getMassProperties();
        let worldFromInertia = massProps.inertiaOrientation.multiply(body.transformNode.absoluteRotationQuaternion);
        let inertiaFromWorld = worldFromInertia.conjugate();
        let impLocal = torqueWorld.applyRotationQuaternion(inertiaFromWorld);
        let impWorld = impLocal.multiply(massProps.inertia).applyRotationQuaternion(worldFromInertia);
        let newAV = body.getAngularVelocity().add(impWorld.scale(GlobalManager.scene.getPhysicsEngine().getTimeStep()));
        body.setAngularVelocity(newAV);
        //console.log(newAV);
    }


}

//Destructuring on ne prends que la propriété statique instance
const { instance } = Tools;
export { instance as Tools };
