import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import toast from 'react-hot-toast';

const CameraComponent = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        let currentStream = null;

        const startCamera = async () => {
            try {
                // Check if browser supports mediaDevices
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera API not supported in this browser");
                }

                const constraints = {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user",
                        frameRate: { ideal: 15 }
                    },
                    audio: false
                };

                console.log("📷 Requesting camera access...", constraints);
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

                currentStream = mediaStream;
                setStream(mediaStream);
                setHasPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    // Explicitly play to ensure mobile/safari compatibility
                    videoRef.current.play().catch(e => {
                        if (e.name !== 'AbortError') console.error("Play error:", e);
                    });
                }

                console.log("✅ Camera started successfully using Native API");

            } catch (err) {
                console.error("❌ Camera Error:", err);
                setHasPermission(false);
                toast.error(`Camera Error: ${err.name} - ${err.message}`);

                if (err.name === 'NotAllowedError') {
                    toast.error("Please allow camera access in your browser settings.");
                } else if (err.name === 'NotFoundError') {
                    toast.error("No camera found. Please connect a webcam.");
                } else if (err.name === 'NotReadableError') {
                    toast.error("Camera is in use by another application.");
                }
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Expose capture method to parent via ref
    useImperativeHandle(ref, () => ({
        getScreenshot: () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas) {
                console.error("❌ CameraComponent: Refs missing");
                return null;
            }

            if (video.readyState < 2) { // 2 = HAVE_CURRENT_DATA
                console.warn(`⚠️ Camera not ready. ReadyState: ${video.readyState}`);
                return null;
            }

            const ctx = canvas.getContext('2d');

            // Ensure we have valid dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.warn("⚠️ Video dimensions are 0x0");
                return null;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Return base64 string
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            // Basic validation
            if (dataUrl.length < 1000) {
                console.warn("⚠️ Captured image too small:", dataUrl.length);
                return null;
            }

            return dataUrl;
        }
    }));

    return (
        <div className={`relative w-full h-full bg-black overflow-hidden ${props.className || ''}`}>
            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Video Element */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror
                onCanPlay={() => {
                    console.log("🎥 Video can play!");
                    if (props.onUserMedia) props.onUserMedia();
                }}
            />

            {/* Permission Denied UI */}
            {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center">
                    <div>
                        <p className="text-red-500 font-bold mb-2">🚫 Camera Access Denied</p>
                        <p className="text-sm">Please enable camera permissions to continue the test.</p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {hasPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
});

CameraComponent.displayName = 'CameraComponent';

export default CameraComponent;
