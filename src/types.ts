export type GameState = 'intro' | 'playing' | 'hiding' | 'presence_event' | 'jumpscare' | 'game_over' | 'victory';

export type MuseumWing = 'atrium' | 'antiquities' | 'curio' | 'archive' | 'sanctum';

export interface RelicItem {
  id: string;
  name: string;
  wing: MuseumWing;
  description: string;
  icon: string;
  isCollected: boolean;
  position: [number, number, number]; // [x, y, z] in 3D world
}

export interface CuratorNote {
  id: string;
  title: string;
  date: string;
  wing: MuseumWing;
  content: string;
  isRead: boolean;
  position: [number, number, number];
}

export interface HidingSpot {
  id: string;
  name: string;
  wing: MuseumWing;
  position: [number, number, number];
}

export interface HorrorGameStats {
  timeSurvivedSeconds: number;
  relicsFound: number;
  notesFound: number;
  presencesSurvived: number;
  hidesCompleted: number;
  deathCause: string | null;
}
