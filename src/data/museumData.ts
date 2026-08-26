import { RelicItem, CuratorNote, HidingSpot } from '../types';

export const WINGS_INFO = {
  atrium: {
    name: 'Grand Vestibule & Atrium',
    description: 'The monumental entrance hall of Blackwood Museum. Cold marble floors, locked iron gates, and towering Corinthian columns.',
    color: '#3b82f6',
    bounds: { minX: -14, maxX: 14, minZ: -14, maxZ: 14 }
  },
  antiquities: {
    name: 'Hall of Ancient Antiquities',
    description: 'Houses excavated burial artifacts from the Dynasty of the Sunless Pharaohs. The glass cases rattle mysteriously.',
    color: '#eab308',
    bounds: { minX: -38, maxX: -14, minZ: -14, maxZ: 14 }
  },
  curio: {
    name: 'Victorian Curio & Cryptids Gallery',
    description: 'Preserved oddities, taxidermy with human-like eyes, and antique oil portraits whose gaze subtly tracks your movements.',
    color: '#a855f7',
    bounds: { minX: 14, maxX: 38, minZ: -14, maxZ: 14 }
  },
  archive: {
    name: 'Restoration Archive & Occult Stacks',
    description: 'Towering shelves of forbidden grimoires, restoration chemical vats, and the former Chief Curator’s heavy oak desk.',
    color: '#10b981',
    bounds: { minX: -14, maxX: 14, minZ: 14, maxZ: 38 }
  },
  sanctum: {
    name: 'The Sanctum Reliquary (The Vault)',
    description: 'Deep subterranean sanctuary where the most dangerous entity is bound behind five cursed seals.',
    color: '#ef4444',
    bounds: { minX: -14, maxX: 14, minZ: -38, maxZ: -14 }
  }
};

export const INITIAL_RELICS: RelicItem[] = [
  {
    id: 'relic-1',
    name: 'The Ankh of the Sleepless',
    wing: 'antiquities',
    description: 'Carved from meteoric obsidian. It feels unnervingly warm to the touch, vibrating with low spectral energy.',
    icon: 'Sparkles',
    isCollected: false,
    position: [-26, 1.2, 0]
  },
  {
    id: 'relic-2',
    name: 'The Cursed Glass Eye of Lord Blackwood',
    wing: 'curio',
    description: 'Preserved inside a locked velvet case. The pupil dilates whenever someone breathes nearby.',
    icon: 'Eye',
    isCollected: false,
    position: [26, 1.2, 0]
  },
  {
    id: 'relic-3',
    name: 'The Codex of Unspoken Shadows',
    wing: 'archive',
    description: 'Bound in weathered leather. The ink on its pages rearranges itself in complete darkness.',
    icon: 'BookOpen',
    isCollected: false,
    position: [0, 1.2, 26]
  },
  {
    id: 'relic-4',
    name: 'The Canopic Urn of the Weeping Queen',
    wing: 'antiquities',
    description: 'Sealed with blackened wax. Faint sobbing echoes from deep within the clay vessel.',
    icon: 'Flame',
    isCollected: false,
    position: [-22, 1.2, 8]
  },
  {
    id: 'relic-5',
    name: 'The Master Keystone of the Sanctum',
    wing: 'sanctum',
    description: 'The final heavy brass keystone required to unlock the grand iron gate and escape this nightmare.',
    icon: 'Key',
    isCollected: false,
    position: [0, 1.2, -26]
  }
];

export const CURATOR_NOTES: CuratorNote[] = [
  {
    id: 'note-1',
    title: 'Curator Log #14 - The Shutdown Order',
    date: 'October 29, 1974',
    wing: 'atrium',
    content: 'The Board has officially ordered the museum shut down tonight. Three night watchmen refuse to step foot back inside. They keep swearing that the glass vitrines in the Antiquities wing are shattering on their own, and that something is walking behind them when the lights die.',
    isRead: false,
    position: [0, 1.1, 4]
  },
  {
    id: 'note-2',
    title: 'Curator Log #19 - Warning to the Night Staff',
    date: 'November 03, 1974',
    wing: 'antiquities',
    content: 'CRITICAL PROTOCOL: If the gallery lights or your flashlight begin to flicker erratically, DO NOT RUN. A predator is passing through the ether. Find a hiding spot immediately—duck behind display pedestals or under desks. If you are caught out in the open, it will claim you.',
    isRead: false,
    position: [-20, 1.1, -4]
  },
  {
    id: 'note-3',
    title: 'Curator Log #27 - The Presence Behind You',
    date: 'November 12, 1974',
    wing: 'curio',
    content: 'God help whoever reads this. The worst ones do not attack from the front. If you suddenly feel cold breath on the back of your neck... FREEZE. Do not turn around. Do not move a single muscle. Do not touch anything. If you make even the slightest motion, it knows you are alive.',
    isRead: false,
    position: [20, 1.1, 4]
  },
  {
    id: 'note-4',
    title: 'Curator Log #31 - The Shattered Glass',
    date: 'November 18, 1974',
    wing: 'archive',
    content: 'The glass broke again in Wing 3. The noise was deafening. Every time the glass breaks, the seals weaken and another entity slips into the corridors. I have hidden the five cursed relics across the four wings. Without all five, the master escape gate will never budge.',
    isRead: false,
    position: [4, 1.1, 20]
  }
];

export const HIDING_SPOTS: HidingSpot[] = [
  { id: 'hide-atrium-1', name: 'Behind Grand Column Base', wing: 'atrium', position: [-6, 0, 6] },
  { id: 'hide-atrium-2', name: 'Behind Heavy Velvet Drape', wing: 'atrium', position: [6, 0, -6] },
  { id: 'hide-antiquities-1', name: 'Behind Egyptian Sarcophagus Niche', wing: 'antiquities', position: [-26, 0, -8] },
  { id: 'hide-antiquities-2', name: 'Underneath Restoration Counter', wing: 'antiquities', position: [-20, 0, 10] },
  { id: 'hide-curio-1', name: 'Behind Stuffed Apex Predator Pedestal', wing: 'curio', position: [26, 0, 8] },
  { id: 'hide-curio-2', name: 'Inside Narrow Specimen Alcove', wing: 'curio', position: [30, 0, -6] },
  { id: 'hide-archive-1', name: 'Beneath the Heavy Curator Oak Desk', wing: 'archive', position: [-6, 0, 26] },
  { id: 'hide-archive-2', name: 'Behind Archival Bookcase Partition', wing: 'archive', position: [8, 0, 24] },
  { id: 'hide-sanctum-1', name: 'Behind Stone Altar Pillar', wing: 'sanctum', position: [-8, 0, -26] },
  { id: 'hide-sanctum-2', name: 'Behind Cursed Reliquary Sarcophagus', wing: 'sanctum', position: [8, 0, -26] }
];
