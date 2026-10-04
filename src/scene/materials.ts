/**
 * Shared runtime materials for code-built stand-ins (CLAUDE.md §14A.29 library names).
 * GLB assets bring their own PBR materials; these keep placeholders visually consistent.
 */
import { DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three';

const std = (color: string, roughness: number, metalness = 0, extra: MeshStandardMaterialParameters = {}) =>
  new MeshStandardMaterial({ color, roughness, metalness, ...extra });

export const MAT = {
  academyStone: std('#cdb18a', 0.86),
  academyStoneDark: std('#a88f6c', 0.9),
  paving: std('#c3ae8b', 0.92),
  slate: std('#4b5566', 0.7),
  darkOak: std('#4a3122', 0.62),
  lightOak: std('#9a6f47', 0.6),
  agedBrass: std('#c49a4f', 0.32, 0.92),
  steel: std('#7d8796', 0.38, 0.9),
  darkSteel: std('#3e4552', 0.42, 0.85),
  navyCloth: std('#22355f', 0.95),
  burgundyLeather: std('#6e1f28', 0.55),
  greenLeather: std('#24533d', 0.58),
  blueLeather: std('#24406e', 0.58),
  parchment: std('#ecdcb7', 0.85, 0, { side: DoubleSide }),
  canvas: std('#cdbb94', 0.95),
  plaster: std('#e3d3b4', 0.95),
  carpet: std('#2a3a62', 0.95),
  grass: std('#6b8a48', 1),
  hedge: std('#3d6634', 1),
  leaf: std('#4d8a3c', 0.8, 0, { side: DoubleSide }),
  moss: std('#5c7d34', 1),
  bark: std('#5a4331', 1),
  soil: std('#4a3726', 1),
  fur: std('#8a4e2c', 0.9),
  furGrey: std('#77736c', 0.9),
  petal: std('#7a1f3a', 0.6, 0, { side: DoubleSide }),
  stem: std('#3f6b2e', 0.75),
  inkBody: new MeshPhysicalMaterial({
    color: '#26245a',
    roughness: 0.2,
    transmission: 0,
    transparent: true,
    opacity: 0.88,
    emissive: '#1b1850',
    emissiveIntensity: 0.4,
  }),
  wardStone: std('#e2dccd', 0.6),
  marble: std('#ece7dd', 0.35),
  water: new MeshPhysicalMaterial({ color: '#7fb6cf', roughness: 0.05, metalness: 0, transmission: 0.3, transparent: true, opacity: 0.85 }),
  glass: new MeshPhysicalMaterial({ color: '#e4f2ee', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide }),
  crystal: std('#cfe8ff', 0.15, 0, { emissive: '#5aa8ff', emissiveIntensity: 1.6 }),
  crystalDim: std('#8aa0b8', 0.3, 0, { emissive: '#1d3555', emissiveIntensity: 0.4 }),
  wardGold: std('#ffe3a0', 0.3, 0, { emissive: '#ffb640', emissiveIntensity: 1.6 }),
  wardBlue: std('#cfe6ff', 0.3, 0, { emissive: '#6fb6ff', emissiveIntensity: 1.8 }),
  lampGlow: std('#ffd89a', 0.5, 0, { emissive: '#ffb65c', emissiveIntensity: 1.4 }),
  // Leaded glass: dark by day with a faint warm glow from inside.
  windowGlow: std('#1e2833', 0.08, 0.7, { emissive: '#ffb468', emissiveIntensity: 0.06 }),
  /** Interior windows letting daylight in. */
  windowLit: std('#fff1d8', 0.4, 0, { emissive: '#ffe1b0', emissiveIntensity: 0.75 }),
  cuffLeather: std('#6e4a2c', 0.65),
  eyeAmber: std('#ffb84d', 0.3, 0, { emissive: '#ff9a1f', emissiveIntensity: 2 }),
  eyeCyan: std('#bff6ff', 0.3, 0, { emissive: '#55e6ff', emissiveIntensity: 2.4 }),
  eyeDark: std('#16110c', 0.2),
  eyeWhite: std('#f4f1ea', 0.25),
  tealGlow: std('#7ff0e0', 0.4, 0, { emissive: '#2fd6c0', emissiveIntensity: 1.6 }),
  skin: std('#c99a78', 0.7),
  hair: std('#3a2a20', 0.8),
  // Realism pass 2: kit-prop materials (names match assets-src/scripts/shared/kitgeo.py `lib`).
  /** Book bindings: neutral leather grain, coloured per book by vertex colour. */
  bookLeather: std('#ffffff', 0.6, 0, { vertexColors: true }),
  pageEdge: std('#e4d2a8', 0.92),
  ink: std('#2a2018', 0.6),
  velvet: std('#2c3f6e', 0.9),
  jacquard: std('#2a3a62', 0.85),
  panelWood: std('#5a3c28', 0.55),
  linen: std('#d8ccb0', 0.95),
  /** Victorian glasshouse ironwork (painted dark green). */
  greenIron: std('#2b3a33', 0.45, 0.6),
  /** Daylight seen through old glass; each pane's tint comes from vertex colour. */
  windowGlass: new MeshBasicMaterial({ color: '#fff3dc', vertexColors: true }),
  /** Leaded glass seen from outside by day: dark, reflective, each pane a little different. */
  windowGlassDay: std('#4f5862', 0.12, 0.6, { vertexColors: true }),
  /** The same glass at night: moonlight through the panes. */
  windowGlassNight: new MeshBasicMaterial({ color: '#7f9ee0', vertexColors: true }),
};
