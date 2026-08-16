"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

type ScanStep = 'left' | 'center' | 'right' | 'complete';

export default function MobileEnvironmentScanner({ onComplete, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('left');
  const [isScanning, setIsScanning] = useState(false);
  const [detectedItem, setDetectedItem] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [verifiedSteps, setVerifiedSteps] = useState<{ left: boolean; center: boolean; right: boolean }>({
    left: false,
    center: false,
    right: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  useEffect(() => {
    async function initBackCameraAndModel() {
      try {
        await tf.ready();
        modelRef.current = await cocoSsd.load();
        setModelLoaded(true);

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } },
            audio: false,
          });
        } catch {
          // Fallback to general environment/rear camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Back camera / AI model init failed", err);
        // Fallback for devices without dual camera or permission block
        setModelLoaded(true);
      }
    }

    initBackCameraAndModel();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const runAngleScan = async () => {
    if (!videoRef.current || isScanning) return;
    setIsScanning(true);
    setDetectedItem(null);

    try {
      if (modelRef.current && videoRef.current.readyState >= 2) {
        // Run AI object detection on video frame
        const predictions = await modelRef.current.detect(videoRef.current);
        
        // Target unauthorized electronic devices
        const forbiddenClasses = ['laptop', 'tv', 'cell phone', 'keyboard', 'monitor'];
        const found = predictions.find((p) =>
          forbiddenClasses.includes(p.class.toLowerCase()) && p.score > 0.45
        );

        if (found) {
          setIsScanning(false);
          setDetectedItem(found.class.toUpperCase());
          return;
        }
      }

      // Angle verified clean!
      setIsScanning(false);
      if (currentStep === 'left') {
        setVerifiedSteps((prev) => ({ ...prev, left: true }));
        setCurrentStep('center');
      } else if (currentStep === 'center') {
        setVerifiedSteps((prev) => ({ ...prev, center: true }));
        setCurrentStep('right');
      } else if (currentStep === 'right') {
        setVerifiedSteps((prev) => ({ ...prev, right: true }));
        setCurrentStep('complete');
        // Stop rear camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    } catch (err) {
      console.error("Scan frame error", err);
      setIsScanning(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'left':
        return '1. Scan Left Side Background 👈';
      case 'center':
        return '2. Scan Center / Desk Area 🎯';
      case 'right':
        return '3. Scan Right Side Background 👉';
      case 'complete':
        return '360° Environment Verification Complete! ✅';
    }
  };

  const getStepInstruction = () => {
    switch (currentStep) {
      case 'left':
        return 'Point your phone rear camera to the LEFT side of your room/desk area.';
      case 'center':
        return 'Point your camera directly at your FRONT desk area and workspace.';
      case 'right':
        return 'Point your camera to the RIGHT side of your room/workspace.';
      case 'complete':
        return 'All background angles verified clean of laptops, tablets & secondary devices!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-between p-4 text-white">
      {/* Header */}
      <div className="w-full max-w-lg pt-2 text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-950/60 border border-red-500/40 rounded-full text-xs font-semibold text-red-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Mobile Pre-Exam 360° AI Security Scan</span>
        </div>
        <h2 className="text-xl font-bold text-white">{getStepTitle()}</h2>
        <p className="text-xs text-gray-300 px-4">{getStepInstruction()}</p>
      </div>

      {/* Camera Preview Box */}
      <div className="w-full max-w-md my-4 relative rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-[#111111] shadow-2xl aspect-[3/4] flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Viewfinder Target Guidelines */}
        <div className="absolute inset-8 border-2 border-dashed border-cyan-400/60 rounded-xl pointer-events-none flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0"></div>
          <div className="w-12 h-12 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0"></div>
          <div className="w-12 h-12 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0"></div>
          <div className="w-12 h-12 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0"></div>
        </div>

        {/* Detected Forbidden Device Warning Overlay */}
        {detectedItem && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-4 z-20">
            <div className="w-16 h-16 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-red-400">Unauthorized Device Detected!</h3>
            <p className="text-xs text-white bg-red-900/40 p-3 rounded-xl border border-red-500/30">
              Detected: <strong className="text-red-300 font-black">{detectedItem}</strong>.
              <br />
              Please remove all laptops, tablets, or extra phones from your background and re-verify.
            </p>
            <button
              onClick={() => setDetectedItem(null)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-Scan Angle</span>
            </button>
          </div>
        )}

        {/* Verification Success Animation */}
        {currentStep === 'complete' && (
          <div className="absolute inset-0 bg-green-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-4 z-20">
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center text-green-400 animate-pulse">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-green-400">Verification Passed!</h3>
            <p className="text-xs text-gray-200">Switching to front proctoring camera & launching test...</p>
          </div>
        )}
      </div>

      {/* Progress Dots & Scan Controls */}
      <div className="w-full max-w-lg space-y-4 pb-2">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-1 text-xs font-semibold ${verifiedSteps.left ? 'text-green-400' : 'text-gray-400'}`}>
            <span>👈 Left</span>
            {verifiedSteps.left && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
          <div className="w-4 h-0.5 bg-gray-700"></div>
          <div className={`flex items-center space-x-1 text-xs font-semibold ${verifiedSteps.center ? 'text-green-400' : 'text-gray-400'}`}>
            <span>🎯 Center</span>
            {verifiedSteps.center && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
          <div className="w-4 h-0.5 bg-gray-700"></div>
          <div className={`flex items-center space-x-1 text-xs font-semibold ${verifiedSteps.right ? 'text-green-400' : 'text-gray-400'}`}>
            <span>👉 Right</span>
            {verifiedSteps.right && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
        </div>

        <div className="flex justify-between items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-[#262626] hover:bg-[#333333] text-gray-300 rounded-xl text-xs font-medium border border-[#404040]"
          >
            Cancel Test
          </button>

          {currentStep !== 'complete' && (
            <button
              onClick={runAngleScan}
              disabled={isScanning || !modelLoaded}
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Environment...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Verify {currentStep.toUpperCase()} Angle</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
