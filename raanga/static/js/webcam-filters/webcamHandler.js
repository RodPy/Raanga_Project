let videoRef;
let drawingCanvasElement;
let webcamContainer;
let mounted = false;
let cameraOn = false;
let cameraToggleButton;

/*#######################################################################################################
Webcam section
########################################################################################################*/
const handleStartCamera = async () => {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });
        cameraOn = true;
        webcamContainer.hidden = false;
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

async function webcamToggleButton(type, model_url, offset_x, offset_y, offset_z, scale_multiplier) {
    if (cameraOn) {
        cameraOn = false;
        handleStopCamera();
        webcamContainer.hidden = true;
        handleVisionStop();
        return;
    }

    await handleStartCamera();
    if (cameraOn) {
        await handleVisionInitialization(type, model_url, offset_x, offset_y, offset_z, scale_multiplier);
    }
}

async function handleVisionInitialization(type, model_url, offset_x, offset_y, offset_z, scale_multiplier) {
    if (type === "G") {
        await setupFaceLandmarker(videoRef, faceFilterDrawLogic);
        runFaceLandmarkDetector();
    }
    if (type === "C") {

    }
}

function handleVisionStop() {
    stopFaceLandmarkDetector();
}

const faceFilterDrawLogic = (results) => {
    if (results.faceLandmarks) {
        try {
            console.log("Recieving frames");
            //glassesDrawer.AnimateThree(results);
        } catch (error) {
            console.log(error);
        }
    }
};

const onMount = async () => {
    webcamContainer = document.getElementById("webcam-container");

    drawingCanvasElement = document.getElementById("drawing-canvas");
    videoRef = document.getElementById("webcam-feed");

    cameraToggleButton = document.getElementById("camera-toggle-button");

    mounted = true;
};


/*#######################################################################################################
faceLandmarker Section
########################################################################################################*/


let vision = window;
//const FaceLanmarker = vision.FaceLandmarker_1;
//const FilesetResolver = vision.FilesetResolver_1;

let faceLandmarker;
let runningMode = "VIDEO";
let webcamRunning = false;
let videoElement;
let lastVideoTime = -1;
let results = undefined;
let landmarkSubscriber;

async function setupFaceLandmarker(video, subscriber) {
    console.log("aaaaa");
    videoElement = video;
    landmarkSubscriber = subscriber;
    const filesetResolver = await vision.FilesetResolver_1.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
}

async function runFaceLandmarkDetector() {
    webcamRunning = true;
    // Read more `CopyWebpackPlugin`, copy wasm set from "https://cdn.skypack.dev/node_modules" to `/wasm`

    faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
        runningMode,
        numFaces: 1
    });
    predictWebcam();
}

function stopFaceLandmarkDetector() {
    if (faceLandmarker !== undefined) {
        webcamRunning = false;
    }
}
function predictWebcam() {
    // Now let's start detecting the stream.
    if (webcamRunning === false) {
        faceLandmarker.close();
        return;
    }
    let nowInMs = Date.now();
    if (lastVideoTime !== videoElement.currentTime) {
        lastVideoTime = videoElement.currentTime;
        results = faceLandmarker.detectForVideo(videoElement, nowInMs);
    }
    if (results.faceLandmarks) {
        landmarkSubscriber(results)
    }
    window.requestAnimationFrame(predictWebcam);
}

/*#######################################################################################################
poseLandmarker Section
########################################################################################################*/