import { useEffect, useRef, useState } from 'react';

export function useAudioProctoring(
  stream: MediaStream | null,
  onSubmit: (reason: string) => void,
  isTestActive: boolean,
  audioNoiseDelaySeconds: number = 10,
  maxAudioWarnings: number = 3,
  enableAudioProctoring: boolean = true,
  onWarningTrigger?: (warningType: "AUDIO_NOISE", message: string) => void
) {
  const [audioWarningsLeft, setAudioWarningsLeft] = useState(maxAudioWarnings);
  const [showAudioWarning, setShowAudioWarning] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const audioWarningCount = useRef(0);
  const continuousNoiseStartTime = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setAudioWarningsLeft(maxAudioWarnings);
  }, [maxAudioWarnings]);

  useEffect(() => {
    if (!enableAudioProctoring || !isTestActive || !stream) {
      setIsAudioActive(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setIsAudioActive(false);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setIsAudioActive(true);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const averageVolume = sum / bufferLength;
        const volumeThreshold = 25; // Sensitivity threshold for speech / noise

        const now = Date.now();

        if (averageVolume > volumeThreshold) {
          if (continuousNoiseStartTime.current === null) {
            continuousNoiseStartTime.current = now;
          } else {
            const delayMs = (audioNoiseDelaySeconds || 10) * 1000;
            if (now - continuousNoiseStartTime.current >= delayMs) {
              continuousNoiseStartTime.current = null; // reset timer
              handleAudioViolation();
            }
          }
        } else {
          continuousNoiseStartTime.current = null;
        }
      };

      const intervalId = setInterval(checkVolume, 500);

      const handleAudioViolation = () => {
        audioWarningCount.current += 1;
        const maxLimit = maxAudioWarnings || 3;

        const message = `Continuous background sound/speech detected for over ${audioNoiseDelaySeconds || 10}s`;
        if (onWarningTrigger) {
          onWarningTrigger("AUDIO_NOISE", message);
        }

        if (audioWarningCount.current >= maxLimit) {
          onSubmit("EXCESSIVE_AUDIO_NOISE");
        } else {
          setAudioWarningsLeft(maxLimit - audioWarningCount.current);
          setShowAudioWarning(true);
        }
      };

      return () => {
        clearInterval(intervalId);
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      };
    } catch (err) {
      console.error("Audio proctoring initialization error:", err);
    }
  }, [stream, isTestActive, enableAudioProctoring, audioNoiseDelaySeconds, maxAudioWarnings, onSubmit, onWarningTrigger]);

  return {
    audioWarningsLeft,
    showAudioWarning,
    setShowAudioWarning,
    isAudioActive
  };
}

