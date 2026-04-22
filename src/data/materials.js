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
];

export function getMaterialById(id) {
  const m = MATERIALS.find((m) => m.id === id);
  if (!m) throw new Error(`Unknown material id: ${id}`);
  return m;
}
