// Fuselage geometry and drag calculations — pure functions, no side effects.
// All lengths in metres, areas in m².

/**
 * Approximate fuselage length from the tail moment arm.
 *   L_fuse ≈ L_ht + 0.5·c
 *
 * The wing AC sits at ~35–40% of fuselage length from the nose; the tail AC
 * is at approximately (L_ht + 0.5·c) from the nose when measuring from the wing LE.
 */
export function calcFuselageLength(L_ht, c) {
  return L_ht + 0.5 * c;
}

/**
 * Nose moment arm — distance from nose to wing leading edge / CG region.
 *   L_nose = L_fuse × 0.35
 *
 * Typical for layouts where the wing is positioned at 35% of fuselage length.
 */
export function calcNoseArm(fuselageLength) {
  return fuselageLength * 0.35;
}

/**
 * Frontal area of the fuselage (rectangular cross-section approximation).
 */
export function calcFrontalArea(fuselageWidth, fuselageHeight) {
  return fuselageWidth * fuselageHeight;
}

/**
 * Fuselage contribution to parasite drag coefficient referenced to wing area.
 *   ΔCD_fuse ≈ 0.006 × (A_frontal / S_wing)
 *
 * This is a flat-plate / bluff-body approximation suitable for box fuselages.
 */
export function calcFuselageDragCoeff(fuselageWidth, fuselageHeight, S_wing) {
  return 0.006 * (calcFrontalArea(fuselageWidth, fuselageHeight) / S_wing);
}

/**
 * Total wetted area (used for skin-friction drag estimation).
 *   S_wet = S_wing + S_ht + S_vt + 2·S_fuse_side
 */
export function calcWettedArea(S_wing, S_ht, S_vt, S_fuse_side) {
  return S_wing + S_ht + S_vt + 2 * S_fuse_side;
}
