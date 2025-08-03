import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationAnimationProps {
  trigger: boolean;
  type: 'steeze' | 'vouch';
  onComplete?: () => void;
}

export function CelebrationAnimation({ trigger, type, onComplete }: CelebrationAnimationProps) {
  useEffect(() => {
    if (!trigger) return;

    const runCelebration = () => {
      if (type === 'steeze') {
        // Purple and gold celebration for Steeze purchases
        const colors = ['#8B5CF6', '#A855F7', '#C084FC', '#FFD700', '#FFA500'];
        
        // Burst from center
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors,
          shapes: ['star', 'circle'],
          scalar: 1.2,
        });

        // Side bursts
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
          });
        }, 150);

      } else if (type === 'vouch') {
        // Green and blue celebration for vouching
        const colors = ['#10B981', '#059669', '#34D399', '#3B82F6', '#60A5FA'];
        
        // Heart-shaped burst
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: colors,
          shapes: ['circle'],
          scalar: 1.0,
        });

        // Continuous small bursts
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }

      // Call onComplete after animation
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    };

    runCelebration();
  }, [trigger, type, onComplete]);

  return null;
}

// Hook for easy celebration triggering
export function useCelebration() {
  const triggerSteezeCelebration = () => {
    const colors = ['#8B5CF6', '#A855F7', '#C084FC', '#FFD700', '#FFA500'];
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['star', 'circle'],
      scalar: 1.2,
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });
    }, 150);
  };

  const triggerVouchCelebration = () => {
    const colors = ['#10B981', '#059669', '#34D399', '#3B82F6', '#60A5FA'];
    
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['circle'],
      scalar: 1.0,
    });

    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return {
    triggerSteezeCelebration,
    triggerVouchCelebration,
  };
}