import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

export async function loadProctoringModel(): Promise<cocoSsd.ObjectDetection> {
  if (!modelPromise) {
    await tf.ready();
    modelPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' });
  }
  return modelPromise;
}

export interface DetectionResult {
  phoneDetected: boolean;
  phoneScore: number;
  personCount: number;
  allDetections: Array<{
    class: string;
    score: number;
    bbox: [number, number, number, number];
  }>;
}

export async function analyzeWebcamFrame(
  video: HTMLVideoElement
): Promise<DetectionResult> {
  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return {
      phoneDetected: false,
      phoneScore: 0,
      personCount: 0,
      allDetections: []
    };
  }

  try {
    const model = await loadProctoringModel();
    const predictions = await model.detect(video, 10, 0.4);

    let phoneDetected = false;
    let phoneScore = 0;
    let personCount = 0;

    const allDetections = predictions.map(p => {
      const className = p.class.toLowerCase();
      if (className.includes('cell phone') || className.includes('phone') || className.includes('remote')) {
        if (p.score > 0.45) {
          phoneDetected = true;
          phoneScore = Math.max(phoneScore, p.score);
        }
      }
      if (className === 'person') {
        if (p.score > 0.5) {
          personCount++;
        }
      }
      return {
        class: p.class,
        score: p.score,
        bbox: p.bbox
      };
    });

    return {
      phoneDetected,
      phoneScore,
      personCount,
      allDetections
    };
  } catch (err) {
    console.error('Error analyzing webcam frame with AI:', err);
    return {
      phoneDetected: false,
      phoneScore: 0,
      personCount: 0,
      allDetections: []
    };
  }
}

export function captureWebcamSnapshot(video: HTMLVideoElement): string | null {
  if (!video || video.readyState < 2) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (err) {
    console.error('Failed to capture webcam snapshot:', err);
    return null;
  }
}
