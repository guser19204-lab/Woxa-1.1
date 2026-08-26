import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, MuseumWing, RelicItem, CuratorNote, HidingSpot, HorrorGameStats } from './types';
import { INITIAL_RELICS, CURATOR_NOTES, HIDING_SPOTS } from './data/museumData';
import { audioEngine } from './utils/audioEngine';
import { MuseumCanvas } from './components/MuseumCanvas';
import { MuseumHUD } from './components/MuseumHUD';
import { PresenceWarningOverlay } from './components/PresenceWarningOverlay';
import { JumpscareOverlay } from './components/JumpscareOverlay';
import { HidingOverlay } from './components/HidingOverlay';
import { IntroScreen } from './components/IntroScreen';
import { VictoryScreen } from './components/VictoryScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [activeWing, setActiveWing] = useState<MuseumWing>('atrium');
  const [relics, setRelics] = useState<RelicItem[]>(INITIAL_RELICS);
  const [notes, setNotes] = useState<CuratorNote[]>(CURATOR_NOTES);
  const [hidingSpots] = useState<HidingSpot[]>(HIDING_SPOTS);

  // Flashlight state
  const [flashlightOn, setFlashlightOn] = useState<boolean>(true);
  const [flashlightFlickering, setFlashlightFlickering] = useState<boolean>(false);

  // Hiding state
  const [isHiding, setIsHiding] = useState<boolean>(false);
  const [currentHidingSpot, setCurrentHidingSpot] = useState<HidingSpot | null>(null);

  // Proximities
  const [nearRelic, setNearRelic] = useState<RelicItem | null>(null);
  const [nearNote, setNearNote] = useState<CuratorNote | null>(null);
  const [nearHidingSpot, setNearHidingSpot] = useState<HidingSpot | null>(null);

  // Monster / Threat indicators
  const [monsterProximity, setMonsterProximity] = useState<number>(0);
  const [threatBanner, setThreatBanner] = useState<string | null>(null);
  const [deathCause, setDeathCause] = useState<string>('Claimed by the Specter of Blackwood');

  // Stats
  const [stats, setStats] = useState<HorrorGameStats>({
    timeSurvivedSeconds: 0,
    relicsFound: 0,
    notesFound: 0,
    presencesSurvived: 0,
    hidesCompleted: 0,
    deathCause: null
  });

  // Mobile virtual inputs
  const [virtualMove, setVirtualMove] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [virtualLook, setVirtualLook] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Timer for time survived
  useEffect(() => {
    let interval: number;
    if (gameState === 'playing' || gameState === 'hiding' || gameState === 'presence_event') {
      interval = window.setInterval(() => {
        setStats((prev) => ({
          ...prev,
          timeSurvivedSeconds: prev.timeSurvivedSeconds + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Periodic random light flickering & monster activity surges
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'hiding') return;

    const flickerInterval = window.setInterval(() => {
      // 30% chance every 18 seconds to trigger paranormal light flicker
      if (Math.random() < 0.4) {
        setFlashlightFlickering(true);
        setThreatBanner('EMF SPIKE: LIGHTS FLICKERING — A MONSTER IS STALKING NEARBY, HIDE!');
        audioEngine.playFlashlightFlicker();

        const duration = 6000 + Math.random() * 5000;
        window.setTimeout(() => {
          setFlashlightFlickering(false);
          setThreatBanner(null);
        }, duration);
      }
    }, 18000);

    return () => clearInterval(flickerInterval);
  }, [gameState]);

  // Toggle Flashlight
  const handleToggleFlashlight = useCallback(() => {
    setFlashlightOn((prev) => {
      const next = !prev;
      audioEngine.playFlashlightClick(next);
      return next;
    });
  }, []);

  // Manual flicker / shake torch
  const handleManualFlicker = useCallback(() => {
    setFlashlightFlickering(true);
    audioEngine.playFlashlightFlicker();
    setTimeout(() => {
      setFlashlightFlickering(false);
    }, 1800);
  }, []);

  // Toggle Hide / Unhide
  const handleToggleHide = useCallback(() => {
    if (isHiding) {
      setIsHiding(false);
      setCurrentHidingSpot(null);
      setGameState('playing');
      audioEngine.playHideTransition(false);
    } else if (nearHidingSpot) {
      setIsHiding(true);
      setCurrentHidingSpot(nearHidingSpot);
      setGameState('hiding');
      audioEngine.playHideTransition(true);
      setStats((prev) => ({ ...prev, hidesCompleted: prev.hidesCompleted + 1 }));
    }
  }, [isHiding, nearHidingSpot]);

  // Relic Collect
  const handleCollectRelic = useCallback((relic: RelicItem) => {
    audioEngine.playRelicPickup();
    setRelics((prev) =>
      prev.map((r) => (r.id === relic.id ? { ...r, isCollected: true } : r))
    );
    setStats((prev) => ({
      ...prev,
      relicsFound: prev.relicsFound + 1
    }));
    setNearRelic(null);
  }, []);

  // Trigger Glass Break Event
  const handleTriggerGlassBreak = useCallback(() => {
    setThreatBanner('GLASS SHATTERED IN THIS WING — AN ENTITY IS ROAMING!');
    setTimeout(() => {
      setThreatBanner(null);
    }, 6000);
  }, []);

  // Trigger "Presence Behind You" Event
  const handleTriggerPresence = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('presence_event');
    }
  }, [gameState]);

  // Presence Survived Handler
  const handlePresenceSurvived = useCallback(() => {
    setGameState('playing');
    setStats((prev) => ({
      ...prev,
      presencesSurvived: prev.presencesSurvived + 1
    }));
  }, []);

  // Presence Failed / Movement Detected Handler
  const handlePresenceFailed = useCallback((reason: string) => {
    setDeathCause(reason);
    setGameState('jumpscare');
  }, []);

  // Monster Caught Handler (Permadeath)
  const handleMonsterCaught = useCallback(() => {
    if (isHiding) return; // Protected while hiding
    setDeathCause('Caught by the Weeping Specter while out in the open during a light flicker surge.');
    setGameState('jumpscare');
  }, [isHiding]);

  // Escape Attempt (All 5 seals collected)
  const handleEscapeAttempt = useCallback(() => {
    setGameState('victory');
  }, []);

  // Start game from intro
  const handleStartNight = useCallback(() => {
    audioEngine.init();
    setGameState('playing');
  }, []);

  // Full Restart / Permadeath Reset (Strictly zero respawns, back to beginning)
  const handleRestartGame = useCallback(() => {
    setRelics(INITIAL_RELICS.map((r) => ({ ...r, isCollected: false })));
    setNotes(CURATOR_NOTES.map((n) => ({ ...n, isRead: false })));
    setActiveWing('atrium');
    setIsHiding(false);
    setCurrentHidingSpot(null);
    setFlashlightOn(true);
    setFlashlightFlickering(false);
    setThreatBanner(null);
    setStats({
      timeSurvivedSeconds: 0,
      relicsFound: 0,
      notesFound: 0,
      presencesSurvived: 0,
      hidesCompleted: 0,
      deathCause: null
    });
    setGameState('playing');
    audioEngine.init();
  }, []);

  // Global Keyboard shortcuts for gameplay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing' || gameState === 'hiding') {
        if (e.code === 'KeyF') {
          handleToggleFlashlight();
        } else if (e.code === 'KeyH') {
          handleToggleHide();
        } else if (e.code === 'KeyE') {
          if (nearRelic && !nearRelic.isCollected) {
            handleCollectRelic(nearRelic);
          } else if (nearHidingSpot) {
            handleToggleHide();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, nearRelic, nearHidingSpot, handleToggleFlashlight, handleToggleHide, handleCollectRelic]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-zinc-100 select-none">
      {/* Intro Screen */}
      {gameState === 'intro' && <IntroScreen onStartNight={handleStartNight} />}

      {/* 3D Museum Canvas (Active during playing, hiding, presence) */}
      {(gameState === 'playing' || gameState === 'hiding' || gameState === 'presence_event') && (
        <>
          <MuseumCanvas
            gameState={gameState}
            flashlightOn={flashlightOn}
            flashlightFlickering={flashlightFlickering}
            isHiding={isHiding}
            relics={relics}
            notes={notes}
            hidingSpots={hidingSpots}
            activeWing={activeWing}
            onWingChange={setActiveWing}
            onNearRelic={setNearRelic}
            onNearNote={setNearNote}
            onNearHidingSpot={setNearHidingSpot}
            onTriggerPresence={handleTriggerPresence}
            onTriggerGlassBreak={handleTriggerGlassBreak}
            onMonsterCaught={handleMonsterCaught}
            monsterProximity={monsterProximity}
            virtualMove={virtualMove}
            virtualLook={virtualLook}
          />

          {/* Regular Gameplay HUD */}
          {gameState === 'playing' && (
            <MuseumHUD
              flashlightOn={flashlightOn}
              flashlightFlickering={flashlightFlickering}
              onToggleFlashlight={handleToggleFlashlight}
              onManualFlicker={handleManualFlicker}
              activeWing={activeWing}
              relics={relics}
              notes={notes}
              nearRelic={nearRelic}
              nearNote={nearNote}
              nearHidingSpot={nearHidingSpot}
              onCollectRelic={handleCollectRelic}
              onToggleHide={handleToggleHide}
              isHiding={isHiding}
              threatBanner={threatBanner}
              timeSurvivedSeconds={stats.timeSurvivedSeconds}
              onEscapeAttempt={handleEscapeAttempt}
              setVirtualMove={setVirtualMove}
              setVirtualLook={setVirtualLook}
            />
          )}

          {/* Hiding Overlay */}
          {gameState === 'hiding' && (
            <HidingOverlay
              currentSpot={currentHidingSpot}
              onExitHiding={handleToggleHide}
              monsterProximity={monsterProximity}
            />
          )}

          {/* Presence Behind You Freeze Rule Overlay */}
          {gameState === 'presence_event' && (
            <PresenceWarningOverlay
              onSurvived={handlePresenceSurvived}
              onFailed={handlePresenceFailed}
            />
          )}
        </>
      )}

      {/* Jumpscare & Permadeath Reset Screen */}
      {gameState === 'jumpscare' && (
        <JumpscareOverlay
          stats={stats}
          reason={deathCause}
          onRestartGame={handleRestartGame}
        />
      )}

      {/* Victory Escape Screen */}
      {gameState === 'victory' && (
        <VictoryScreen stats={stats} onPlayAgain={handleRestartGame} />
      )}
    </div>
  );
}
