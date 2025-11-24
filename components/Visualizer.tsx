import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  volume: number;
  isActive: boolean;
  isSpeaking: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive, isSpeaking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size for full immersion
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let time = 0;
    let animationId: number;

    // Configuration for the blobs (Colors matched to Gemini/Siri vibe)
    const blobs = [
      { color: '#4f46e5', speed: 0.002, offset: 0 },    // Indigo
      { color: '#a855f7', speed: 0.003, offset: 2 },    // Purple
      { color: '#0ea5e9', speed: 0.0025, offset: 4 }    // Sky Blue
    ];

    const draw = () => {
      // Clear with true black
      ctx.fillStyle = '#000000';
      // Use source-over to clear the frame cleanly
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // If not active, draw a subtle breathing state (Idle)
      if (!isActive) {
        const breathingRadius = 80 + Math.sin(time * 2) * 5;
        
        ctx.globalCompositeOperation = 'screen';
        
        // Single subtle orb
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, breathingRadius);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, breathingRadius, 0, Math.PI * 2);
        ctx.fill();

        time += 0.015;
        animationId = requestAnimationFrame(draw);
        return;
      }

      // ACTIVE STATE
      ctx.globalCompositeOperation = 'screen'; // Additive blending for "light" look
      
      // Dynamic scaling based on volume
      // Base size + volume influence. 
      // isSpeaking triggers larger movement, user silence triggers smaller "listening" movement
      const baseScale = isSpeaking ? 1.5 : 1.0; 
      const volumeInfluence = volume * 2.5; 
      const intensity = 0.3 + (volumeInfluence * baseScale); 

      blobs.forEach((blob, i) => {
        ctx.beginPath();
        const baseRadius = Math.min(canvas.width, canvas.height) * 0.22 * (isActive ? 1 : 0.5);
        
        // Draw a deformed circle using sine waves
        for (let a = 0; a < Math.PI * 2; a += 0.1) {
          // Complex sine wave deformation
          const offset = 
            Math.sin(a * 3 + time * (2 + i) + blob.offset) * (20 * intensity) + 
            Math.cos(a * 5 - time * (1.5 + i)) * (15 * intensity);
          
          const r = baseRadius + offset + (isSpeaking ? volume * 50 : 0);
          const x = centerX + Math.cos(a) * r;
          const y = centerY + Math.sin(a) * r;
          
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        
        // Create a glow for each blob
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5);
        gradient.addColorStop(0, blob.color); // Core color
        gradient.addColorStop(0.6, 'transparent'); // Fade out
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add a faint blurry stroke for definition
        ctx.strokeStyle = blob.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      time += 0.03; // Animation speed
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [volume, isActive, isSpeaking]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-1000 ease-in-out"
    />
  );
};