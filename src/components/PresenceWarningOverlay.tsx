import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { audioEngine } from '../utils/audioEngine';
import { AlertTriangle, EyeOff, ShieldAlert } from 'lucide-react';

interface PresenceWarningOverlayProps {
  onSurvived: () => void;
  onFailed: (reason: string) => void;
}

export const PresenceWarningOverlay: React.FC<PresenceWarningOverlayProps> = ({
  onSurvived,
  onFailed
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(5.5);
  const failedRef = useRef<boolean>(false);
  const initialGracePeriodRef = useRef<boolean>(true);

  useEffect(() => {
    // Play eerie binaural whisper and cold breath
    audioEngine.playPresenceWhisper();
    audioEngine.setHeartbeatState(true, 130);

    // Short 250ms grace period so initial click that might have triggered state doesn't instantly fail
    const graceTimer = setTimeout(() => {
      initialGracePeriodRef.current = false;
    }, 250);

    const triggerFail = (reason: string) => {
      if (initialGracePeriodRef.current || failedRef.current) return;
      failedRef.current = true;
      audioEngine.setHeartbeatState(false);
      onFailed(reason);
    };

    // Strict input listeners: Any touch, click, key, or mouse movement fails the freeze rule!
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) {
        triggerFail('You moved your mouse while the entity was behind you.');
      }
    };

    const handleMouseDown = () => {
      triggerFail('You clicked the mouse while the entity was behind you.');
    };

    const handleTouchStart = () => {
      triggerFail('You touched the screen while the entity was breathing on your neck.');
    };

    const handleTouchMove = () => {
      triggerFail('You dragged your finger on the screen.');
    };

    const handleKeyDown = () => {
      triggerFail('You pressed a key while the entity was stalking behind you.');
    };

    const handleWheel = () => {
      triggerFail('You scrolled the mouse wheel.');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);

    // Countdown timer for surviving the freeze encounter
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          if (!failedRef.current) {
            audioEngine.setHeartbeatState(false);
            onSurvived();
          }
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      clearTimeout(graceTimer);
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [onSurvived, onFailed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 pointer-events-auto flex flex-col items-center justify-between p-6 select-none bg-black/75 backdrop-blur-[2px]"
    >
      {/* Heavy Frost / Blood Rim Vignette */}
      <div className="absolute inset-0 pointer-events-none border-[16px] border-red-950/60 shadow-[inset_0_0_120px_rgba(180,0,0,0.8)] animate-pulse" />

      {/* Top Banner Alert */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="relative z-10 flex items-center gap-3 bg-red-950/90 text-red-100 border border-red-500/80 px-6 py-3 rounded-full shadow-2xl"
      >
        <ShieldAlert className="w-6 h-6 text-red-400 animate-bounce" />
        <span className="font-serif tracking-widest text-sm sm:text-base font-bold uppercase">
          Paranormal Anomaly Detected
        </span>
      </motion.div>

      {/* Main Center Warning Message */}
      <div className="relative z-10 text-center max-w-xl mx-auto space-y-4">
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="text-red-500 font-serif font-black text-2xl sm:text-4xl md:text-5xl tracking-widest uppercase drop-shadow-[0_0_25px_rgba(255,0,0,0.9)]"
        >
          YOU FEEL A PRESENCE BEHIND YOU
        </motion.div>

        <div className="bg-black/90 border border-red-900/80 p-5 rounded-xl shadow-2xl space-y-3">
          <p className="text-red-200 text-base sm:text-lg font-medium leading-relaxed">
            <strong className="text-white bg-red-900/60 px-2 py-0.5 rounded">DO NOT MOVE.</strong>{' '}
            <strong className="text-red-300">DO NOT TOUCH THE SCREEN.</strong>
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Any mouse movement, screen touch, or keystroke will alert the entity and immediately end your run.
          </p>
        </div>

        {/* Breath Survival Meter */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>HOLDING BREATH IN SILENCE...</span>
            <span className="text-red-400 font-bold">{timeLeft.toFixed(1)}s</span>
          </div>
          <div className="w-full h-3 bg-zinc-950 border border-red-900/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500"
              style={{ width: `${(timeLeft / 5.5) * 100}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 text-xs text-zinc-500 font-mono tracking-wider flex items-center gap-2">
        <EyeOff className="w-4 h-4 text-red-400" />
        <span>Stay completely motionless until the shadow dissolves...</span>
      </div>
    </motion.div>
  );
};
