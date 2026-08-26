import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { audioEngine } from '../utils/audioEngine';
import { Skull, RotateCcw, ShieldX, Clock, Trophy } from 'lucide-react';
import { HorrorGameStats } from '../types';

interface JumpscareOverlayProps {
  stats: HorrorGameStats;
  reason: string;
  onRestartGame: () => void;
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({
  stats,
  reason,
  onRestartGame
}) => {
  const [phase, setPhase] = useState<'scare' | 'death_screen'>('scare');

  useEffect(() => {
    // Play violent jumpscare stinger audio
    audioEngine.playJumpscareStinger();

    // Transition from terrifying jumpscare flash to permadeath report screen after 1.8 seconds
    const timer = setTimeout(() => {
      setPhase('death_screen');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (phase === 'scare') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
        {/* Violent Glitch and Flashing Strobe */}
        <motion.div
          animate={{
            scale: [1, 1.3, 0.9, 1.4, 1.1],
            x: [0, -15, 20, -10, 0],
            y: [0, 10, -15, 5, 0]
          }}
          transition={{ duration: 0.35, repeat: 5 }}
          className="relative w-full h-full flex items-center justify-center bg-red-950"
        >
          {/* Horrifying Monstrous Face Silhouette & Spectral Eyes */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-black/90 flex items-center justify-center border-4 border-red-600 shadow-[0_0_100px_rgba(255,0,0,1)]">
            <div className="flex gap-16">
              <div className="w-10 h-10 rounded-full bg-red-600 shadow-[0_0_30px_#ff0000] animate-ping" />
              <div className="w-10 h-10 rounded-full bg-red-600 shadow-[0_0_30px_#ff0000] animate-ping" />
            </div>
            {/* Piercing Maw */}
            <div className="absolute bottom-12 w-32 h-14 bg-red-950 border-2 border-red-500 rounded-b-full shadow-inner flex items-center justify-center text-red-500 font-serif text-2xl font-bold">
              ✝
            </div>
          </div>

          <div className="absolute inset-0 bg-red-600/30 mix-blend-overlay animate-pulse pointer-events-none" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-lg w-full bg-zinc-950 border border-red-900/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_80px_rgba(180,0,0,0.4)] text-center space-y-6">
        {/* Skull Icon */}
        <div className="inline-flex p-4 rounded-full bg-red-950/80 border border-red-700/60 text-red-500 shadow-xl">
          <Skull className="w-12 h-12 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-widest text-red-500 uppercase">
            YOU HAVE PERISHED
          </h2>
          <p className="text-sm font-mono text-red-300 uppercase tracking-wide flex items-center justify-center gap-2">
            <ShieldX className="w-4 h-4" /> NO RESPAWNS • PERMADEATH ACTIVE
          </p>
        </div>

        {/* Cause of Death */}
        <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-left space-y-1">
          <span className="text-xs font-mono text-zinc-400 uppercase">Cause of Death:</span>
          <p className="text-sm sm:text-base font-serif text-red-200 font-medium">{reason}</p>
        </div>

        {/* Investigation Summary Stats */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>TIME SURVIVED</span>
            </div>
            <p className="text-xl font-mono font-bold text-zinc-100">
              {Math.floor(stats.timeSurvivedSeconds / 60)}m {Math.floor(stats.timeSurvivedSeconds % 60)}s
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span>SEALS FOUND</span>
            </div>
            <p className="text-xl font-mono font-bold text-zinc-100">{stats.relicsFound} / 5</p>
          </div>
        </div>

        {/* Hard Reset CTA */}
        <button
          onClick={onRestartGame}
          className="w-full group py-4 px-6 bg-gradient-to-r from-red-900 via-red-800 to-red-950 hover:from-red-800 hover:to-red-900 text-white font-serif font-bold text-lg rounded-xl border border-red-600/70 shadow-2xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 group-hover:rotate-[-180deg] transition-transform duration-500" />
          <span>ENTER MUSEUM GATES AGAIN</span>
        </button>

        <p className="text-xs text-zinc-500 font-mono">
          The museum claims another soul. Starting over resets all artifacts, notes, and wing progress.
        </p>
      </div>
    </motion.div>
  );
};
