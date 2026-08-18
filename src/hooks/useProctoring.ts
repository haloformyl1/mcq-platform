import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export function useProctoring(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSubmit: (reason: string) => void,
  isTestActive: boolean,
  faceAbsenceDelaySeconds: number = 10,
  maxAllowedWarnings: number = 5,
  enableAiProctoring: boolean = true,
  onWarningTrigger?: (warningType: "EYE_SLIP", message: string) => void
) {
  const [warningsLeft, setWarningsLeft] = useState(maxAllowedWarnings);
  const [showSlipWarning, setShowSlipWarning] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  
  const slipCount = useRef(0);
  const continuousSlipStartTime = useRef<number | null>(null);
  const detectorRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    setWarningsLeft(maxAllowedWarnings);
  }, [maxAllowedWarnings]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!enableAiProctoring) {
      setIsAiActive(false);
      return;
    }

    async function initDetector() {
      try {
        console.log("🔄 Initializing BlazeFace AI model...");
        await tf.ready();
        
        if (!detectorRef.current) {
          detectorRef.current = await blazeface.load();
        }
        setIsAiActive(true);
        isTrackingRef.current = true;
        console.log("✅ BlazeFace AI model successfully loaded!");
        
        if (isTestActive) {
          trackFace();
        }
      } catch (e) {
        console.error("❌ Face detection init failed", e);
      }
    }

    async function trackFace() {
      if (!isTrackingRef.current || !isTestActive) return;

      if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        // Keep retrying every 500ms until camera video element is ready
        timeoutId = setTimeout(trackFace, 500);
        return;
      }

      try {
        const returnTensors = false;
        // blazeface returns an array of faces.
        const faces = await detectorRef.current.estimateFaces(videoRef.current, returnTensors);
        const now = Date.now();
        
        if (faces.length === 0) {
          // No face detected / looking away
          if (continuousSlipStartTime.current === null) {
            continuousSlipStartTime.current = now;
            console.log("👁️ Face absence timer started at", new Date(now).toLocaleTimeString());
          } else {
            const delayMs = (faceAbsenceDelaySeconds || 10) * 1000;
            const elapsed = now - continuousSlipStartTime.current;
            console.log(`👁️ Face absence ongoing: ${Math.floor(elapsed / 1000)}s / ${faceAbsenceDelaySeconds}s`);
            
            if (elapsed >= delayMs) {
              continuousSlipStartTime.current = null; // reset timer
              handleSlip();
            }
          }
        } else {
          // Face is visible. Only reset if face is detected continuously for 2 checks
          if (continuousSlipStartTime.current !== null) {
            console.log("🟢 Face detected again. Resetting absence timer.");
            continuousSlipStartTime.current = null;
          }
        }
      } catch (e) {
        console.error("Frame detection error:", e);
      }

      if (isTrackingRef.current && isTestActive) {
        timeoutId = setTimeout(trackFace, 1500); // Check once every 1.5s
      }
    }

    function handleSlip() {
      slipCount.current += 1;

      const message = `Face absence / looking away detected for over ${faceAbsenceDelaySeconds || 30}s`;
      console.warn("⚠️ EYE_SLIP Triggered silently:", message);
      if (onWarningTrigger) {
        onWarningTrigger("EYE_SLIP", message);
      }
    }

    if (isTestActive && enableAiProctoring) {
      initDetector();
    }

    return () => {
      isTrackingRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [videoRef, isTestActive, onSubmit, faceAbsenceDelaySeconds, maxAllowedWarnings, enableAiProctoring, onWarningTrigger, videoRef?.current]);

  return {
    warningsLeft,
    showSlipWarning,
    setShowSlipWarning,
    isAiActive
  };
}

