'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertTriangle, ShieldCheck, Minimize2, Maximize2, RefreshCw } from 'lucide-react';
import { analyzeWebcamFrame, captureWebcamSnapshot } from '@/lib/aiProctor';

interface WebcamProctorProps {
  attemptId: string;
  maxWarnings?: number;
  onMaxWarningsExceeded: (reason: string) => void;
}

export default function WebcamProctor({
  attemptId,
  maxWarnings = 5,
  onMaxWarningsExceeded
}: WebcamProctorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [cameraPermissionState, setCameraPermissionState] = useState<'LOADING' | 'GRANTED' | 'DENIED'>('LOADING');
  
  const [warningCount, setWarningCount] = useState<number>(0);
  const [aiStatus, setAiStatus] = useState<string>('Initializing AI Proctoring...');
  const [statusColor, setStatusColor] = useState<'green' | 'amber' | 'red'>('green');
  const [latestWarningMessage, setLatestWarningMessage] = useState<string | null>(null);

  const noFaceTimerRef = useRef<number>(0);
  const lastViolationTimeRef = useRef<number>(0);

  // Initialize camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initCamera() {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
        setCameraPermissionState('GRANTED');
        setAiStatus('AI Vision Active — Monitoring Room');
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraPermissionState('DENIED');
        setAiStatus('Camera Access Required for Exam');
      }
    }

    initCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Log violation to backend
  const triggerViolation = async (type: string, message: string, confidenceScore?: number) => {
    const now = Date.now();
    // Cooldown 4 seconds between violation warnings
    if (now - lastViolationTimeRef.current < 4000) return;
    lastViolationTimeRef.current = now;

    const nextWarning = warningCount + 1;
    setWarningCount(nextWarning);
    setLatestWarningMessage(`Warning ${nextWarning} of ${maxWarnings}: ${message}`);
    setStatusColor('red');

    // Play warning sound beep using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}

    // Capture webcam snapshot
    let snapshotBase64: string | null = null;
    if (videoRef.current) {
      snapshotBase64 = captureWebcamSnapshot(videoRef.current);
    }

    // Send log to server
    try {
      const res = await fetch('/api/exam/proctoring-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          violationType: type,
          warningNumber: nextWarning,
          message,
          snapshotBase64,
          confidenceScore
        })
      });
      const data = await res.json();

      if (data.shouldAutoSubmit || nextWarning >= maxWarnings) {
        alert(`🚨 EXAM DISQUALIFIED / AUTO-SUBMITTED!\n\nYou have accumulated ${maxWarnings} proctoring warnings (${message}). Your exam is being submitted immediately.`);
        onMaxWarningsExceeded(`PROCTORING_VIOLATIONS_${nextWarning}`);
      }
    } catch (err) {
      console.error('Failed to log violation:', err);
    }

    // Reset status banner color after 3 seconds
    setTimeout(() => {
      setStatusColor('green');
      setLatestWarningMessage(null);
    }, 4500);
  };

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_SWITCH', 'Switched browser tab or minimized window during exam');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [warningCount, attemptId]);

  // AI Object & Face Detection Loop (Runs every 800ms)
  useEffect(() => {
    if (cameraPermissionState !== 'GRANTED' || !videoRef.current) return;

    let intervalId: any = null;

    intervalId = setInterval(async () => {
      if (!videoRef.current) return;

      const result = await analyzeWebcamFrame(videoRef.current);

      if (result.phoneDetected) {
        triggerViolation('CELL_PHONE', 'Mobile Phone / Smartphone detected in camera view', result.phoneScore);
      } else if (result.personCount > 1) {
        triggerViolation('MULTIPLE_FACES', `Multiple people detected in camera frame (${result.personCount} persons)`);
      } else if (result.personCount === 0) {
        noFaceTimerRef.current += 1;
        if (noFaceTimerRef.current >= 6) { // ~5 seconds without face
          noFaceTimerRef.current = 0;
          triggerViolation('NO_FACE', 'No face detected in camera view for more than 5 seconds');
        }
      } else {
        noFaceTimerRef.current = 0;
      }
    }, 800);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraPermissionState, warningCount, attemptId]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 font-sans select-none">
      {/* Warning Alert Banner */}
      {latestWarningMessage && (
        <div className="animate-bounce bg-red-900 text-white border-2 border-red-500 py-2 px-4 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold max-w-xs sm:max-w-md">
          <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0" />
          <span>{latestWarningMessage}</span>
        </div>
      )}

      {/* Floating Proctoring Widget */}
      <div className="bg-[#121212]/95 border border-[#333333] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-300 w-64 sm:w-72">
        {/* Widget Header */}
        <div className="bg-[#1a1a1a] px-3 py-2 border-b border-[#333333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor === 'green' ? 'bg-green-400 animate-pulse' : statusColor === 'amber' ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-ping'}`}></span>
            <span className="text-xs font-bold text-white tracking-wide">AI Proctor</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${warningCount > 0 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-green-950 text-green-300 border border-green-800'}`}>
              Warnings: {warningCount}/{maxWarnings}
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white p-1 rounded transition"
              title={isCollapsed ? 'Expand Camera' : 'Collapse Camera'}
            >
              {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Widget Body */}
        {!isCollapsed && (
          <div className="p-2 space-y-2">
            {cameraPermissionState === 'LOADING' && (
              <div className="h-36 bg-[#181818] rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span>Starting Camera & AI...</span>
              </div>
            )}

            {cameraPermissionState === 'DENIED' && (
              <div className="h-36 bg-red-950/40 border border-red-800/60 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1.5">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <p className="text-xs font-bold text-red-300">Camera Access Blocked!</p>
                <p className="text-[10px] text-gray-300">Please enable your browser camera permission to take this exam.</p>
              </div>
            )}

            <div className={`relative rounded-lg overflow-hidden border ${statusColor === 'red' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-[#262626]'} ${cameraPermissionState !== 'GRANTED' ? 'hidden' : 'block'}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-36 object-cover bg-black transform -scale-x-100"
              />

              {/* Status overlay tag */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-gray-200 flex items-center gap-1 border border-white/10">
                <ShieldCheck className="w-3 h-3 text-green-400" />
                <span className="truncate max-w-[170px]">{aiStatus}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
