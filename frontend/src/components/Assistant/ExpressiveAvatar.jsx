import React, { useEffect, useState, useRef } from 'react';

/**
 * ExpressiveAvatar Component
 * 
 * An advanced 2D SVG-based animated robot avatar with expressive capabilities.
 * Features:
 * - Circular expressive mouth (reacts to amplitude)
 * - Random eye blinking
 * - Mood-based eye shapes (Happy/Sparkle, Surprised/Hollow)
 * 
 * Props:
 * - emotion: 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'encourage'
 * - speaking: boolean - if true, mouth animates
 * - amplitude: number (0-1) - current audio level for lip sync
 */
const ExpressiveAvatar = ({ emotion = 'neutral', speaking = false, amplitude = 0 }) => {
  const [blink, setBlink] = useState(false);
  const [mouthRadius, setMouthRadius] = useState(2);
  
  // Random blink logic
  useEffect(() => {
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      
      const nextBlinkTime = Math.random() * 3000 + 3000; // 3-6 seconds
      blinkTimeout.current = setTimeout(triggerBlink, nextBlinkTime);
    };
    
    let blinkTimeout = { current: setTimeout(triggerBlink, 3000) };
    return () => clearTimeout(blinkTimeout.current);
  }, []);

  // Mouth Animation Loop
  useEffect(() => {
    let animationFrame;
    const animateMouth = () => {
      if (speaking) {
        // Map amplitude (0-1) to radius (2-15)
        // If no real amplitude, simulate it
        const effAmp = amplitude > 0.01 ? amplitude : (Math.random() * 0.5 + 0.2);
        const targetRadius = 2 + effAmp * 12; 
        setMouthRadius(prev => prev + (targetRadius - prev) * 0.3); // Smooth lerp
      } else {
        setMouthRadius(2);
      }
      animationFrame = requestAnimationFrame(animateMouth);
    };

    if (speaking) {
      animateMouth();
    } else {
      setMouthRadius(2);
      cancelAnimationFrame(animationFrame);
    }
    
    return () => cancelAnimationFrame(animationFrame);
  }, [speaking, amplitude]);


  // --- Styles & Shapes ---

  const primaryColor = "#6366f1"; // Indigo-500
  const eyeColor = "#38bdf8"; // Sky-400
  const glowColor = "rgba(99, 102, 241, 0.5)";

  // Eye Transformation
  const getEyeTransform = (side) => {
    const baseScale = blink ? 'scaleY(0.1)' : 'scaleY(1)';
    let transform = baseScale;

    if (!blink) {
        switch (emotion) {
            case 'happy':
            case 'encourage':
                // Happy eyes (Squinted upside down U or just distinct shape)
                // We'll handle happy shape in render, just scale here if needed
                return 'scale(1.1)';
            case 'surprised':
                return 'scale(1.3)';
            case 'sad':
                return 'rotate(10deg)';
            case 'thinking':
                 // Look up/right
                 return 'translate(2px, -2px)';
            default:
                return 'scale(1)';
        }
    }
    return transform;
  };

  // Render Eyes based on Emotion
  const renderEye = (cx, cy) => {
    // 1. Surprised: Hollow Eyes
    if (emotion === 'surprised' && !blink) {
        return (
            <circle cx={cx} cy={cy} r="12" fill="none" stroke={eyeColor} strokeWidth="3" />
        );
    }

    // 2. Happy: Sparkles/Squint (visualized as ^ ^ or similar, but user asked for sparkles)
    // We will keep the eye circle but add sparkles externally.
    // Let's make the eye 'crescent' for happy
    if ((emotion === 'happy' || emotion === 'encourage') && !blink) {
         // Crescent / Arc for happy eye
         return (
            <path 
                d={`M ${cx-10} ${cy+2} Q ${cx} ${cy-8} ${cx+10} ${cy+2}`} 
                fill="none" 
                stroke={eyeColor} 
                strokeWidth="3" 
                strokeLinecap="round"
            />
         );
    }
    
    // Default / Sad / Thinking
    return (
        <ellipse
            cx={cx}
            cy={cy}
            rx="10"
            ry={blink ? 1 : 12} // Blink is handled here too for direct Ry control
            fill={eyeColor}
            style={{ 
                transition: 'all 0.1s ease',
                transformOrigin: `${cx}px ${cy}px`,
                transform: getEyeTransform() 
            }}
        />
    );
  };
  
  // Render Sparkles for Happy Mood
  const renderSparkles = () => {
      if ((emotion !== 'happy' && emotion !== 'encourage') || blink) return null;
      
      const Sparkle = ({x, y}) => (
          <path 
            transform={`translate(${x}, ${y}) scale(0.6)`}
            d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" 
            fill="#fbbf24" // Amber-400
            className="animate-pulse"
          />
      );

      return (
          <>
            <Sparkle x="60" y="70" />
            <Sparkle x="140" y="70" />
          </>
      );
  };


  return (
    <div className="flex justify-center items-center w-full h-full">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-xl"
        style={{ filter: `drop-shadow(0 0 15px ${glowColor})` }}
      >
        {/* --- Robot Head Structure --- */}
        
        {/* Antennas */}
        <line x1="100" y1="50" x2="100" y2="20" stroke={primaryColor} strokeWidth="4" />
        <circle cx="100" cy="15" r="5" fill={speaking ? "#ef4444" : primaryColor} className={speaking ? "animate-pulse" : ""} />

        {/* Head Shell */}
        <rect
          x="40"
          y="50"
          width="120"
          height="100"
          rx="25"
          fill="white"
          stroke={primaryColor}
          strokeWidth="4"
        />

        {/* Face Screen (Black background) */}
        <rect
          x="55"
          y="65"
          width="90"
          height="70"
          rx="15"
          fill="#1e293b" // Slate-800
        />

        {/* --- Eyes --- */}
        <g>
            {renderEye(75, 90)}
            {renderEye(125, 90)}
        </g>
        
        {/* Sparkles (Overlay) */}
        {renderSparkles()}

        {/* --- Circular Expressive Mouth --- */}
        <g transform="translate(100, 120)">
            {/* 
               Mouth Shape:
               - Default: Small circle/dot
               - Speaking: Radius expands
               - Surprised: Small 'o' (open but fixed)
            */}
            <circle 
                cx="0" 
                cy="0" 
                r={emotion === 'surprised' && !speaking ? 6 : mouthRadius} 
                fill={emotion === 'surprised' ? 'none' : eyeColor}
                stroke={emotion === 'surprised' ? eyeColor : 'none'}
                strokeWidth={emotion === 'surprised' ? 2 : 0}
                style={{ transition: 'all 0.05s linear' }}
            />
        </g>

        {/* Decorative highlights */}
         <path d="M50 60 Q 45 60 45 70" stroke={primaryColor} strokeWidth="2" fill="none" opacity="0.5"/>
         <path d="M150 60 Q 155 60 155 70" stroke={primaryColor} strokeWidth="2" fill="none" opacity="0.5"/>

      </svg>
    </div>
  );
};

export default ExpressiveAvatar;
