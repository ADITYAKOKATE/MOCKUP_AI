import { useRef, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const useProctoring = (sessionId, onViolation, isActive = true, isEnabled = true) => {
    const [warnings, setWarnings] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const webcamRef = useRef(null);
    const [isCalibrated, setIsCalibrated] = useState(false);

    // If proctoring is disabled, return dummy values immediately
    if (!isEnabled) {
        return {
            warnings: [],
            isFullScreen: true, // Pretend full screen to avoid UI warnings
            webcamRef,
            enterFullScreen: () => { },
            calibrate: async () => true,
            isCalibrated: true
        };
    }

    // 1. Fullscreen Enforcement
    const enterFullScreen = async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                await elem.msRequestFullscreen();
            }
            setIsFullScreen(true);
        } catch (err) {
            // Ignore permission errors (common on auto-trigger)
            if (!err.message?.includes('Permissions check failed')) {
                console.error("Error attempting to enable full-screen mode:", err);
            }
        }
    };

    useEffect(() => {
        if (!isActive) return;

        const handleFullScreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullScreen(isFull);
            if (!isFull && isActive) {
                logViolation('FULLSCREEN_EXIT', 'User exited fullscreen mode');
                toast.error("WARNING: Please stay in Fullscreen mode!");
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);

        // Try entering on mount
        enterFullScreen();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [isActive]);


    // 2. Tab Switch / Focus Loss
    useEffect(() => {
        if (!isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                logViolation('TAB_SWITCH', 'User switched tabs or minimized window');
                toast.error("WARNING: Tab switching is recorded!");
            }
        };

        const handleBlur = () => {
            // Optional: Strict focus check
            // logViolation('FOCUS_LOST', 'Window lost focus');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isActive]);

    // 3. Disable Context Menu & Copy/Paste
    useEffect(() => {
        if (!isActive) return;

        const preventDefault = (e) => e.preventDefault();

        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('paste', preventDefault);
        document.addEventListener('cut', preventDefault);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('paste', preventDefault);
            document.removeEventListener('cut', preventDefault);
        };
    }, [isActive]);

    // 4. Log Violation Helper
    // Use a ref to track warnings count synchronously to avoid closure staleness
    const warningsRef = useRef([]);

    // Sync ref with state
    useEffect(() => {
        warningsRef.current = warnings;
    }, [warnings]);

    const logViolation = async (type, message, evidence = null) => {
        // If evidence is null, try to capture a fresh screenshot
        if (!evidence && webcamRef.current) {
            try {
                evidence = webcamRef.current.getScreenshot();
                console.log("📸 [useProctoring] Captured evidence screenshot. Length:", evidence ? evidence.length : "null");
            } catch (e) {
                console.error("Failed to capture evidence screenshot:", e);
            }
        }

        const newWarning = { type, message, timestamp: new Date(), evidence }; // Include evidence in local state for immediate feedback if needed

        // Optimistically update UI state
        setWarnings(prev => {
            const updated = [...prev, newWarning];
            return updated.slice(-10);
        });

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("No auth token found, cannot log violation");
                return;
            }

            // 1. Log to Backend FIRST and AWAIT completion
            console.log(`[useProctoring] Logging violation: ${type}...`);
            const response = await fetch(`http://localhost:5000/api/test/session/${sessionId}/log-violation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ type, message, evidence })
            });

            if (!response.ok) {
                throw new Error(`Failed to log violation: ${response.statusText}`);
            }

            console.log(`[useProctoring] Violation logged successfully.`);

            // 2. Check for Termination Condition AFTER successful log
            // We use the Ref to get the *current* count including the one we just added (effectively)
            // Actually, we should just count based on what we know. 
            // The backend also checks this, but frontend needs to trigger the exit.

            const currentCount = warningsRef.current.length + 1; // +1 for the current one

            if (currentCount >= 5) {
                toast.error("⛔ MAX VIOLATIONS REACHED. TERMINATING TEST.", { duration: 5000 });
                if (onViolation) onViolation({ ...newWarning, terminate: true });
            } else {
                if (onViolation) onViolation(newWarning);
            }

        } catch (error) {
            console.error("Failed to log violation:", error);
            // Even if backend fails, should we count it? 
            // For now, assume yes to be safe, but we missed the evidence saving.
        }
    };

    // 5. Webcam Monitoring (Polled)

    const calibrate = useCallback(async () => {
        if (!webcamRef.current) return false;

        // Capture 5 frames for calibration
        const frames = [];
        for (let i = 0; i < 5; i++) {
            const imageSrc = webcamRef.current.getScreenshot();
            console.log(`📸 Capturing frame ${i}:`, imageSrc ? imageSrc.substring(0, 30) + "..." : "null", "Length:", imageSrc ? imageSrc.length : 0);

            // Check for valid data URI (longer than 'data:,')
            if (imageSrc && imageSrc.length > 100) {
                frames.push(imageSrc);
            } else {
                console.warn("⚠️ Skipped invalid/empty frame");
            }

            await new Promise(r => setTimeout(r, 200)); // 200ms delay
        }

        if (frames.length === 0) {
            toast.error("Camera capture failed. Is video visible?");
            return false;
        }

        try {
            const response = await fetch('http://localhost:5001/calibrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, images: frames })
            });
            const result = await response.json();

            if (result.status === 'success') {
                setIsCalibrated(true);
                toast.success("✅ Camera Calibrated Successfully!");
                return true;
            } else {
                toast.error("Calibration failed: " + (result.message || "Try again"));
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }, [sessionId]);

    const captureAndAnalyze = useCallback(async () => {
        if (!webcamRef.current || !isActive) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return false;

        try {
            const response = await fetch('http://localhost:5001/analyze-frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, image: imageSrc })
            });

            const result = await response.json();

            if (result.status === 'violation') {
                // Pass the evidence (current image) to logViolation so it's saved!
                // The AI service analyzes *this* frame, so this frame *is* the evidence.
                await logViolation(result.type, result.message, imageSrc);

                if (result.type === 'HIGH_MOVEMENT') {
                    toast.error("⚠️ Massive Movement Detected!");
                } else if (result.type === 'E_DEVICE_DETECTED') {
                    toast.error("🚫 PHONE DETECTED! VIOLATION RECORDED.", { duration: 5000, icon: '📱' });
                } else if (result.type === 'MULTIPLE_FACES') {
                    toast.error("⚠️ Multiple Faces Detected!");
                } else if (result.type.includes('LEANING')) {
                    toast.error(`⚠️ ${result.message}`);
                } else {
                    toast.error(`ALERT: ${result.message}`);
                }
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
        }
    }, [isActive, sessionId]);

    // Interval for AI Check
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(captureAndAnalyze, 5000); // Every 5 seconds
        return () => clearInterval(interval);
    }, [captureAndAnalyze, isActive]);

    return {
        warnings,
        isFullScreen,
        webcamRef,
        enterFullScreen,
        calibrate,
        isCalibrated
    };
};
