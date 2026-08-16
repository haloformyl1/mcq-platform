import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export function useProctoring(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSubmit: (reason: string) => void,
  isTestActive: boolean,
  faceAbsenceDelaySeconds: number = 10,
  maxAllowedWarnings: number = 5,
  enableAiProctoring: boolean = true
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
        await tf.ready();
        
        detectorRef.current = await blazeface.load();
        setIsAiActive(true);
        isTrackingRef.current = true;
        
        if (isTestActive) {
          trackFace();
        }
      } catch (e) {
        console.error("Face detection init failed", e);
      }
    }

    async function trackFace() {
      if (!isTrackingRef.current || !isTestActive || !detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        if (isTrackingRef.current && isTestActive) {
          timeoutId = setTimeout(trackFace, 500);
        }
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
          } else {
            const delayMs = (faceAbsenceDelaySeconds || 10) * 1000;
            if (now - continuousSlipStartTime.current >= delayMs) {
              continuousSlipStartTime.current = null; // reset timer
              handleSlip();
            }
          }
        } else {
          // Face is visible
          continuousSlipStartTime.current = null;
        }
      } catch (e) {
        // Ignore frame processing errors
      }

      if (isTrackingRef.current && isTestActive) {
        timeoutId = setTimeout(trackFace, 1500); // Check once every 1.5s to prevent UI lag
      }
    }

    function handleSlip() {
      slipCount.current += 1;
      const maxSlips = maxAllowedWarnings || 5;

      if (slipCount.current >= maxSlips) {
        onSubmit("EXCESSIVE_EYE_SLIP");
      } else {
        setWarningsLeft(maxSlips - slipCount.current);
        setShowSlipWarning(true);
      }
    }

    if (isTestActive && enableAiProctoring) {
      initDetector();
    }

    return () => {
      isTrackingRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [videoRef, isTestActive, onSubmit, faceAbsenceDelaySeconds, maxAllowedWarnings, enableAiProctoring]);

  return {
    warningsLeft,
    showSlipWarning,
    setShowSlipWarning,
    isAiActive
  };
}
