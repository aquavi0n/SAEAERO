// fullCalcs.js — Master aerodynamic calculator
// Three inputs: airfoil ID, tail config ID, payload mass (kg)
// Returns a comprehensive aircraft design report with all calculations.

import { AIRFOILS } from '../data/airfoils.js';
import { TAIL_CONFIGS } from '../data/tailConfigs.js';
import { MATERIALS } from '../data/materials.js';

// ─── Physical constants ───────────────────────────────────────────────────────
const RHO   = 1.225;     // kg/m³ — air density at sea level, ISA 15°C
const G     = 9.81;      // m/s²  — gravitational acceleration
const MU    = 1.789e-5;  // Pa·s  — dynamic viscosity of air at 15°C

// ─── Design targets ──────────────────────────────────────────────────────────
const MAX_WINGSPAN       = 10.0;   // m   — hard competition constraint
const AR_WING            = 7.0;    // —   — aspect ratio target (efficiency vs. structure)
const AR_HTAIL           = 4.0;    // —   — horizontal tail aspect ratio
const AR_VTAIL           = 1.5;    // —   — vertical tail (fin) aspect ratio
const V_STALL_TARGET     = 6.0;    // m/s — hand/bungee launch target stall speed
const V_HT_TARGET        = 0.45;   // —   — horizontal tail volume coefficient target
const V_VT_TARGET        = 0.04;   // —   — vertical tail volume coefficient target
const STATIC_MARGIN_TARGET = 0.12; // —   — 12% MAC, conservative for hand-launch UAVs
const OSWALD_E           = 0.80;   // —   — Oswald efficiency factor, typical SAE build
const CD0                = 0.025;  // —   — zero-lift drag coefficient (fuselage + landing gear)

// ─── Fixed weight estimates (no motor/battery input required) ─────────────────
const W_ELECTRONICS = 0.150; // kg — ESC + receiver + servos
const W_MOTOR_EST   = 0.120; // kg — typical SAE brushless motor
const W_BATTERY_EST = 0.200; // kg — typical 3S 2200 mAh LiPo pack

// Baseline material for iterative sizing (balsa — mid-weight, traditional SAE)
const MAT_DENSITY_BASELINE = 0.040; // kg/m²

// ─── Known airfoil geometry (thickness ratio, camber, approx lift-curve slope) ──
const AIRFOIL_GEOM = {
  NACA_2412: { thickness: 0.12, camber: 0.02 },
  NACA_4412: { thickness: 0.12, camber: 0.04 },
  NACA_0012: { thickness: 0.12, camber: 0.00 },
  CLARK_Y:   { thickness: 0.117, camber: 0.036 },
  E214:      { thickness: 0.14,  camber: 0.040 },
  S1223:     { thickness: 0.124, camber: 0.089 },
};

const r = (n, d = 4) => (Number.isFinite(n) ? parseFloat(n.toFixed(d)) : NaN);

