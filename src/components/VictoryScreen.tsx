import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sun, ShieldCheck, RotateCcw, Clock, Key } from 'lucide-react';
import { HorrorGameStats } from '../types';

interface VictoryScreenProps {
  stats: HorrorGameStats;
  onPlayAgain: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ stats, onPlayAgain }) => {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#08070b]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-lg w-full bg-zinc-950 border border-emerald-800/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.3)] text-center space-y-6">
        {/* Golden Sun & Seal Icon */}
        <div className="inline-flex p-4 rounded-full bg-emerald-950/80 border border-emerald-600/70 text-emerald-400 shadow-2xl">
          <Sun className="w-12 h-12 animate-spin-slow text-amber-300" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-widest text-emerald-400 uppercase">
            YOU ESCAPED THE MUSEUM
          </h2>
          <p className="text-sm font-mono text-zinc-300">
            The five cursed seals held. The master gates unlocked as the first rays of dawn broke
            through the grand vestibule skylights.
          </p>
        </div>

        {/* Summary Stats Grid */}
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
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>SEALS RECOVERED</span>
            </div>
            <p className="text-xl font-mono font-bold text-zinc-100">5 / 5 Complete</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>PRESENCES SURVIVED</span>
            </div>
            <p className="text-xl font-mono font-bold text-zinc-100">{stats.presencesSurvived}</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>HIDES EXECUTED</span>
            </div>
            <p className="text-xl font-mono font-bold text-zinc-100">{stats.hidesCompleted}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onPlayAgain}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-zinc-900 hover:from-emerald-800 hover:to-emerald-900 text-white font-serif font-bold text-lg rounded-xl border border-emerald-600/70 shadow-2xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>RE-ENTER THE MUSEUM (NEW RUN)</span>
        </button>
      </div>
    </motion.div>
  );
};
