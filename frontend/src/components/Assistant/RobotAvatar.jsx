import React, { useEffect, useState, useRef } from 'react';

/**
 * RobotAvatar Component
 * 
 * A 2D SVG-based animated robot avatar.
 * 
 * Props:
 * - emotion: 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'encourage'
 * - speaking: boolean - if true, mouth animates
 * - amplitude: number (0-1) - current audio level for lip sync (optional)
 */
const RobotAvatar = ({ emotion = 'neutral', speaking = false, amplitude = 0 }) => {
  const [blink, setBlink] = useState(false);
  
  // Random blink logic
  useEffect(() => {
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      
      const nextBlinkTime = Math.random() * 3000 + 2000; // 2-5 seconds
      blinkTimeout.current = setTimeout(triggerBlink, nextBlinkTime);
    };
    
    let blinkTimeout = { current: setTimeout(triggerBlink, 3000) };
    
    return () => clearTimeout(blinkTimeout.current);
  }, []);

  // Eye styling based on emotion
  const getEyeStyles = () => {
    const base = { transition: 'all 0.3s ease' };
    
    if (blink) {
      return { ...base, scaleY: 0.1 };
    }

    switch (emotion) {
      case 'happy':
        return { ...base, transform: 'scaleY(0.5) translateY(-5px)', borderRadius: '50%' }; // Squinty happy eyes
      case 'sad':
        return { ...base, transform: 'rotate(10deg)' }; 
      case 'surprised':
        return { ...base, transform: 'scale(1.2)' };
      case 'thinking':
        return { ...base, opacity: 0.8 };
      case 'encourage':
         return { ...base, transform: 'scale(1.1)' };
      default:
        return base;
    }
  };

  // Mouth animation
  // We use a simple height scaling for speaking
  // If amplitude is provided, we use it. Otherwise we simulate it if speaking=true.
  const [mouthHeight, setMouthHeight] = useState(4);
  
  useEffect(() => {
    let animationFrame;
    
    const animateMouth = () => {
      if (speaking) {
        // Mock amplitude if not provided
        const amp = amplitude > 0 ? amplitude : Math.random() * 0.8 + 0.2;
        setMouthHeight(4 + amp * 10); // Base 4px + up to 10px
      } else {
        setMouthHeight(4);
      }
      animationFrame = requestAnimationFrame(animateMouth);
    };
    
    if (speaking) {
      animateMouth();
    } else {
      setMouthHeight(4);
      cancelAnimationFrame(animationFrame);
    }
    
    return () => cancelAnimationFrame(animationFrame);
  }, [speaking, amplitude]);


  // Colors
  const primaryColor = "#6366f1"; // Indigo-500
  const glowColor = "rgba(99, 102, 241, 0.5)";
  
  return (
    <div className="flex justify-center items-center w-full h-full p-4">
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 drop-shadow-xl"
        style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
      >
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

        {/* Left Eye */}
        <g transform="translate(75, 90)">
          <ellipse
            cx="0"
            cy="0"
            rx="10"
            ry="12"
            fill="#38bdf8" // Sky-400
            style={getEyeStyles()}
          />
        </g>

        {/* Right Eye */}
        <g transform="translate(125, 90)">
           <ellipse
            cx="0"
            cy="0"
            rx="10"
            ry="12"
            fill="#38bdf8" // Sky-400
            style={getEyeStyles()}
          />
        </g>

        {/* Mouth */}
        <g transform="translate(100, 115)">
          <rect
            x={-15}
            y={-mouthHeight / 2}
            width={30}
            height={mouthHeight}
            rx={2}
            fill="#38bdf8"
            style={{ transition: 'height 0.05s ease' }}
          />
        </g>
        
        {/* Decorative highlights */}
         <path d="M50 60 Q 45 60 45 70" stroke={primaryColor} strokeWidth="2" fill="none" opacity="0.5"/>
         <path d="M150 60 Q 155 60 155 70" stroke={primaryColor} strokeWidth="2" fill="none" opacity="0.5"/>

      </svg>
    </div>
  );
};

export default RobotAvatar;