export function computeFullReport(airfoilId, tailId, payloadKg) {
  const airfoil  = AIRFOILS.find(a => a.id === airfoilId);
  const tailConf = TAIL_CONFIGS.find(t => t.id === tailId);
  if (!airfoil || !tailConf) throw new Error('Invalid airfoil or tail config ID');

  const geom   = AIRFOIL_GEOM[airfoilId] ?? AIRFOIL_GEOM['NACA_4412'];
  const CL_max = airfoil.CL_max;

  // ── 1. Iterative weight / geometry convergence ───────────────────────────
  // Wing area, tail areas, and component weights all depend on each other.
  // Iterate until total mass converges (typically < 10 passes).
  let m_total = payloadKg * 2.5; // initial guess: assume 40% payload fraction

  let S, b, c, AR_actual, L_ht, S_ht, S_vt;
  let m_wing, m_htail, m_vtail, m_fuse, m_empty;

  for (let iter = 0; iter < 30; iter++) {
    const W_total = m_total * G;

    // Wing area required to stall at target speed
    S = (2 * W_total) / (RHO * CL_max * V_STALL_TARGET ** 2);

    // Wingspan from AR, hard-capped at competition limit
    b       = Math.min(Math.sqrt(S * AR_WING), MAX_WINGSPAN);
    AR_actual = (b * b) / S;
    c       = S / b;  // mean aerodynamic chord (rectangular planform)

    // Tail moment arm: 60% of wingspan (SAE convention, matches historical autoSize)
    L_ht = 0.60 * b;

    // Tail areas sized to meet volume coefficient targets exactly
    S_ht = (V_HT_TARGET * S * c) / L_ht;
    S_vt = (V_VT_TARGET * S * b) / L_ht;

    // Component masses using baseline balsa density
    m_wing  = S       * MAT_DENSITY_BASELINE * 2.2; // 2.2× — ribs, spars, covering
    m_htail = S_ht    * MAT_DENSITY_BASELINE * 1.5;
    m_vtail = S_vt    * MAT_DENSITY_BASELINE * 1.5;
    m_fuse  = 0.120 + 0.060 * b; // fuselage scales with span

    m_empty = m_wing + m_htail + m_vtail + m_fuse + W_ELECTRONICS + W_MOTOR_EST + W_BATTERY_EST;
    const m_new = m_empty + payloadKg;

    if (Math.abs(m_new - m_total) / m_total < 0.0005) {
      m_total = m_new;
      break;
    }
    m_total = m_new;
  }

  const W_total = m_total * G; // Newtons

  // ── 2. Stall and cruise performance ─────────────────────────────────────
  const V_stall = Math.sqrt((2 * W_total) / (RHO * S * CL_max));

  // Best L/D occurs at CL_LD = sqrt(π × AR × e × CD0)
  const CL_LD     = Math.sqrt(CD0 * Math.PI * AR_actual * OSWALD_E);
  const CDi_LD    = CL_LD ** 2 / (Math.PI * AR_actual * OSWALD_E);
  const CD_LD     = CD0 + CDi_LD; // = 2 × CD0 at best L/D
  const LD_max    = CL_LD / CD_LD;
  const V_bestLD  = Math.sqrt((2 * W_total) / (RHO * S * CL_LD));

  // Cruise at best L/D speed
  const V_cruise   = V_bestLD;
  const CL_cruise  = (2 * W_total) / (RHO * V_cruise ** 2 * S);
  const CDi_cruise = CL_cruise ** 2 / (Math.PI * AR_actual * OSWALD_E);
  const CD_cruise  = CD0 + CDi_cruise;
  const LD_cruise  = CL_cruise / CD_cruise;
  const D_cruise   = 0.5 * RHO * V_cruise ** 2 * S * CD_cruise; // N

  // Wing loading
  const WL_Nm2  = W_total / S;
  const WL_kgm2 = m_total / S;

  // Reynolds numbers (chord-based)
  const Re_stall  = (RHO * V_stall  * c) / MU;
  const Re_cruise = (RHO * V_cruise * c) / MU;

  // Glide performance
  const glide_ratio = LD_max;
  const glide_100m  = glide_ratio * 100; // m forward from 100 m altitude

  // ── 3. Propulsion requirements ──────────────────────────────────────────
  const T_level_N  = D_cruise; // thrust for level flight
  const T_level_gf = (T_level_N / G) * 1000;

  // Minimum recommended thrust: whichever is greater —
  //   (a) 1.5× level-flight drag (for climb margin), or
  //   (b) 0.5 × total weight (TWR ≥ 0.5 for adequate climb)
  const T_min_N  = Math.max(1.5 * T_level_N, 0.5 * W_total);
  const T_min_gf = (T_min_N / G) * 1000;
  const TWR_target = T_min_N / W_total;

  // Estimated rate of climb with excess thrust
  const T_excess = T_min_N - T_level_N;
  const RC_ms    = (T_excess * V_cruise) / W_total; // m/s
  const RC_fpm   = RC_ms * 196.85;

  // Power estimate at cruise (thrust × speed, with ~60% total drivetrain efficiency)
  const P_cruise_W = (T_level_N * V_cruise) / 0.60;

  // Propeller diameter heuristic: larger thrust requires larger disk
  const prop_diam_in = Math.min(18, Math.max(8, Math.round(8 + T_min_gf / 400)));

  // ── 4. Aerodynamic stability ────────────────────────────────────────────
  // Tail volume coefficients (should match targets by construction)
  const V_ht = (S_ht * L_ht) / (S * c);
  const V_vt = (S_vt * L_ht) / (S * b);

  // Downwash gradient (AR-corrected)
  const dEps_dAlpha = 2.8 / (AR_actual + 2);

  // Neutral point as fraction of MAC from leading edge
  // h_n = 0.25 + η_ht × (a_ht/a_w) × V_ht × (1 − dε/dα) × tailModifier
  // η_ht × (a_ht/a_w) ≈ 0.90 × 0.90 = 0.81
  const tailMod = tailConf.modifier;
  const h_n = 0.25 + 0.81 * V_ht * (1 - dEps_dAlpha) * tailMod;

  // Recommended CG for target static margin
  const h_cg_rec  = h_n - STATIC_MARGIN_TARGET;
  const SM_pct    = STATIC_MARGIN_TARGET * 100;
  const h_cg_m    = h_cg_rec * c; // metres from wing leading edge

  const stabStatus = h_cg_rec > 0.05 ? 'STABLE' : h_cg_rec > 0.0 ? 'MARGINAL' : 'UNSTABLE';

  // ── 5. Horizontal tail geometry ─────────────────────────────────────────
  const b_ht = Math.sqrt(S_ht * AR_HTAIL);
  const c_ht = S_ht / b_ht;

  const elev_chord = 0.30 * c_ht;
  const elev_span  = 0.90 * b_ht;
  const elev_area  = elev_chord * elev_span;

  // Tail download for trim at cruise (small negative CL on tail)
  const htail_download_N = Math.abs(-0.5 * RHO * V_cruise ** 2 * S_ht * 0.10);

  // Tail airfoil recommendation: thinner for T-tail or small chord
  const htail_airfoil = (tailId === 'T_TAIL' || c_ht < 0.20) ? 'NACA 0009' : 'NACA 0012';

  // ── 6. Vertical tail geometry ────────────────────────────────────────────
  const h_vt = Math.sqrt(S_vt * AR_VTAIL);
  const c_vt = S_vt / h_vt;

  const rud_chord  = 0.35 * c_vt;
  const rud_height = 0.90 * h_vt;
  const rud_area   = rud_chord * rud_height;

  // ── 7. V-tail special geometry ───────────────────────────────────────────
  // For V-tail, find dihedral angle Λ such that each panel provides correct
  // effective horizontal and vertical tail areas simultaneously.
  // Two panels of area A each:  2A cos²Λ = S_ht,  2A sin²Λ = S_vt
  // → tan²Λ = S_vt/S_ht  → A = S_ht / (2 cos²Λ)
  let vtail_dihedral_deg = null;
  let vtail_panel_area   = null;
  let vtail_total_area   = null;
  if (tailId === 'V_TAIL') {
    vtail_dihedral_deg = Math.atan(Math.sqrt(S_vt / S_ht)) * (180 / Math.PI);
    const cosL = Math.cos(vtail_dihedral_deg * Math.PI / 180);
    vtail_panel_area = S_ht / (2 * cosL ** 2);
    vtail_total_area = 2 * vtail_panel_area;
  }

  // ── 8. Ailerons ──────────────────────────────────────────────────────────
  // Outer 35% of each half-span, 22% of chord
  const ail_span_each  = (b / 2) * 0.35;
  const ail_chord      = c * 0.22;
  const ail_area_each  = ail_span_each * ail_chord;
  const ail_area_total = 2 * ail_area_each;
  const ail_inboard    = (b / 2) * (1 - 0.35); // distance from root to inboard edge

  // ── 9. Fuselage sizing ───────────────────────────────────────────────────
  const fuse_width  = Math.max(0.09, 0.07 * b);
  const fuse_height = fuse_width * 1.2;
  const fuse_length = L_ht + 0.5 * c;
  const nose_arm    = fuse_length * 0.35;

  // ── 10. Spar sizing (main wing spar) ────────────────────────────────────
  const spar_pos_m   = 0.25 * c;                             // at 25% chord
  const spar_depth_m = geom.thickness * c * 0.65;            // 65% of airfoil thickness at spar location

  // ── 11. Material recommendation ─────────────────────────────────────────
  let matRec, matRecAlt;
  if (b > 4.0 || payloadKg > 3.0) {
    matRec    = MATERIALS.find(m => m.id === 'CF_1MM');
    matRecAlt = MATERIALS.find(m => m.id === 'BALSA_FG');
  } else if (b > 2.0 || payloadKg > 1.5 || S > 1.5) {
    matRec    = MATERIALS.find(m => m.id === 'BALSA_FG');
    matRecAlt = MATERIALS.find(m => m.id === 'BALSA_3MM');
  } else {
    matRec    = MATERIALS.find(m => m.id === 'BALSA_3MM');
    matRecAlt = MATERIALS.find(m => m.id === 'DEPRON_3MM');
  }

  // Mass comparison for every material
  const matComparison = MATERIALS.map(mat => {
    const mw = r(S          * mat.densityKgM2 * 2.2, 3);
    const mt = r((S_ht + S_vt) * mat.densityKgM2 * 1.5, 3);
    const ms = r(mw + mt, 3);
    const mg = r(ms + m_fuse + W_ELECTRONICS + W_MOTOR_EST + W_BATTERY_EST + payloadKg, 3);
    return { id: mat.id, name: mat.name, mWing: mw, mTail: mt, mStruct: ms, mGTOW: mg, note: mat.note };
  });

  // ── 12. Dihedral recommendation ──────────────────────────────────────────
  let dihedral_deg, dihedral_note;
  if (tailId === 'V_TAIL') {
    dihedral_deg  = 2;
    dihedral_note = 'V-tail provides roll–yaw coupling. Minimal geometric dihedral needed.';
  } else if (AR_actual > 8) {
    dihedral_deg  = 3;
    dihedral_note = 'High AR wing has natural roll restoring tendency; 3° is sufficient.';
  } else {
    dihedral_deg  = 5;
    dihedral_note = 'Standard 5° provides roll stability without excessive adverse yaw.';
  }

  // ── 13. Warnings ─────────────────────────────────────────────────────────
  const warnings = [];
  if (airfoil.warningText)
    warnings.push({ level: 'warn', text: airfoil.warningText });
  tailConf.warnings.forEach(w => warnings.push({ level: 'warn', text: w }));
  if (b >= MAX_WINGSPAN * 0.95)
    warnings.push({ level: 'info', text: `Wingspan is at or near the 10 m limit (${b.toFixed(2)} m). Stall speed may exceed 6 m/s.` });
  if (V_ht < 0.35)
    warnings.push({ level: 'crit', text: `V_ht = ${r(V_ht, 3)} is below 0.35 — pitch stability marginal. Increase S_ht or L_ht.` });
  if (V_vt < 0.025)
    warnings.push({ level: 'crit', text: `V_vt = ${r(V_vt, 3)} is below 0.025 — directional stability marginal.` });
  if (Re_stall < 70000)
    warnings.push({ level: 'crit', text: `Stall Re = ${Math.round(Re_stall).toLocaleString()} — below 70,000. Airfoil lift data is unreliable; increase chord.` });
  else if (Re_cruise < 100000)
    warnings.push({ level: 'warn', text: `Cruise Re = ${Math.round(Re_cruise).toLocaleString()} — below 100,000. Low-Re airfoil (e.g. S1223) preferred.` });

  // ── 14. Assemble report ──────────────────────────────────────────────────
  return {
    inputs: {
      airfoilId,
      airfoilName:  airfoil.name,
      tailId,
      tailTypeName: tailConf.name,
      payloadKg:    r(payloadKg, 2),
    },

    summary: {
      wingspan_m:      r(b, 3),
      wingArea_m2:     r(S, 3),
      chord_m:         r(c, 3),
      AR:              r(AR_actual, 2),
      V_stall_ms:      r(V_stall, 2),
      V_cruise_ms:     r(V_cruise, 2),
      m_total_kg:      r(m_total, 3),
      CG_pctMAC:       r(h_cg_rec * 100, 1),
      T_min_gf:        Math.round(T_min_gf),
      LD_max:          r(LD_max, 2),
    },

    wing: {
      area_m2:          r(S, 4),
      span_m:           r(b, 4),
      chord_m:          r(c, 4),
      AR:               r(AR_actual, 2),
      taperRatio:       1.0,
      WL_Nm2:           r(WL_Nm2, 2),
      WL_kgm2:          r(WL_kgm2, 3),
      incidence_deg:    3.0,
      washout_deg:      2.0,
      dihedral_deg,
      dihedralNote:     dihedral_note,
      CL_max,
      thicknessPct:     r(geom.thickness * 100, 1),
      camberPct:        r(geom.camber * 100, 2),
    },

    ailerons: {
      span_each_m:      r(ail_span_each, 4),
      chord_m:          r(ail_chord, 4),
      area_each_m2:     r(ail_area_each, 5),
      area_total_m2:    r(ail_area_total, 5),
      inboard_m:        r(ail_inboard, 4),
      halfspan_m:       r(b / 2, 4),
      deflect:          '±20°',
    },

    aero: {
      V_stall_ms:    r(V_stall, 3),
      V_cruise_ms:   r(V_cruise, 3),
      V_bestLD_ms:   r(V_bestLD, 3),
      CL_max,
      CL_cruise:     r(CL_cruise, 4),
      CL_LD:         r(CL_LD, 4),
      CD0,
      CDi_cruise:    r(CDi_cruise, 5),
      CD_cruise:     r(CD_cruise, 5),
      LD_max:        r(LD_max, 2),
      LD_cruise:     r(LD_cruise, 2),
      D_cruise_N:    r(D_cruise, 3),
      Re_stall:      Math.round(Re_stall),
      Re_cruise:     Math.round(Re_cruise),
      glideRatio:    r(glide_ratio, 1),
      glideDist_100m: r(glide_100m, 0),
      oswaldE:       OSWALD_E,
    },

    stability: {
      V_ht:              r(V_ht, 4),
      V_vt:              r(V_vt, 4),
      dEps_dAlpha:       r(dEps_dAlpha, 4),
      NP_pctMAC:         r(h_n * 100, 2),
      CG_pctMAC:         r(h_cg_rec * 100, 2),
      CG_from_LE_m:      r(h_cg_m, 4),
      SM_pct:            r(SM_pct, 1),
      status:            stabStatus,
    },

    htail: {
      area_m2:      r(S_ht, 4),
      span_m:       r(b_ht, 4),
      chord_m:      r(c_ht, 4),
      AR:           AR_HTAIL,
      momentArm_m:  r(L_ht, 3),
      V_ht:         r(V_ht, 4),
      airfoil:      htail_airfoil,
      download_N:   r(htail_download_N, 2),
      elev_chord_m: r(elev_chord, 4),
      elev_span_m:  r(elev_span, 4),
      elev_area_m2: r(elev_area, 5),
    },

    vtail: {
      area_m2:       r(S_vt, 4),
      height_m:      r(h_vt, 4),
      chord_m:       r(c_vt, 4),
      AR:            AR_VTAIL,
      momentArm_m:   r(L_ht, 3),
      V_vt:          r(V_vt, 4),
      airfoil:       'NACA 0009',
      rud_chord_m:   r(rud_chord, 4),
      rud_height_m:  r(rud_height, 4),
      rud_area_m2:   r(rud_area, 5),
      // V-tail specific (null if not V-tail)
      isVTail:           tailId === 'V_TAIL',
      vtail_dihedral_deg: vtail_dihedral_deg !== null ? r(vtail_dihedral_deg, 2) : null,
      vtail_panel_m2:     vtail_panel_area   !== null ? r(vtail_panel_area, 4)   : null,
      vtail_total_m2:     vtail_total_area   !== null ? r(vtail_total_area, 4)   : null,
    },

    fuselage: {
      length_m:     r(fuse_length, 3),
      nose_arm_m:   r(nose_arm, 3),
      tail_arm_m:   r(L_ht, 3),
      width_m:      r(fuse_width, 3),
      height_m:     r(fuse_height, 3),
    },

    weights: {
      m_wing_kg:     r(m_wing, 3),
      m_htail_kg:    r(m_htail, 3),
      m_vtail_kg:    r(m_vtail, 3),
      m_fuse_kg:     r(m_fuse, 3),
      m_elec_kg:     r(W_ELECTRONICS, 3),
      m_motor_kg:    r(W_MOTOR_EST, 3),
      m_battery_kg:  r(W_BATTERY_EST, 3),
      m_payload_kg:  r(payloadKg, 3),
      m_empty_kg:    r(m_empty, 3),
      m_total_kg:    r(m_total, 3),
      payloadFrac_pct: r((payloadKg / m_total) * 100, 1),
    },

    propulsion: {
      T_level_N:    r(T_level_N, 2),
      T_level_gf:   Math.round(T_level_gf),
      T_min_N:      r(T_min_N, 2),
      T_min_gf:     Math.round(T_min_gf),
      TWR_target:   r(TWR_target, 2),
      P_cruise_W:   r(P_cruise_W, 1),
      RC_ms:        r(RC_ms, 2),
      RC_fpm:       Math.round(RC_fpm),
      prop_diam_in: prop_diam_in,
    },

    spar: {
      position_m:   r(spar_pos_m, 4),
      depth_m:      r(spar_depth_m, 4),
    },

    materials: {
      rec:         matRec,
      alt:         matRecAlt,
      comparison:  matComparison,
    },

    tailAirfoilReason: (tailId === 'T_TAIL' || c_ht < 0.20)
      ? 'NACA 0009 (9% thick) — thinner section reduces weight and drag at small chord. Critical for T-tail where fin-tip mass drives flutter margin.'
      : 'NACA 0012 (12% thick) — symmetric section, good structural depth, easier to build accurately. Standard choice for tail surfaces.',

    warnings,

    meta: {
      V_stall_target: V_STALL_TARGET,
      maxWingspan:    MAX_WINGSPAN,
      AR_target:      AR_WING,
      V_ht_target:    V_HT_TARGET,
      V_vt_target:    V_VT_TARGET,
      SM_target_pct:  STATIC_MARGIN_TARGET * 100,
    },
  };
}
