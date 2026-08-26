import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flashlight,
  Volume2,
  VolumeX,
  Compass,
  FileText,
  Key,
  Shield,
  Zap,
  Sparkles,
  Eye,
  AlertOctagon,
  X,
  Flame,
  Info,
  MapPin
} from 'lucide-react';
import { RelicItem, CuratorNote, HidingSpot, MuseumWing } from '../types';
import { WINGS_INFO } from '../data/museumData';
import { audioEngine } from '../utils/audioEngine';

interface MuseumHUDProps {
  flashlightOn: boolean;
  flashlightFlickering: boolean;
  onToggleFlashlight: () => void;
  onManualFlicker: () => void;
  activeWing: MuseumWing;
  relics: RelicItem[];
  notes: CuratorNote[];
  nearRelic: RelicItem | null;
  nearNote: CuratorNote | null;
  nearHidingSpot: HidingSpot | null;
  onCollectRelic: (relic: RelicItem) => void;
  onToggleHide: () => void;
  isHiding: boolean;
  threatBanner: string | null;
  timeSurvivedSeconds: number;
  onEscapeAttempt: () => void;
  setVirtualMove: (v: { x: number; y: number }) => void;
  setVirtualLook: (v: { x: number; y: number }) => void;
}

export const MuseumHUD: React.FC<MuseumHUDProps> = ({
  flashlightOn,
  flashlightFlickering,
  onToggleFlashlight,
  onManualFlicker,
  activeWing,
  relics,
  notes,
  nearRelic,
  nearNote,
  nearHidingSpot,
  onCollectRelic,
  onToggleHide,
  isHiding,
  threatBanner,
  timeSurvivedSeconds,
  onEscapeAttempt,
  setVirtualMove,
  setVirtualLook
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [readingNote, setReadingNote] = useState<CuratorNote | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const wingData = WINGS_INFO[activeWing];
  const collectedCount = relics.filter((r) => r.isCollected).length;
  const allRelicsFound = collectedCount === relics.length;

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenNote = (note: CuratorNote) => {
    audioEngine.playRelicPickup();
    setReadingNote(note);
    note.isRead = true;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* ---------------- TOP BAR ---------------- */}
      <div className="flex items-start justify-between w-full">
        {/* Current Wing Location & Status */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm border border-zinc-800 px-3.5 py-1.5 rounded-lg shadow-xl">
            <Compass className="w-4 h-4 text-amber-500 animate-spin-slow" />
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                CURRENT SECTOR
              </div>
              <div className="text-xs sm:text-sm font-serif font-bold text-zinc-100">
                {wingData.name}
              </div>
            </div>
          </div>

          {/* Time Survived Counter */}
          <div className="text-[11px] font-mono text-zinc-400 bg-black/60 px-2.5 py-1 rounded border border-zinc-800/80 w-fit">
            Night Clock: {Math.floor(timeSurvivedSeconds / 60).toString().padStart(2, '0')}:
            {Math.floor(timeSurvivedSeconds % 60).toString().padStart(2, '0')} AM
          </div>
        </div>

        {/* Center Threat Alert Banner (When lights flicker or glass breaks) */}
        <AnimatePresence>
          {threatBanner && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="pointer-events-auto bg-red-950/90 border border-red-500/80 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm sm:max-w-md text-center text-red-100"
            >
              <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm font-serif font-semibold tracking-wide">
                {threatBanner}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Controls & Relic Counter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Relic Seals Tracker */}
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm border border-amber-900/60 px-3.5 py-1.5 rounded-lg shadow-xl text-amber-300">
            <Key className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <div className="text-[9px] font-mono text-zinc-400 uppercase">SEALS SECURED</div>
              <div className="text-xs sm:text-sm font-mono font-bold">
                {collectedCount} / {relics.length}
              </div>
            </div>
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-black/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Map / Help Toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            aria-label="Toggle Floor Plan"
            className="p-2 rounded-lg bg-black/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer text-xs font-mono"
          >
            MAP
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Help Guide"
            className="p-2 rounded-lg bg-black/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---------------- CENTER PROXIMITY INTERACTION NOTIFICATIONS ---------------- */}
      <div className="flex flex-col items-center justify-center gap-3 w-full max-w-lg mx-auto">
        <AnimatePresence>
          {/* Relic Pickup Prompt */}
          {nearRelic && !nearRelic.isCollected && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto bg-black/90 border border-amber-500/80 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3.5 text-amber-200 cursor-pointer hover:bg-amber-950/40 transition-colors"
              onClick={() => onCollectRelic(nearRelic)}
            >
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                  [PRESS E OR CLICK] RECOVER CURSED SEAL
                </div>
                <div className="text-sm font-serif font-bold text-zinc-100">{nearRelic.name}</div>
              </div>
            </motion.div>
          )}

          {/* Curator Note Prompt */}
          {nearNote && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto bg-black/90 border border-blue-500/80 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3.5 text-blue-200 cursor-pointer hover:bg-blue-950/40 transition-colors"
              onClick={() => handleOpenNote(nearNote)}
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase tracking-wider font-bold">
                  [PRESS E OR CLICK] READ CURATOR LOG
                </div>
                <div className="text-sm font-serif font-bold text-zinc-100">{nearNote.title}</div>
              </div>
            </motion.div>
          )}

          {/* Hiding Spot Prompt */}
          {nearHidingSpot && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto bg-black/90 border border-emerald-500/80 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3.5 text-emerald-200 cursor-pointer hover:bg-emerald-950/40 transition-colors"
              onClick={onToggleHide}
            >
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">
                  {isHiding ? '[PRESS H] STEP OUT FROM HIDING' : '[PRESS H OR CLICK] HIDE HERE'}
                </div>
                <div className="text-sm font-serif font-bold text-zinc-100">{nearHidingSpot.name}</div>
              </div>
            </motion.div>
          )}

          {/* Master Gate Escape Prompt (When all 5 seals collected and in Atrium) */}
          {allRelicsFound && activeWing === 'atrium' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto bg-gradient-to-r from-amber-950 via-emerald-950 to-zinc-950 border-2 border-emerald-500 px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center gap-4 text-emerald-100 cursor-pointer hover:scale-105 transition-all"
              onClick={onEscapeAttempt}
            >
              <Key className="w-7 h-7 text-emerald-400 animate-bounce" />
              <div>
                <div className="text-xs font-mono text-emerald-300 uppercase tracking-widest font-bold">
                  ALL 5 SEALS ALIGNED
                </div>
                <div className="text-base font-serif font-bold text-white">
                  CLICK TO UNLOCK MASTER EXIT GATE & ESCAPE
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------- BOTTOM CONTROLS & FLASH / TORCH ACTION ---------------- */}
      <div className="flex items-end justify-between w-full">
        {/* Desktop Controls Quick Cheat-sheet */}
        <div className="hidden md:flex flex-col gap-1 text-[11px] font-mono text-zinc-400 bg-black/70 p-2.5 rounded-lg border border-zinc-800/80">
          <div><strong className="text-zinc-200">WASD / Arrows:</strong> Walk</div>
          <div><strong className="text-zinc-200">Mouse:</strong> Look Around (Click canvas to lock)</div>
          <div><strong className="text-zinc-200">F:</strong> Flashlight Toggle</div>
          <div><strong className="text-zinc-200">H:</strong> Hide / Unhide</div>
          <div><strong className="text-zinc-200">E:</strong> Interact / Pick up</div>
        </div>

        {/* Mobile Virtual Walk Joystick & Look Area */}
        <div className="flex md:hidden items-center gap-3 pointer-events-auto">
          {/* Virtual D-Pad / Move Pad */}
          <div className="grid grid-cols-3 gap-1 bg-black/80 p-1.5 rounded-xl border border-zinc-800">
            <div />
            <button
              onMouseDown={() => setVirtualMove({ x: 0, y: 1 })}
              onMouseUp={() => setVirtualMove({ x: 0, y: 0 })}
              onTouchStart={() => setVirtualMove({ x: 0, y: 1 })}
              onTouchEnd={() => setVirtualMove({ x: 0, y: 0 })}
              className="w-9 h-9 bg-zinc-800 active:bg-zinc-600 rounded flex items-center justify-center text-zinc-300 font-bold"
            >
              W
            </button>
            <div />
            <button
              onMouseDown={() => setVirtualMove({ x: -1, y: 0 })}
              onMouseUp={() => setVirtualMove({ x: 0, y: 0 })}
              onTouchStart={() => setVirtualMove({ x: -1, y: 0 })}
              onTouchEnd={() => setVirtualMove({ x: 0, y: 0 })}
              className="w-9 h-9 bg-zinc-800 active:bg-zinc-600 rounded flex items-center justify-center text-zinc-300 font-bold"
            >
              A
            </button>
            <button
              onMouseDown={() => setVirtualMove({ x: 0, y: -1 })}
              onMouseUp={() => setVirtualMove({ x: 0, y: 0 })}
              onTouchStart={() => setVirtualMove({ x: 0, y: -1 })}
              onTouchEnd={() => setVirtualMove({ x: 0, y: 0 })}
              className="w-9 h-9 bg-zinc-800 active:bg-zinc-600 rounded flex items-center justify-center text-zinc-300 font-bold"
            >
              S
            </button>
            <button
              onMouseDown={() => setVirtualMove({ x: 1, y: 0 })}
              onMouseUp={() => setVirtualMove({ x: 0, y: 0 })}
              onTouchStart={() => setVirtualMove({ x: 1, y: 0 })}
              onTouchEnd={() => setVirtualMove({ x: 0, y: 0 })}
              className="w-9 h-9 bg-zinc-800 active:bg-zinc-600 rounded flex items-center justify-center text-zinc-300 font-bold"
            >
              D
            </button>
          </div>
        </div>

        {/* Flashlight Actions & Flicker Button */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Manual Flicker / Tap Torch (User requested: "You can make your torch flicker.") */}
          <button
            onClick={onManualFlicker}
            aria-label="Make torch flicker"
            className="flex items-center gap-1.5 bg-black/80 hover:bg-zinc-800 active:bg-amber-950 border border-zinc-700 hover:border-amber-500/60 px-3.5 py-2.5 rounded-xl text-zinc-300 hover:text-amber-300 text-xs font-mono transition-all shadow-xl cursor-pointer"
            title="Tap / Shake Torch to make it flicker"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">FLICKER TORCH</span>
          </button>

          {/* Flashlight Main Toggle Button */}
          <button
            onClick={onToggleFlashlight}
            aria-label="Toggle Flashlight"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-serif text-xs sm:text-sm font-bold border transition-all shadow-xl cursor-pointer ${
              flashlightOn
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flashlight className={`w-4 h-4 ${flashlightOn ? 'text-amber-400' : 'text-zinc-500'}`} />
            <span>{flashlightOn ? 'TORCH: ON [F]' : 'TORCH: OFF [F]'}</span>
          </button>
        </div>
      </div>

      {/* ---------------- NOTE INSPECT MODAL ---------------- */}
      <AnimatePresence>
        {readingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full bg-[#1c1714] border-2 border-amber-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-amber-100 relative space-y-4"
            >
              <button
                onClick={() => setReadingNote(null)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg bg-black/40 hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-amber-900/40 pb-3 space-y-1">
                <span className="text-[11px] font-mono text-amber-500 uppercase tracking-widest">
                  ARCHIVAL RECORD • {readingNote.date}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200">
                  {readingNote.title}
                </h3>
              </div>

              <div className="font-serif text-sm sm:text-base leading-relaxed text-amber-100/90 whitespace-pre-line bg-black/20 p-4 rounded-xl border border-amber-950/40">
                "{readingNote.content}"
              </div>

              <div className="text-right pt-2">
                <button
                  onClick={() => setReadingNote(null)}
                  className="px-5 py-2 bg-amber-900/60 hover:bg-amber-800 text-amber-100 font-serif text-sm rounded-lg border border-amber-700 transition-colors cursor-pointer"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- FLOOR PLAN MAP MODAL ---------------- */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-200 relative space-y-4">
              <button
                onClick={() => setShowMap(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-serif font-bold text-amber-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Blackwood Museum Floor Blueprint
              </h3>

              {/* Schematic cross diagram */}
              <div className="bg-black/90 p-4 rounded-xl border border-zinc-800 text-center space-y-3 font-mono text-xs">
                <div className="p-2 rounded bg-red-950/40 border border-red-900/60 text-red-300">
                  NORTH: RESTORATION ARCHIVE (Grimoires & Desks)
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="p-2 rounded bg-yellow-950/40 border border-yellow-900/60 text-yellow-300 text-[11px]">
                    WEST: ANTIQUITIES (Tombs)
                  </div>
                  <div className="p-3 rounded bg-blue-950/60 border border-blue-800 text-blue-200 font-bold">
                    GRAND ATRIUM (Master Gate)
                  </div>
                  <div className="p-2 rounded bg-purple-950/40 border border-purple-900/60 text-purple-300 text-[11px]">
                    EAST: CURIO (Oddities)
                  </div>
                </div>
                <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-300">
                  SOUTH: SANCTUM RELIQUARY (The Deep Vault)
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-mono">
                Recover all 5 seals across the four wings and return to the Grand Atrium south gate to escape.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- HELP / RULES GUIDE MODAL ---------------- */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <div className="max-w-lg w-full bg-zinc-950 border border-red-900/60 rounded-2xl p-6 shadow-2xl text-zinc-200 relative space-y-4">
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif font-bold text-red-400 flex items-center gap-2">
                <Flame className="w-5 h-5" /> Survival Rules of the Museum
              </h3>

              <ul className="space-y-3 font-mono text-xs sm:text-sm text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold">1.</span>
                  <span><strong>No Respawns:</strong> Death is absolute. If caught, your run restarts from the museum gate.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold">2.</span>
                  <span><strong>Lights Flickering:</strong> A specter is stalking near. Hide behind columns, pedestals, or desks ([H]).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold">3.</span>
                  <span><strong>Glass Breaking:</strong> Alerts you that an entity has breached containment in that wing.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold">4.</span>
                  <span><strong>Presence Behind You:</strong> FREEZE! Do not move mouse, do not press keys, do NOT touch screen. Any input triggers instant death!</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
