import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationAnimationProps {
  isVisible: boolean;
  type: 'steeze' | 'vouch';
  onComplete?: () => void;
}

export function CelebrationAnimation({ isVisible, type, onComplete }: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: type === 'steeze' 
          ? ['#8B5CF6', '#A855F7', '#9333EA', '#7C3AED'][Math.floor(Math.random() * 4)]
          : ['#10B981', '#059669', '#047857', '#065F46'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 2
      }));
      setParticles(newParticles);

      // Clear particles after animation
      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, type, onComplete]);

  const getMessage = () => {
    if (type === 'steeze') {
      return {
        title: '🎉 Steeze Purchased!',
        subtitle: 'Your tokens have been added to your balance'
      };
    } else {
      return {
        title: '✨ Vouch Sent!',
        subtitle: 'Aura points awarded to your friend'
      };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="fixed w-3 h-3 rounded-full pointer-events-none z-50"
              style={{
                backgroundColor: particle.color,
                left: particle.x,
                top: particle.y,
              }}
              initial={{ y: -10, opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                opacity: 0,
                scale: 0,
                rotate: 360,
              }}
              transition={{
                duration: 3,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Success Message */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`
                bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4
                ${type === 'steeze' ? 'border-4 border-purple-500' : 'border-4 border-emerald-500'}
              `}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.6
              }}
            >
              <motion.h2
                className={`
                  text-3xl font-bold mb-2
                  ${type === 'steeze' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}
                `}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {message.title}
              </motion.h2>
              
              <motion.p
                className="text-gray-600 dark:text-gray-300 text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {message.subtitle}
              </motion.p>

              {/* Animated checkmark */}
              <motion.div
                className={`
                  w-16 h-16 mx-auto mt-4 rounded-full flex items-center justify-center
                  ${type === 'steeze' ? 'bg-purple-100 dark:bg-purple-900' : 'bg-emerald-100 dark:bg-emerald-900'}
                `}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                <motion.svg
                  className={`w-8 h-8 ${type === 'steeze' ? 'text-purple-600' : 'text-emerald-600'}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.path d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Background overlay */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for managing celebrations
export function useCelebration() {
  const [celebrationState, setCelebrationState] = useState<{
    isVisible: boolean;
    type: 'steeze' | 'vouch' | null;
  }>({
    isVisible: false,
    type: null
  });

  const triggerSteezeCelebration = () => {
    setCelebrationState({ isVisible: true, type: 'steeze' });
  };

  const triggerVouchCelebration = () => {
    setCelebrationState({ isVisible: true, type: 'vouch' });
  };

  const closeCelebration = () => {
    setCelebrationState({ isVisible: false, type: null });
  };

  return {
    celebrationState,
    triggerSteezeCelebration,
    triggerVouchCelebration,
    closeCelebration
  };
}