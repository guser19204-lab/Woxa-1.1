import React from 'react';
import { motion } from 'motion/react';
import {
  Skull,
  Flashlight,
  ShieldAlert,
  EyeOff,
  Headphones,
  Sparkles,
  ArrowRight,
  Flame,
  Volume2
} from 'lucide-react';

interface IntroScreenProps {
  onStartNight: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onStartNight }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#06070a] text-zinc-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      {/* Dark vintage museum atmospheric vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(30,10,10,0.4)_0%,rgba(0,0,0,0.95)_80%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-2xl w-full bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] space-y-6 my-auto"
      >
        {/* Museum Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-red-950/60 border border-red-800/50 px-4 py-1.5 rounded-full text-red-400 text-xs font-mono tracking-widest uppercase">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>BLACKWOOD MUSEUM OF ANTIQUITIES • SHUT DOWN 1974</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-wider text-zinc-100 uppercase drop-shadow-lg">
            THE SHUTDOWN MUSEUM
          </h1>

          <p className="text-xs sm:text-sm font-serif italic text-zinc-400 max-w-lg mx-auto leading-relaxed">
            The grand museum was sealed fifty years ago after the night guard vanished. Rumors say
            malevolent ghost spirits roam the halls. You have stepped inside.
          </p>
        </div>

        {/* Core Horror Survival Directives */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Directive 1: No Respawns */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
              <Skull className="w-4 h-4 text-red-500" />
              <span>PERMADEATH ONLY</span>
            </div>
            <p className="text-xs text-zinc-400">
              There are zero checkpoints and zero respawns. If an entity catches you, you will be sent
              straight back to the museum gates.
            </p>
          </div>

          {/* Directive 2: Flashlight & Flicker */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <Flashlight className="w-4 h-4 text-amber-400" />
              <span>FLASHLIGHT DYNAMICS</span>
            </div>
            <p className="text-xs text-zinc-400">
              Use <strong className="text-zinc-200">[F]</strong> to toggle your torch. You can tap or shake it to make it flicker. When it flickers violently on its own, danger is near.
            </p>
          </div>

          {/* Directive 3: Lights Flickering & Hiding */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-yellow-400">
              <ShieldAlert className="w-4 h-4 text-yellow-500" />
              <span>LIGHTS FLICKERING: HIDE</span>
            </div>
            <p className="text-xs text-zinc-400">
              When gallery lights buzz and flicker, a monster is hunting nearby. Duck behind exhibit cases or curtains <strong className="text-zinc-200">[H]</strong>.
            </p>
          </div>

          {/* Directive 4: The Presence Freeze Rule */}
          <div className="bg-zinc-900/60 border border-red-900/60 p-3.5 rounded-xl space-y-1 bg-gradient-to-br from-red-950/40 to-transparent">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
              <EyeOff className="w-4 h-4 text-red-400" />
              <span>PRESENCE: DO NOT MOVE</span>
            </div>
            <p className="text-xs text-red-200/90 font-medium">
              If you feel a presence behind you: <strong>FREEZE.</strong> Do not touch the screen, do not move the mouse, do not press keys. Any touch equals death!
            </p>
          </div>
        </div>

        {/* Audio / Immersion Notice */}
        <div className="flex items-center justify-between bg-black/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-zinc-300" />
            <span>Headphones recommended for spatial audio and glass shatter alerts</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Volume2 className="w-3.5 h-3.5" />
            <span>3D Spatial Sound</span>
          </div>
        </div>

        {/* Start Game Action */}
        <button
          onClick={onStartNight}
          className="w-full group py-4 px-6 bg-gradient-to-r from-red-900 via-red-800 to-amber-950 hover:from-red-800 hover:to-red-900 text-white font-serif font-bold text-lg rounded-xl border border-red-600/70 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
        >
          <span>CROSS THE MUSEUM THRESHOLD</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};
