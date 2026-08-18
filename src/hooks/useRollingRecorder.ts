import { useEffect, useRef, useCallback } from 'react';

export function useRollingRecorder(stream: MediaStream | null) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (!stream) return;

    // Pick best mimeType supported natively by browser
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    try {
      const options: MediaRecorderOptions = {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 250000 // 250 kbps ensures 1-min video stays under ~2 MB (well below Vercel's 4.5 MB limit)
      };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          // Retain latest ~65 slices (60s / 1 min rolling buffer)
          if (recordedChunksRef.current.length > 65) {
            recordedChunksRef.current.shift();
          }
        }
      };

      // Request continuous slices every 1000ms
      recorder.start(1000);
      isRecordingRef.current = true;
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
    }

    return () => {
      isRecordingRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
    };
  }, [stream]);

  const get1MinClipBlob = useCallback(async (): Promise<Blob | null> => {
    if (recordedChunksRef.current.length === 0) return null;

    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const blob = new Blob([...recordedChunksRef.current], { type: mimeType });
    return blob;
  }, []);

  return { get1MinClipBlob };
}




