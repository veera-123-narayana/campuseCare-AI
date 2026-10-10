import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { Camera, Video, Upload, RefreshCw, Play, Square, Eye, ShieldCheck, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SegmentedControl, SegmentOption } from '../ui/SegmentedControl';
import { SourceBadge } from '../ui/SourceBadge';
import { EmptyState } from '../ui/EmptyState';

export type VideoSourceOption = 'laptop' | 'phone' | 'file';

interface ClassroomCameraDemoCardProps {
  onFaceCountChange?: (faceCount: number, isRunning: boolean) => void;
  isSimulationMode?: boolean;
  className?: string;
}

export const ClassroomCameraDemoCard: React.FC<ClassroomCameraDemoCardProps> = ({
  onFaceCountChange,
  isSimulationMode = true,
  className = '',
}) => {
  const [sourceType, setSourceType] = useState<VideoSourceOption>('laptop');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [phoneFacingMode, setPhoneFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Model loading state
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<boolean>(false);

  // Detection pipeline states
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [faceCount, setFaceCount] = useState<number>(0);
  const [avgConfidence, setAvgConfidence] = useState<number | null>(null);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [frameDimensions, setFrameDimensions] = useState<{ width: number; height: number } | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoFileUrlRef = useRef<string | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Source options for SegmentedControl
  const sourceOptions: SegmentOption<VideoSourceOption>[] = [
    { value: 'laptop', label: 'Laptop camera' },
    { value: 'phone', label: 'Phone camera' },
    { value: 'file', label: 'Classroom video file' },
  ];

  // Load MediaPipe FaceDetector
  const initModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setModelError(false);

      // Attempt 1: Local wasm path, fallback to CDN
      let vision: any;
      try {
        vision = await FilesetResolver.forVisionTasks('/wasm');
      } catch (localWasmErr) {
        console.warn('Local WASM failed, trying CDN fallback:', localWasmErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
      }

      // Try local model first, then CDN with correct blaze_face path
      const modelCandidates = [
        '/models/blaze_face_short_range.tflite',
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
      ];

      let detector: FaceDetector | null = null;
      let lastError: any = null;

      for (const modelPath of modelCandidates) {
        // Try GPU delegate first
        try {
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.3,
          });
          if (detector) break;
        } catch (gpuErr) {
          // Fallback to CPU delegate
          try {
            detector = await FaceDetector.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: modelPath,
                delegate: 'CPU',
              },
              runningMode: 'VIDEO',
              minDetectionConfidence: 0.3,
            });
            if (detector) break;
          } catch (cpuErr) {
            lastError = cpuErr;
          }
        }
      }

      if (!detector) {
        throw lastError || new Error('All model candidates failed');
      }

      detectorRef.current = detector;
      setIsModelLoading(false);
    } catch (err) {
      console.warn('Failed to initialize MediaPipe FaceDetector:', err);
      setModelError(true);
      setIsModelLoading(false);
    }
  }, []);

  useEffect(() => {
    initModel();
    return () => {
      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch {
          // ignore close error
        }
        detectorRef.current = null;
      }
    };
  }, [initModel]);

  // Clean up media streams and animations
  const stopMedia = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoFileUrlRef.current) {
      URL.revokeObjectURL(videoFileUrlRef.current);
      videoFileUrlRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setIsRunning(false);
    setFaceCount(0);
    setAvgConfidence(null);
    setInferenceTimeMs(null);
    setFps(null);
    setFrameDimensions(null);

    // Notify parent to restore simulated state
    onFaceCountChange?.(0, false);
  }, [onFaceCountChange]);

  // Handle detection loop
  const runDetectionLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;

    if (!video || !canvas || !detector || video.paused || video.ended) {
      return;
    }

    const now = performance.now();

    // Throttle to ~10 detections per second (every ~100ms)
    if (video.readyState >= 2 && now - lastDetectionTimeRef.current >= 95) {
      lastDetectionTimeRef.current = now;

      // Update frame dimensions
      if (video.videoWidth && video.videoHeight) {
        setFrameDimensions({ width: video.videoWidth, height: video.videoHeight });
      }

      // Sync canvas dimensions
      if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
          const startTime = performance.now();
          const detectionResult = detector.detectForVideo(video, Math.round(now));
          const endTime = performance.now();
          const duration = endTime - startTime;
          setInferenceTimeMs(duration);

          // Calculate FPS
          frameCountRef.current += 1;
          if (now - lastFpsUpdateRef.current >= 1000) {
            const currentFps = (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current);
            setFps(currentFps);
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }

          const rawDetections = detectionResult.detections || [];
          const keptDetections = rawDetections.filter(
            (d) => (d.categories?.[0]?.score ?? 0) >= confidenceThreshold
          );

          const count = keptDetections.length;
          setFaceCount(count);

          if (count > 0) {
            const totalScore = keptDetections.reduce(
              (acc, d) => acc + (d.categories?.[0]?.score ?? 0),
              0
            );
            setAvgConfidence(totalScore / count);
          } else {
            setAvgConfidence(null);
          }

          // Feed into local simulated room state if simulation mode is active
          if (isSimulationMode) {
            onFaceCountChange?.(count, true);
          }

          // Draw bounding boxes on overlay canvas
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const scaleX = canvas.width / video.videoWidth;
            const scaleY = canvas.height / video.videoHeight;

            keptDetections.forEach((detection) => {
              const box = detection.boundingBox;
              if (!box) return;

              const x = box.originX * scaleX;
              const y = box.originY * scaleY;
              const w = box.width * scaleX;
              const h = box.height * scaleY;
              const score = (detection.categories?.[0]?.score ?? 0).toFixed(2);

              // Box border
              ctx.strokeStyle = '#2DD4BF';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, w, h);

              // Score tag
              const tagText = `Face ${score}`;
              ctx.font = '10px var(--font-mono, monospace)';
              const textWidth = ctx.measureText(tagText).width;

              const tagY = y > 18 ? y - 18 : y;
              ctx.fillStyle = '#16181B';
              ctx.fillRect(x, tagY, textWidth + 8, 16);
              ctx.strokeStyle = '#2DD4BF';
              ctx.strokeRect(x, tagY, textWidth + 8, 16);

              ctx.fillStyle = '#2DD4BF';
              ctx.fillText(tagText, x + 4, tagY + 12);
            });
          }
        } catch (detectionErr) {
          console.warn('Inference frame detection error:', detectionErr);
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
  }, [confidenceThreshold, isSimulationMode, onFaceCountChange]);

  // Start selected video stream
  const startMedia = async () => {
    setCameraError(null);
    stopMedia();

    if (sourceType === 'laptop') {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Insecure context');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsRunning(true);
          animationFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
        }
      } catch (err: any) {
        console.warn('Laptop camera access error:', err);
        setCameraError(
          'Camera needs HTTPS or localhost. Open this page from the deployed HTTPS link on your phone.'
        );
      }
    } else if (sourceType === 'phone') {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Insecure context');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: phoneFacingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsRunning(true);
          animationFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
        }
      } catch (err: any) {
        console.warn('Phone camera access error:', err);
        setCameraError(
          'Camera needs HTTPS or localhost. Open this page from the deployed HTTPS link on your phone.'
        );
      }
    } else if (sourceType === 'file') {
      if (videoRef.current && videoRef.current.src) {
        try {
          await videoRef.current.play();
          setIsRunning(true);
          animationFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
        } catch (err) {
          console.warn('Video file play error:', err);
        }
      }
    }
  };

  // Toggle front/back for phone
  const toggleFacingMode = async () => {
    const nextMode = phoneFacingMode === 'environment' ? 'user' : 'environment';
    setPhoneFacingMode(nextMode);

    if (isRunning && sourceType === 'phone') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: nextMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.warn('Switch camera error:', err);
      }
    }
  };

  // Handle video file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopMedia();
      setSelectedFileName(file.name);
      const url = URL.createObjectURL(file);
      videoFileUrlRef.current = url;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.loop = true;
      }
    }
  };

  // Switch video source handler
  const handleSourceChange = (newSource: VideoSourceOption) => {
    stopMedia();
    setSourceType(newSource);
    setCameraError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-accent" />
            <CardTitle className="text-[18px]">Classroom camera demo (browser)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge source="SIMULATED" size="sm" />
            <span className="text-[11px] font-mono text-muted">
              Browser camera demo - not the Raspberry Pi
            </span>
          </div>
        </div>
        <CardDescription>
          Run live face detection directly in your browser. Detected faces count towards room-204
          observed occupancy while running.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Offline / Model error state */}
        {modelError ? (
          <EmptyState
            title="Face model could not load. Check internet and retry."
            explanation="The MediaPipe vision model could not be downloaded. Check your network connection and retry."
            actionText="Retry model load"
            onAction={initModel}
          />
        ) : (
          <>
            {/* Top Controls: Source Selector & Action Buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <SegmentedControl
                  options={sourceOptions}
                  value={sourceType}
                  onChange={handleSourceChange}
                  size="sm"
                />

                <div className="flex items-center gap-2">
                  {sourceType === 'phone' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleFacingMode}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      {phoneFacingMode === 'environment' ? 'Back' : 'Front'} camera
                    </Button>
                  )}

                  {!isRunning ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isModelLoading || (sourceType === 'file' && !selectedFileName)}
                      onClick={startMedia}
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                    >
                      {isModelLoading ? 'Loading model...' : 'Start'}
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={stopMedia}
                      leftIcon={<Square className="w-3.5 h-3.5" />}
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              {/* Classroom Video File Input */}
              {sourceType === 'file' && (
                <div className="p-3 rounded-[8px] bg-surface-2 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <Upload className="w-4 h-4 text-muted shrink-0" />
                    <span className="truncate">
                      {selectedFileName ? selectedFileName : 'No video selected (select .mp4, .webm)'}
                    </span>
                  </div>
                  <label className="cursor-pointer shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-surface border border-hairline text-ink text-[11px] hover:border-accent transition-colors font-sans font-medium">
                      Browse Video File
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Camera Access Error Notification */}
              {cameraError && (
                <div className="p-3 rounded-[8px] bg-status-orange-soft border border-status-orange/30 text-[12px] text-ink flex items-start gap-2">
                  <Info className="w-4 h-4 text-status-orange shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Video & Canvas Viewport */}
            <div className="relative rounded-[8px] bg-[#111315] border border-hairline overflow-hidden aspect-[16/10] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-contain ${isRunning ? 'block' : 'hidden'}`}
              />

              <canvas
                ref={canvasRef}
                className={`absolute inset-0 pointer-events-none w-full h-full ${isRunning ? 'block' : 'hidden'}`}
              />

              {!isRunning && (
                <div className="text-center p-6 space-y-2 select-none">
                  <div className="w-12 h-12 rounded-full bg-surface-2 border border-hairline flex items-center justify-center mx-auto text-muted">
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-[13px] text-muted font-medium">
                    Camera preview idle. Choose a video source and click Start.
                  </p>
                  <span className="text-[11px] font-mono text-muted block">
                    {sourceType === 'laptop'
                      ? 'Uses your computer webcam via WebRTC'
                      : sourceType === 'phone'
                      ? 'Uses mobile camera with front/back toggle'
                      : 'Loops local video file entirely in browser'}
                  </span>
                </div>
              )}

              {/* Live Overlay Metrics Badge */}
              {isRunning && (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/90">
                  <span className="bg-black/70 px-2 py-0.5 rounded border border-white/10">
                    FACES: {faceCount}
                  </span>
                  <span className="bg-black/70 text-[#2DD4BF] px-2 py-0.5 rounded border border-dashed border-[#2DD4BF]/40">
                    {fps ? `${fps.toFixed(1)} FPS` : '-- FPS'} · {inferenceTimeMs ? `${Math.round(inferenceTimeMs)}ms` : '--'}
                  </span>
                </div>
              )}
            </div>

            {/* 5-Step Detection Pipeline Panel */}
            <div className="p-4 rounded-[8px] bg-surface-2 border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                  How it detects faces (Pipeline Trace)
                </span>
                <span className="font-mono text-[11px] text-accent font-semibold">
                  {isRunning ? 'LIVE PROCESSING' : 'STANDBY'}
                </span>
              </div>

              <div className="space-y-2 text-[12px] font-mono">
                {/* Step 1 */}
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent-soft text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="text-ink font-medium">Capture frame:</span>
                  </div>
                  <span className="text-muted">
                    {frameDimensions
                      ? `${frameDimensions.width} × ${frameDimensions.height}`
                      : '-- × --'}
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent-soft text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="text-ink font-medium">Resize and normalize:</span>
                  </div>
                  <span className="text-muted">Detector input 128 × 128</span>
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent-soft text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="text-ink font-medium">Neural network:</span>
                  </div>
                  <span className="text-accent font-semibold">
                    BlazeFace / MediaPipe FaceDetector
                  </span>
                </div>

                {/* Step 4 with confidence slider */}
                <div className="p-2 rounded bg-surface border border-hairline space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-accent-soft text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                        4
                      </span>
                      <span className="text-ink font-medium">Confidence threshold:</span>
                    </div>
                    <span className="text-ink font-bold tabular-nums">
                      ≥ {confidenceThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-surface-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Step 5 */}
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent-soft text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                      5
                    </span>
                    <span className="text-ink font-medium">Count boxes = Headcount:</span>
                  </div>
                  <span className="text-accent font-bold text-[13px] tabular-nums">
                    {faceCount} {faceCount === 1 ? 'face' : 'faces'}
                  </span>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded bg-surface border border-hairline text-center">
                  <span className="text-muted block text-[10px] uppercase">Faces now</span>
                  <span className="text-ink font-bold text-[13px] tabular-nums">{faceCount}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-hairline text-center">
                  <span className="text-muted block text-[10px] uppercase">Avg confidence</span>
                  <span className="text-ink font-bold text-[13px] tabular-nums">
                    {avgConfidence != null ? avgConfidence.toFixed(2) : '--'}
                  </span>
                </div>
                <div className="p-2 rounded bg-surface border border-hairline text-center">
                  <span className="text-muted block text-[10px] uppercase">Inference time</span>
                  <span className="text-ink font-bold text-[13px] tabular-nums">
                    {inferenceTimeMs != null ? `${Math.round(inferenceTimeMs)} ms` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded bg-surface border border-hairline text-center">
                  <span className="text-muted block text-[10px] uppercase">Rate</span>
                  <span className="text-ink font-bold text-[13px] tabular-nums">
                    {fps != null ? `${fps.toFixed(1)} FPS` : '--'}
                  </span>
                </div>
              </div>

              {/* Plain-Language Disclaimers & Privacy Notice */}
              <div className="space-y-1.5 pt-1 text-[11px] text-muted border-t border-hairline leading-relaxed font-sans">
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>
                    This detects that a face is present. It does not identify who the person is.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
                  <span>
                    Frames stay in this browser. Nothing is stored or uploaded. Only the count is used.
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
