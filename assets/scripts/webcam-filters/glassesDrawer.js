import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AmbientLight, DirectionalLight } from "three";

const fovY = 62;
const nearPlane = 0.1;
const farPlane = 1000;
let renderer;
let gl;
let scene;
let maskScene;
let camera;
let mesh;
let meshXOffset = 0;
let meshYOffset = 0;
let meshZOffset = 0;
let faceMesh = null;
let mask;
let threeCanvas;
let meshScaleFactor = 10;
let defaultPath = '/models/glasses/glasses1/glasses(1).glb';
let defaultHeadModelPath = '/models/glasses/test/untitled.glb';
let currentPosition = new THREE.Vector3();
let currentRotation = new THREE.Euler();
let maskCurrentPosition = new THREE.Vector3();

export async function ThreeSetup(canvas, modelScale, modelPath = defaultPath, xOffset = 0, yOffset = 0, zOffset = 0) {
    meshScaleFactor = modelScale;

    InitializeRenderer(canvas);
    InitializeSceneAndCamera();
    InitializeSceneLights();
    mesh = await loadModel(modelPath);

    mesh.position.set(0, 0, 0);
    mesh.scale.multiplyScalar(meshScaleFactor);
    scene.add(mesh);

    meshXOffset = xOffset;
    meshYOffset = yOffset;
    meshZOffset = zOffset;
    
    maskScene = new THREE.Scene();
    mask = await loadModel(defaultHeadModelPath);
    mask.position.set(0, 0, 0);
    mask.scale.multiplyScalar(meshScaleFactor);
    maskScene.add(mask);
}

function InitializeRenderer(canvas){
    threeCanvas = canvas;
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.autoClear = false;
    gl = renderer.getContext();
}

function InitializeSceneAndCamera(){
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(
        fovY, threeCanvas.width / threeCanvas.height, nearPlane, farPlane);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;

    camera.lookAt({ x: 0, y: 0, z: 0, isVector3: true });
}

function InitializeSceneLights()
{
    const directionalLight = new DirectionalLight('white', 1.5);
    directionalLight.position.set(0,0,10);

    const ambientLight = new AmbientLight('white', 1);

    scene.add(ambientLight, directionalLight);
}

export function AnimateThree(results) {
    if (mesh == null) return;
    renderer.clear();
    const faceLandmarks = results.faceLandmarks[0];
    const nose2 = faceLandmarks[4];
    const noseLandMarkVect = new THREE.Vector3(nose2.x, nose2.y, nose2.z);
    const transformationMatrix = new THREE.Matrix4().fromArray(results.facialTransformationMatrixes[0].data);

    //drawMask(faceLandmarks, transformationMatrix);
    updateMeshPosWithTransform(faceLandmarks, transformationMatrix);
    
    // Sets which color components to enable or to disable when drawing or rendering to a WebGLFramebuffer
    gl.colorMask(false, false, false, false); // R, G, B, A
    renderer.render(maskScene, camera);
    // Enable back the writing into the color and alpha component
    gl.colorMask(true, true, true, true);
    renderer.render(scene, camera);
}

function coordFromLandmarkToScreenAtZ(x, y, z,transformationMatrix) {
    var transformedPoint = new THREE.Vector3(x, y, z).applyMatrix4(transformationMatrix);
    let normalizedX = (x * 2) - 1;
    let normalizedY = (y * 2) - 1;
    let maxYPos = getTanDeg(fovY / 2) * (transformedPoint.z);

    let fovX = 2 * Math.atan(getTanDeg(fovY / 2) * (threeCanvas.width / threeCanvas.height));
    let maxXPos = Math.tan(fovX / 2) * transformedPoint.z;

    let canvasX = (normalizedX) * (maxXPos);
    let canvasY = (normalizedY) * (maxYPos);
    let newPoint = new THREE.Vector3(canvasX, canvasY, transformedPoint.z);

    return newPoint;
}

function drawMask(faceLandmarks, transformationMatrix)
{
    if (faceMesh != null) {
        scene.remove(faceMesh);
    }
    const vertices = [];
    for(let i = 0; i < faceLandmarks.length; i++)
    {
        vertices.push(coordFromLandmarkToScreenAtZ(faceLandmarks[i].x, faceLandmarks[i].y, faceLandmarks[i].z, transformationMatrix));
    }
    var material = new THREE.MeshNormalMaterial();
    material.wireframe = true;
    const faceGeometry = new ConvexGeometry( vertices, material );
    faceMesh = new THREE.Mesh(faceGeometry);
}


