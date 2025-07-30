import { useState, useEffect } from "react";

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export default function FunOverlay() {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const emojis = ['⚡', '🚀', '✨', '🔥', '💎', '🌟', '🎯', '💫', '🏆', '👑'];

  useEffect(() => {
    const interval = setInterval(() => {
      const newEmoji: FloatingEmoji = {
        id: Date.now(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 50,
        size: Math.random() * 20 + 20,
        duration: Math.random() * 3000 + 2000,
      };

      setFloatingEmojis(prev => [...prev, newEmoji]);

      // Remove emoji after animation
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, newEmoji.duration);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {floatingEmojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-bounce opacity-30"
          style={{
            left: emoji.x,
            top: emoji.y,
            fontSize: emoji.size,
            animation: `floatUp ${emoji.duration}ms linear forwards`,
          }}
        >
          {emoji.emoji}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes floatUp {
          from {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          to {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Achievement Pop-up Component
interface AchievementPopupProps {
  title: string;
  description: string;
  emoji: string;
  onClose: () => void;
}

export function AchievementPopup({ title, description, emoji, onClose }: AchievementPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-500">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-xl border border-purple-400/30 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="text-3xl animate-bounce">{emoji}</div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">🎉 Achievement Unlocked!</h4>
            <p className="font-semibold">{title}</p>
            <p className="text-xs opacity-90">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// Confetti Effect Component
export function ConfettiEffect() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confettiFall 3s linear forwards`,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}