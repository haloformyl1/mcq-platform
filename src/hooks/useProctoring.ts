import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface ProctoringAttemptInfo {
  attemptId: string;
  studentId: string;
  testId: string;
  studentName?: string;
  studentEmail?: string;
  testTitle?: string;
}

export interface ProctoringRules {
  eyeSlipDurationSeconds?: number;
  maxPhoneWarnings?: number;
  maxMultiPersonWarnings?: number;
  maxEyeSlipWarnings?: number;
  maxTotalWarnings?: number;
}

export function useProctoring(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSubmit: (reason: string) => void,
  isTestActive: boolean,
  attemptInfo?: ProctoringAttemptInfo,
  proctoringRules?: ProctoringRules
) {
  const eyeSlipDurationSeconds = proctoringRules?.eyeSlipDurationSeconds ?? 10;
  const maxPhoneWarnings = proctoringRules?.maxPhoneWarnings ?? 1;
  const maxMultiPersonWarnings = proctoringRules?.maxMultiPersonWarnings ?? 1;
  const maxEyeSlipWarnings = proctoringRules?.maxEyeSlipWarnings ?? 3;
  const maxTotalWarnings = proctoringRules?.maxTotalWarnings ?? 3;

  const [warningsLeft, setWarningsLeft] = useState(maxTotalWarnings);
  const [showSlipWarning, setShowSlipWarning] = useState(false);
  const [violationType, setViolationType] = useState<string>("PROCTORING_VIOLATION");
  const [violationMessage, setViolationMessage] = useState<string>("");
  const [isAiActive, setIsAiActive] = useState(false);

  const totalWarningCount = useRef(0);
  const phoneWarningCount = useRef(0);
  const multiPersonWarningCount = useRef(0);
  const eyeSlipWarningCount = useRef(0);

  const continuousSlipStartTime = useRef<number | null>(null);
  const faceDetectorRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const objectDetectorRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const isTrackingRef = useRef(false);
  const lastViolationTime = useRef(0);

  const captureSnapshot = (): string | null => {
    if (!videoRef.current) return null;
    try {
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) return null;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch (e) {
      console.error("Failed to capture snapshot", e);
      return null;
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function initDetectors() {
      try {
        await tf.ready();

        const [faceModel, cocoModel] = await Promise.all([
          blazeface.load(),
          cocoSsd.load({ base: 'lite_mobilenet_v2' })
        ]);

        faceDetectorRef.current = faceModel;
        objectDetectorRef.current = cocoModel;

        setIsAiActive(true);
        isTrackingRef.current = true;

        if (isTestActive) {
          trackFrame();
        }
      } catch (e) {
        console.error("AI proctoring detector initialization failed", e);
      }
    }

    const reportViolation = (type: string, message: string) => {
      const now = Date.now();
      // Cooldown of 4 seconds between violation warnings
      if (now - lastViolationTime.current < 4000) return;
      lastViolationTime.current = now;

      let isMaxReached = false;
      totalWarningCount.current += 1;
      const currentTotal = totalWarningCount.current;

      if (type === "CELL_PHONE_DETECTED") {
        phoneWarningCount.current += 1;
        if (maxPhoneWarnings > 0 && phoneWarningCount.current >= maxPhoneWarnings) {
          isMaxReached = true;
        }
      } else if (type === "MULTIPLE_PERSONS_DETECTED") {
        multiPersonWarningCount.current += 1;
        if (maxMultiPersonWarnings > 0 && multiPersonWarningCount.current >= maxMultiPersonWarnings) {
          isMaxReached = true;
        }
      } else if (type === "EYE_SLIP") {
        eyeSlipWarningCount.current += 1;
        if (maxEyeSlipWarnings > 0 && eyeSlipWarningCount.current >= maxEyeSlipWarnings) {
          isMaxReached = true;
        }
      }

      if (currentTotal >= maxTotalWarnings) {
        isMaxReached = true;
      }

      const remaining = Math.max(0, maxTotalWarnings - currentTotal);
      setWarningsLeft(remaining);
      setViolationType(type);
      setViolationMessage(message);

      const snapshotBase64 = captureSnapshot();

      // Send violation log to backend API immediately
      if (attemptInfo?.attemptId) {
        fetch("/api/exam/proctoring-violation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: attemptInfo.attemptId,
            studentId: attemptInfo.studentId,
            testId: attemptInfo.testId,
            violationType: type,
            message: message,
            snapshotBase64: snapshotBase64,
            warningNumber: currentTotal,
          }),
        }).catch(err => console.error("Violation reporting failed:", err));
      }

      if (isMaxReached) {
        onSubmit(type);
      } else {
        setShowSlipWarning(true);
      }
    };

    async function trackFrame() {
      if (
        !isTrackingRef.current ||
        !isTestActive ||
        !videoRef.current ||
        videoRef.current.readyState < 2
      ) {
        if (isTrackingRef.current && isTestActive) {
          timeoutId = setTimeout(trackFrame, 500);
        }
        return;
      }

      try {
        const videoEl = videoRef.current;
        const now = Date.now();

        // 1. Cell Phone Detection via COCO-SSD (if allowed > 0)
        if (objectDetectorRef.current && maxPhoneWarnings !== 0) {
          const predictions = await objectDetectorRef.current.detect(videoEl);
          const phoneObj = predictions.find(
            p => (p.class === 'cell phone' || p.class === 'mobile phone' || p.class === 'phone') && p.score >= 0.40
          );

          if (phoneObj) {
            reportViolation(
              "CELL_PHONE_DETECTED",
              "Cell phone / mobile device detected in camera frame."
            );
          }
        }

        // 2. Face Detection via BlazeFace
        if (faceDetectorRef.current) {
          const faces = await faceDetectorRef.current.estimateFaces(videoEl, false);

          if (faces.length > 1 && maxMultiPersonWarnings !== 0) {
            reportViolation(
              "MULTIPLE_PERSONS_DETECTED",
              `Multiple people (${faces.length} faces) detected in camera frame.`
            );
          } else if (faces.length === 0 && maxEyeSlipWarnings !== 0) {
            // Missing face / looking away check based on configured eyeSlipDurationSeconds
            const requiredThresholdMs = eyeSlipDurationSeconds * 1000;

            if (continuousSlipStartTime.current === null) {
              continuousSlipStartTime.current = now;
            } else if (now - continuousSlipStartTime.current >= requiredThresholdMs) {
              continuousSlipStartTime.current = null;
              reportViolation(
                "EYE_SLIP",
                `You looked away or face was missing from screen for over ${eyeSlipDurationSeconds} seconds.`
              );
            }
          } else {
            // Exactly 1 face visible -> clear missing face timer
            continuousSlipStartTime.current = null;
          }
        }
      } catch (e) {
        // Ignore single frame processing error
      }

      if (isTrackingRef.current && isTestActive) {
        timeoutId = setTimeout(trackFrame, 500);
      }
    }

    if (isTestActive) {
      initDetectors();
    }

    return () => {
      isTrackingRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [
    videoRef,
    isTestActive,
    onSubmit,
    attemptInfo,
    eyeSlipDurationSeconds,
    maxPhoneWarnings,
    maxMultiPersonWarnings,
    maxEyeSlipWarnings,
    maxTotalWarnings,
  ]);

  return {
    warningsLeft,
    showSlipWarning,
    setShowSlipWarning,
    violationType,
    violationMessage,
    isAiActive,
  };
}
