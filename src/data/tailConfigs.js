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
    modifier: 1.05, // slight efficiency gain from endplate effect
    requiresDihedral: false,
    warnings: [
      'T-tail is susceptible to deep stall: at high AOA the wing wake blankets the horizontal stabilizer, causing locked-in stall with no pitch recovery.',
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
