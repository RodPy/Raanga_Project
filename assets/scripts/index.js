import * as faceLandmarker from "./webcam-filters/faceLandmarker.js";
import * as glassesDrawer from "./webcam-filters/glassesDrawer.js";

let videoStream;
let videoRef;
let videoWidth = 450;
let drawingCanvasElement;
let webcamContainer;
let mounted = false;
let cameraOn = false;
let cameraToggleButton;
let type, model_url, offset_x, offset_y, offset_z, scale_multiplier;

const handleStartCamera = async () => {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });
        cameraOn = true;
        webcamContainer.hidden = false;
        drawingCanvasElement.hidden = false;
        videoRef.srcObject = videoStream;
        //videoRef.addEventListener("loadeddata", StartVision);
    } catch (error) {
        console.error("Error starting camera:", error);
    }
};

const handleStopCamera = () => {
    videoStream.getTracks().forEach((track) => track.stop());
    videoRef.srcObject = null;
    cameraOn = false;
};

async function webcamToggleButton() {
    if (cameraOn) {
        cameraOn = false;
        handleStopCamera();
        webcamContainer.hidden = true;
        drawingCanvasElement.hidden = true;
        handleVisionStop();
        return;
    }

    await handleStartCamera();
    if (cameraOn) {
        //await InitializeThreeFaceFilter();
        await handleVisionInitialization();
    }
}

async function handleVisionInitialization() {
    if (type === "G") {

        await faceLandmarker.runFaceLandmarkDetector();
    }
    if (type === "C") {

    }
}

function handleVisionStop() {
    faceLandmarker.stopFaceLandmarkDetector();
}

const faceFilterDrawLogic = (results) => {
    if (results.faceLandmarks) {
        try {

            glassesDrawer.AnimateThree(results);
        } catch (error) {
            console.log(error);
        }
    }
};
async function InitializeThreeFaceFilter(h, w)
{
    const radio = h / w;
    console.log(radio);
    videoRef.style.width = videoWidth + "px";
    videoRef.style.height = videoWidth * radio + "px";
    videoRef.style.top = Math.ceil((videoWidth*(1-radio)) / 2) + "px";
    drawingCanvasElement.style.width = videoWidth + "px";
    drawingCanvasElement.style.height = videoWidth * radio + "px";
    drawingCanvasElement.width = videoWidth;
    drawingCanvasElement.height = videoWidth * radio;
    
    await glassesDrawer.ThreeSetup(drawingCanvasElement, scale_multiplier, model_url, offset_x, offset_y, offset_z);
}

const onMount = async () => {
    webcamContainer = document.getElementById("webcam-container");

    
    drawingCanvasElement = document.getElementById("drawing-canvas");
    videoRef = document.getElementById("webcam-feed");

    videoRef.addEventListener( "loadedmetadata", function () {
        // retrieve dimensions
        const height = this.videoHeight;
        const width = this.videoWidth;

        // send back result
        InitializeThreeFaceFilter(height, width);
    }, false);

    cameraToggleButton = document.getElementById("camera-toggle-button");
    cameraToggleButton.addEventListener('click', webcamToggleButton);

    const data = document.getElementById("product-detail-script").dataset;

    type = data.productType;
    model_url = data.productModel;
    offset_x = data.offsetX;
    offset_y = data.offsetY;
    offset_z = data.offsetZ;
    scale_multiplier = data.scaleMultiplier;

    mounted = true;
    if (type === "G") {
        await faceLandmarker.setupFaceLandmarker(videoRef, faceFilterDrawLogic);
        
    }
    if (type === "C") {

    }
};

window.addEventListener('DOMContentLoaded', async () => {
    await onMount();
    console.log(type, model_url, offset_x, offset_y, offset_z, scale_multiplier);
});

