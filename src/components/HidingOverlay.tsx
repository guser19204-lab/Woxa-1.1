import React from 'react';
import { motion } from 'motion/react';
import { Eye, Shield, LogOut } from 'lucide-react';
import { HidingSpot } from '../types';

interface HidingOverlayProps {
  currentSpot: HidingSpot | null;
  onExitHiding: () => void;
  monsterProximity: number;
}

export const HidingOverlay: React.FC<HidingOverlayProps> = ({
  currentSpot,
  onExitHiding,
  monsterProximity
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-6 select-none"
    >
      {/* Heavy shadow slats & vignette simulating hiding behind furniture/curtains */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.95)_85%)] pointer-events-none" />

      {/* Top Status */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5 bg-black/85 border border-zinc-700/80 px-4 py-2 rounded-full text-zinc-300 shadow-xl">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider">
            CONCEALED: {currentSpot ? currentSpot.name : 'Shadow Niche'}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-red-950/80 border border-red-800/60 px-4 py-2 rounded-full text-red-300 text-xs font-mono">
          <Eye className="w-3.5 h-3.5 animate-pulse text-red-400" />
          <span>HOLDING BREATH</span>
        </div>
      </div>

      {/* Center Subtle Monster Pass Indicator */}
      <div className="relative z-10 text-center max-w-md mx-auto pointer-events-none">
        {monsterProximity > 0.4 ? (
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-black/90 border border-red-900 px-5 py-3 rounded-xl text-red-400 font-serif text-sm tracking-wide shadow-2xl"
          >
            A spectral shadow is drifting past outside your hiding spot... stay silent.
          </motion.div>
        ) : (
          <div className="bg-black/70 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-400 text-xs font-mono">
            Corridor sounds calm. Prepare to move.
          </div>
        )}
      </div>

      {/* Bottom Exit Action */}
      <div className="relative z-10 flex justify-center pb-4 pointer-events-auto">
        <button
          onClick={onExitHiding}
          className="group flex items-center gap-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-600 hover:border-zinc-400 text-zinc-100 px-6 py-3 rounded-xl font-serif text-sm tracking-wider shadow-2xl transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          <span>STEP OUT FROM HIDING SPOT (PRESS [H])</span>
        </button>
      </div>
    </motion.div>
  );
};
