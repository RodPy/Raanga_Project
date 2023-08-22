import vision from "@mediapipe/tasks-vision";
const { FaceLandmarker, FilesetResolver } = vision;

let faceLandmarker;
let runningMode= "VIDEO";
let webcamRunning = false;
let videoElement;
let lastVideoTime = -1;
let results = undefined;
let landmarkSubscriber;
let faceLandmarkFilesetResolver;
  
export async function setupFaceLandmarker(video, subscriber) {
  videoElement = video;
  landmarkSubscriber = subscriber;
  faceLandmarkFilesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
}

export async function runFaceLandmarkDetector() {
  webcamRunning = true;
  // Read more `CopyWebpackPlugin`, copy wasm set from "https://cdn.skypack.dev/node_modules" to `/wasm`

  faceLandmarker = await FaceLandmarker.createFromOptions(faceLandmarkFilesetResolver, {
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
export function stopFaceLandmarkDetector()
{
  if (faceLandmarker !== undefined)
  {
    webcamRunning = false;
  }
}
/********************************************************************
// FaceLandmark Provider: Continuously grab image from webcam stream.
********************************************************************/
function predictWebcam() {
  // Now let's start detecting the stream.
  if (webcamRunning === false){
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