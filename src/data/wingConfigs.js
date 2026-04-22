// Wing planform configurations.
// liftInterferenceFactor: ratio of effective CL_max to single-wing CL_max (Munck interference)
// dragPenaltyFactor:      multiplier on parasite drag vs monoplane (extra struts, interference)
// structuralWeightFactor: multiplier on wing structural weight vs same-area monoplane

export const WING_CONFIGS = [
  {
    id: 'MONOPLANE',
    name: 'Monoplane',
    liftInterferenceFactor: 1.0,
    dragPenaltyFactor: 1.0,
    structuralWeightFactor: 1.0,
    requiresGapInput: false,
    note: 'Baseline. Best payload fraction when there is no wingspan constraint.',
  },
  {
    id: 'BIPLANE',
    name: 'Biplane (Equal Span)',
    liftInterferenceFactor: 0.85,
    dragPenaltyFactor: 1.10,
    structuralWeightFactor: 1.30,
    requiresGapInput: true,
    note: 'Doubles usable area within a span limit. Heavier due to inter-plane struts and bracing.',
  },
  {
    id: 'SESQUIPLANE',
    name: 'Sesquiplane (Lower Wing 60%)',
    liftInterferenceFactor: 0.92,
    dragPenaltyFactor: 1.06,
    structuralWeightFactor: 1.18,
    requiresGapInput: true,
    note: 'Compromise between biplane lift and monoplane efficiency. Lower wing provides less total area.',
  },
];

export function getWingConfigById(id) {
  const c = WING_CONFIGS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown wing config id: ${id}`);
  return c;
}
