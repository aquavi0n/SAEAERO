// Tail configuration database
// modifier: multiplier applied to V_ht effectiveness (accounts for aerodynamic interference)
// requiresDihedral: whether a dihedral angle input is needed (V-tail)

export const TAIL_CONFIGS = [
  {
    id: 'CONVENTIONAL',
    name: 'Conventional',
    modifier: 1.0,
    requiresDihedral: false,
    warnings: [],
  },
  {
    id: 'T_TAIL',
    name: 'T-Tail',
    // Endplate effect boosts vertical tail efficiency ~25%, but has negligible direct impact
    // on horizontal tail V_ht. Modifier reflects slightly higher dynamic pressure at the tail
    // from being above the fuselage wake. Keep close to 1.0.
    modifier: 1.01,
    requiresDihedral: false,
    warnings: [
      'T-tail at high AOA: the wing wake can partially blanket the horizontal stabilizer, reducing pitch-down authority. This raises the risk of pitch-up divergence and tail flutter. For SAE Aero aircraft the risk is manageable but requires conservative CG placement (SM ≥ 8%) and flight testing at incrementally increasing AOA.',
    ],
  },
  {
    id: 'V_TAIL',
    name: 'V-Tail (Butterfly)',
    modifier: 1.0,
    requiresDihedral: true,
    warnings: [
      'V-tail couples pitch and yaw (ruddervator mixing). Verify control throws are correctly mixed before flight.',
    ],
  },
  {
    id: 'H_TAIL',
    name: 'H-Tail (Twin Boom)',
    modifier: 0.95, // slight loss from boom interference
    requiresDihedral: false,
    warnings: [],
  },
  {
    id: 'CRUCIFORM',
    name: 'Cruciform (+)',
    modifier: 1.0,
    requiresDihedral: false,
    warnings: [],
  },
];

export function getTailConfigById(id) {
  const config = TAIL_CONFIGS.find((t) => t.id === id);
  if (!config) throw new Error(`Unknown tail config id: ${id}`);
  return config;
}