function updateMeshPosWithTransform(faceLandmarks, transformationMatrix) {
    const leftEye = new THREE.Vector3(faceLandmarks[33].x, faceLandmarks[33].y, faceLandmarks[33].z).applyMatrix4(transformationMatrix);
    const rightEye = new THREE.Vector3(faceLandmarks[263].x, faceLandmarks[263].y, faceLandmarks[263].z).applyMatrix4(transformationMatrix);
    const x = (leftEye.x + rightEye.x) / 2;
    const y = (leftEye.y + rightEye.y) / 2;
    const z = (leftEye.z + rightEye.z) / 2;

    // Update the object's position
    let normalizedX = (faceLandmarks[33].x + faceLandmarks[263].x) - 1;
    let normalizedY = (faceLandmarks[33].y + faceLandmarks[263].y) - 1;

    let maxYPos = getTanDeg(fovY / 2) * (z);

    let fovX = 2 * Math.atan(getTanDeg(fovY / 2) * (threeCanvas.width / threeCanvas.height));
    let maxXPos = Math.tan(fovX / 2) * z;

    const canvasX = (normalizedX) * (maxXPos);
    const canvasY = (normalizedY) * (maxYPos);
    const newPosition = new THREE.Vector3(canvasX, canvasY, z);

    const leftEyeLandMark = new THREE.Vector3(faceLandmarks[33].x, faceLandmarks[33].y, faceLandmarks[33].z);
    const rightEyeLandMark = new THREE.Vector3(faceLandmarks[263].x, faceLandmarks[263].y, faceLandmarks[263].z);
    const head107 = new THREE.Vector3(faceLandmarks[107].x, faceLandmarks[107].y, faceLandmarks[107].z);
    const head336 = new THREE.Vector3(faceLandmarks[336].x, faceLandmarks[336].y, faceLandmarks[336].z);
    const head151 = new THREE.Vector3(faceLandmarks[151].x, faceLandmarks[151].y, faceLandmarks[151].z);
    const newXAxis = rightEyeLandMark.clone().sub(leftEyeLandMark).normalize();
    const newZAxis = new THREE.Plane().setFromCoplanarPoints(head107, head336, head151).normal.normalize().multiplyScalar(-1);
    const newYAxis = new THREE.Vector3().crossVectors(newZAxis, newXAxis).normalize();

    const newRotation = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(newXAxis, newYAxis, newZAxis));

    if (currentRotation !== null) {
        const MIN_ROTATION_DIFFERENCE = 0.9999; // minimum cosine of angle difference to interpolate
        const startQuaternion = new THREE.Quaternion().setFromEuler(currentRotation);
        const endQuaternion = new THREE.Quaternion().setFromEuler(newRotation);
        const dotProduct = startQuaternion.dot(endQuaternion);

        if (dotProduct < MIN_ROTATION_DIFFERENCE) {
            startQuaternion.slerp(endQuaternion, 0.5);

            currentRotation = new THREE.Euler().setFromQuaternion(startQuaternion);
            // Perform interpolation between the two rotations
            mesh.rotation.x = currentRotation.x;
            mesh.rotation.y = currentRotation.y;
            mesh.rotation.z = currentRotation.z;
            mask.rotation.x = currentRotation.x;
            mask.rotation.y = currentRotation.y;
            mask.rotation.z = currentRotation.z;
        }
    }

    if (currentPosition !== null) {
        let finalPosition = newPosition.add(newYAxis.multiplyScalar(meshYOffset));
        let distance = finalPosition.distanceTo(currentPosition);
        if (distance > 0.025) {
            currentPosition.lerp(finalPosition, 0.5);
            mesh.position.copy(currentPosition);
            mask.position.copy(currentPosition);
        }
    }
}

async function loadModel(file) {
    var load = new GLTFLoader();
    return (await load.loadAsync(file, undefined)).scene;
}

function getTanDeg(deg) {
    const rad = (deg * Math.PI) / 180;
    return Math.tan(rad);
}
