// SAE Aero competition airfoil database
// CL_max and stallAngle are for Re ~500k (typical SAE Aero conditions)

export const AIRFOILS = [
  {
    id: 'NACA_2412',
    name: 'NACA 2412',
    CL_max: 1.5,
    stallAngle: 16,
    warningText: null,
    constructionNote: 'Classic training airfoil. Easy to build accurately with flat bottom variant.',
  },
  {
    id: 'NACA_4412',
    name: 'NACA 4412',
    CL_max: 1.65,
    stallAngle: 14,
    warningText: null,
    constructionNote: 'Higher camber gives more lift but sharper stall break than 2412.',
  },
  {
    id: 'NACA_0012',
    name: 'NACA 0012',
    CL_max: 1.35,
    stallAngle: 15,
    warningText: null,
    constructionNote: 'Symmetric — suitable for tail surfaces. Not recommended for main wing.',
  },
  {
    id: 'CLARK_Y',
    name: 'Clark Y',
    CL_max: 1.55,
    stallAngle: 15,
    warningText: null,
    constructionNote: 'Flat bottom makes foam/balsa construction straightforward.',
  },
  {
    id: 'E214',
    name: 'Eppler E214',
    CL_max: 1.8,
    stallAngle: 12,
    warningText: 'Abrupt stall — ensure adequate washout or stall strips near root.',
    constructionNote: 'High lift but sensitive to surface finish. Sand to 220 grit minimum.',
  },
  {
    id: 'S1223',
    name: 'Selig S1223',
    CL_max: 2.1,
    stallAngle: 10,
    warningText: 'Very abrupt leading-edge stall at low Re. Requires careful AOA management.',
    constructionNote: 'Highest CL_max in database. Thin leading edge is fragile — reinforce with tape.',
  },
];

export function getAirfoilById(id) {
  const airfoil = AIRFOILS.find((a) => a.id === id);
  if (!airfoil) throw new Error(`Unknown airfoil id: ${id}`);
  return airfoil;
}
