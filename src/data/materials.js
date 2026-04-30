// Wing and tail construction materials — surface density is what matters for weight estimation.
// densityKgM2: surface density in kg/m² (what you'd use for skin + basic rib structure)
// structuralScore: stiffness-per-weight, 1 (bad) to 10 (best)

export const MATERIALS = [
  {
    id: 'EPP_3MM',
    name: 'EPP Foam (3mm)',
    densityKgM2: 0.060,
    structuralScore: 4,
    buildDifficulty: 'easy',
    costScore: 1,
    note: 'Very crash-resistant. Needs carbon/balsa spar for spans > 0.8 m.',
  },
  {
    id: 'DEPRON_3MM',
    name: 'Depron Foam (3mm)',
    densityKgM2: 0.045,
    structuralScore: 5,
    buildDifficulty: 'easy',
    costScore: 2,
    note: 'Stiffer than EPP but brittle in cold. Needs spar for spans > 1.0 m.',
  },
  {
    id: 'BALSA_3MM',
    name: 'Balsa Sheet (3mm)',
    densityKgM2: 0.040,
    structuralScore: 6,
    buildDifficulty: 'medium',
    costScore: 2,
    note: 'Classic build material. Needs covering (Monokote/tissue). Good structural base.',
  },
  {
    id: 'BALSA_FG',
    name: 'Balsa + Fiberglass Skin',
    densityKgM2: 0.075,
    structuralScore: 8,
    buildDifficulty: 'hard',
    costScore: 3,
    note: 'Excellent torsional stiffness. Handles spans > 1.5 m reliably.',
  },
  {
    id: 'COROPLAST',
    name: 'Coroplast (Corrugated Plastic)',
    densityKgM2: 0.900,
    structuralScore: 3,
    buildDifficulty: 'easy',
    costScore: 1,
    note: 'Very heavy relative to strength. Budget builds only. Poor for spans > 0.6 m.',
  },
  {
    id: 'CF_1MM',
    name: 'Carbon Fiber Sheet (1mm)',
    densityKgM2: 0.140,
    structuralScore: 10,
    buildDifficulty: 'hard',
    costScore: 5,
    note: 'Best stiffness-to-weight available. Requires diamond cutting tools. Expensive.',
  },
  {
    id: 'LITEPLY_3MM',
    name: 'Plywood (3mm Lite-Ply)',
    densityKgM2: 0.120,
    structuralScore: 7,
    buildDifficulty: 'medium',
    costScore: 2,
    note: 'Good for fuselage bulkheads and ribs. Too heavy for large wing skin panels.',
  },
  {
    id: 'PRINT_LW_PLA',
    name: 'LW-PLA (Lightweight Foamed)',
    densityKgM2: 0.072,
    structuralScore: 7,
    buildDifficulty: 'medium',
    costScore: 3,
    note: 'Foaming PLA expands ~2× at 230°C+, giving ~0.6 g/cm³ effective density. Lightest printable structural option. Print at 0.2mm layers, 10% gyroid infill, 2 walls. Best for ribs, formers, and skin panels up to 3 m span.',
  },
  {
    id: 'PRINT_CF_PLA',
    name: 'CF-PLA (Carbon Fiber Filled)',
    densityKgM2: 0.095,
    structuralScore: 9,
    buildDifficulty: 'medium',
    costScore: 4,
    note: 'Chopped CF reinforcement gives ~3× stiffer than PLA at similar weight. Requires hardened steel nozzle ≥ 0.4 mm — standard brass wears fast. Best for large-span spar channels, motor mounts, and wing cores > 3 m.',
  },
  {
    id: 'PRINT_ASA',
    name: 'ASA (UV-Stable)',
    densityKgM2: 0.108,
    structuralScore: 7,
    buildDifficulty: 'medium',
    costScore: 3,
    note: 'UV and weather resistant — survives outdoor competition without yellowing or embrittling. Needs enclosure and ~100°C bed. Print at 245°C, 0.2 mm layers, 15% infill. Good for fuselage, tail surfaces, and any sun-exposed structure.',
  },
  {
    id: 'PRINT_PETG',
    name: 'PETG (Standard)',
    densityKgM2: 0.130,
    structuralScore: 6,
    buildDifficulty: 'easy',
    costScore: 2,
    note: 'Easiest filament to print reliably — no warping, no enclosure needed. Tough and crack-resistant. Heavier than LW-PLA but very forgiving for first prints. Use for cargo bays, fuselage, motor nacelles, and non-structural panels.',
  },
];

export function getMaterialById(id) {
  const m = MATERIALS.find((m) => m.id === id);
  if (!m) throw new Error(`Unknown material id: ${id}`);
  return m;
}
