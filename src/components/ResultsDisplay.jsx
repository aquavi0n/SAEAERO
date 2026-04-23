import { useState } from 'react';

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, unit = '', note = '', bold = false }) {
  return (
    <div className={`flex items-baseline py-0.5 gap-3 ${bold ? 'text-gray-100' : 'text-gray-300'}`}>
      <span className={`text-sm w-72 shrink-0 ${bold ? 'font-semibold text-gray-200' : 'text-gray-400'}`}>{label}</span>
      <span className="text-sm font-mono">
        {String(value)}
        {unit && <span className="text-gray-600 text-xs ml-1">{unit}</span>}
      </span>
      {note && <span className="text-xs text-gray-600 shrink-0">{note}</span>}
    </div>
  );
}

function Note({ text, type = 'info' }) {
  const cls = type === 'crit' ? 'text-red-400' : type === 'warn' ? 'text-orange-400' : 'text-gray-500';
  const icon = type === 'crit' ? '✖' : type === 'warn' ? '⚠' : 'ℹ';
  return <p className={`text-xs mt-1 leading-snug ${cls}`}>{icon} {text}</p>;
}

function Sub({ title }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">{title}</p>;
}

export default function ResultsDisplay({ results: r, onBack }) {
  const [showVerification, setShowVerification] = useState(false);

  // Group verification steps by section
  const groups = r.steps.reduce((acc, step) => {
    if (!acc[step.group]) acc[step.group] = [];
    acc[step.group].push(step);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Aircraft Design Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.inputs.airfoilName} &middot; {r.inputs.tailTypeName} &middot; {r.inputs.payloadKg} kg payload
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="text-sm border border-gray-700 px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            Print
          </button>
          <button
            onClick={onBack}
            className="text-sm border border-gray-700 px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <div className="mb-6 p-3 border border-orange-900 bg-orange-950/40 rounded">
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Notices</p>
          {r.warnings.map((w, i) => <Note key={i} text={w.text} type={w.level} />)}
        </div>
      )}

      {/* ── QUICK SUMMARY ─────────────────────────────────────────────── */}
      <Section title="Quick Summary">
        <div className="grid grid-cols-2 gap-x-8">
          <Row label="Wingspan"                  value={`${r.summary.wingspan_m} m`}     bold />
          <Row label="Wing Area"                 value={`${r.summary.wingArea_m2} m²`}   bold />
          <Row label="Mean Aerodynamic Chord"    value={`${r.summary.chord_m} m`}        bold />
          <Row label="Aspect Ratio"              value={r.summary.AR}                    bold />
          <Row label="Stall Speed"               value={`${r.summary.V_stall_ms} m/s`}  bold />
          <Row label="Cruise Speed (best L/D)"   value={`${r.summary.V_cruise_ms} m/s`} bold />
          <Row label="Total Weight (GTOW)"       value={`${r.summary.m_total_kg} kg`}   bold />
          <Row label="Max L/D"                   value={r.summary.LD_max}               bold />
          <Row label="Recommended CG"            value={`${r.summary.CG_pctMAC}% MAC`}  bold />
          <Row label="Min Motor Thrust Required" value={`${r.summary.T_min_gf} gf`}     bold />
        </div>
      </Section>

      {/* ── WING GEOMETRY ─────────────────────────────────────────────── */}
      <Section title="Wing Geometry &amp; Sizing">
        <Row label="Wing Area (S)"              value={r.wing.area_m2}   unit="m²" />
        <Row label="Wingspan (b)"               value={`${r.wing.span_m} m  [limit: ${r.meta.maxWingspan} m]`} bold />
        <Row label="Mean Aerodynamic Chord"     value={r.wing.chord_m}   unit="m"  bold />
        <Row label="Aspect Ratio (AR)"          value={r.wing.AR}                  bold />
        <Row label="Taper Ratio"                value={r.wing.taperRatio} note="Rectangular — same chord root to tip" />
        <Row label="Wing Loading"               value={`${r.wing.WL_Nm2} N/m²  (${r.wing.WL_kgm2} kg/m²)`} />
        <Row label="Airfoil Thickness (t/c)"    value={`${r.wing.thicknessPct}%`} />
        <Row label="Airfoil Camber"             value={`${r.wing.camberPct}%`} />
        <Row label="CL_max"                     value={r.wing.CL_max} />
        <hr className="my-2 border-gray-800" />
        <Row label="Incidence Angle (root)"     value={`${r.wing.incidence_deg}°`}  note="leading edge up" />
        <Row label="Geometric Washout (tip)"    value={`−${r.wing.washout_deg}°`}   note="tip LE down; prevents tip stall" />
        <Row label="Dihedral"                   value={`${r.wing.dihedral_deg}°`} />
        <Note text={r.wing.dihedralNote} />
      </Section>

      {/* ── AILERONS ──────────────────────────────────────────────────── */}
      <Section title="Ailerons">
        <Row label="Location"                   value={`${r.ailerons.inboard_m} m from root → ${r.ailerons.halfspan_m} m (tip)`} />
        <Row label="Span per side"              value={r.ailerons.span_each_m}  unit="m"  bold />
        <Row label="Chord (22% of wing chord)"  value={r.ailerons.chord_m}      unit="m"  bold />
        <Row label="Area per side"              value={r.ailerons.area_each_m2} unit="m²" />
        <Row label="Total Aileron Area"         value={r.ailerons.area_total_m2} unit="m²" />
        <Row label="Deflection Range"           value={r.ailerons.deflect} />
        <Note text="Outer 35% of each half-span. Use differential throws (more up than down) to reduce adverse yaw." />
      </Section>

      {/* ── AERODYNAMIC PERFORMANCE ───────────────────────────────────── */}
      <Section title="Aerodynamic Performance">
        <Row label="Stall Speed (V_s)"               value={r.aero.V_stall_ms}   unit="m/s" bold note="sea level ISA" />
        <Row label="Best L/D Speed (V_LD)"           value={r.aero.V_bestLD_ms}  unit="m/s" bold />
        <Row label="Recommended Cruise Speed"        value={r.aero.V_cruise_ms}  unit="m/s" note="= V_LD" />
        <hr className="my-2 border-gray-800" />
        <Row label="CL at Stall"                     value={r.aero.CL_max}  note="= CL_max" />
        <Row label="CL at Best L/D"                  value={r.aero.CL_LD} />
        <Row label="CL at Cruise"                    value={r.aero.CL_cruise} />
        <hr className="my-2 border-gray-800" />
        <Row label="Parasite Drag (CD₀)"             value={r.aero.CD0} />
        <Row label="Induced Drag (CDᵢ) at Cruise"   value={r.aero.CDi_cruise} />
        <Row label="Total Drag (CD) at Cruise"       value={r.aero.CD_cruise} />
        <Row label="Drag Force at Cruise"            value={r.aero.D_cruise_N}   unit="N" />
        <Row label="Oswald Efficiency Factor (e)"   value={r.aero.oswaldE} />
        <hr className="my-2 border-gray-800" />
        <Row label="L/D at Cruise"                   value={r.aero.LD_cruise} />
        <Row label="Max L/D"                         value={r.aero.LD_max}        bold />
        <Row label="Glide Ratio"                     value={r.aero.glideRatio} />
        <Row label="Glide Distance from 100 m alt"  value={r.aero.glideDist_100m} unit="m" />
        <hr className="my-2 border-gray-800" />
        <Row label="Reynolds No. at Stall"           value={r.aero.Re_stall.toLocaleString()} />
        <Row label="Reynolds No. at Cruise"          value={r.aero.Re_cruise.toLocaleString()} />
        <Note text="Low-Re regime (< 500,000). Airfoil selection is critical; laminar separation bubbles cause early CL drop." />
      </Section>

      {/* ── STABILITY & CONTROL ───────────────────────────────────────── */}
      <Section title="Stability &amp; Control">
        <Row label="H-Tail Volume Coefficient (V_ht)" value={r.stability.V_ht} note={`target ${r.meta.V_ht_target}`} bold />
        <Row label="V-Tail Volume Coefficient (V_vt)" value={r.stability.V_vt} note={`target ${r.meta.V_vt_target}`} bold />
        <Row label="Downwash Gradient (dε/dα)"        value={r.stability.dEps_dAlpha} />
        <hr className="my-2 border-gray-800" />
        <Row label="Neutral Point"                    value={`${r.stability.NP_pctMAC}% MAC`}  bold />
        <Row label="Recommended CG"                   value={`${r.stability.CG_pctMAC}% MAC  (${r.stability.CG_from_LE_m} m from wing LE)`} bold />
        <Row label="Static Margin"                    value={`${r.stability.SM_pct}%`}  note={`target ${r.meta.SM_target_pct}%`} />
        <Row label="Pitch Stability"                  value={r.stability.status} />
        <Note text="CG must stay FORWARD of neutral point. Verify balance on actual aircraft before flight." />
      </Section>

      {/* ── HORIZONTAL TAIL ───────────────────────────────────────────── */}
      <Section title="Horizontal Tail">
        <Row label="Recommended Airfoil"        value={r.htail.airfoil} bold />
        <Note text={r.tailAirfoilReason} />
        <hr className="my-2 border-gray-800" />
        <Row label="Area (S_ht)"                value={r.htail.area_m2}     unit="m²" bold />
        <Row label="Span"                       value={r.htail.span_m}      unit="m"  bold />
        <Row label="Chord"                      value={r.htail.chord_m}     unit="m"  bold />
        <Row label="Aspect Ratio"               value={r.htail.AR} />
        <Row label="Moment Arm (L_ht)"          value={r.htail.momentArm_m} unit="m" />
        <Row label="Volume Coefficient (V_ht)"  value={r.htail.V_ht} />
        <Row label="Incidence Angle"            value="0°" note="Trim via elevator or radio mix" />
        <Row label="Tail Download at Cruise"    value={r.htail.download_N}  unit="N" note="negative lift for pitch trim" />
        <Sub title="Elevator" />
        <Row label="Elevator Chord (30% tail chord)" value={r.htail.elev_chord_m} unit="m" bold />
        <Row label="Elevator Span  (90% tail span)"  value={r.htail.elev_span_m}  unit="m" bold />
        <Row label="Elevator Area"              value={r.htail.elev_area_m2} unit="m²" />
        <Row label="Deflection Range"           value="±25° up / ±20° down" />
      </Section>

      {/* ── VERTICAL TAIL ─────────────────────────────────────────────── */}
      {r.vtail.isVTail ? (
        <Section title="V-Tail (Ruddervator)">
          <Row label="Recommended Airfoil"          value={r.vtail.airfoil} bold />
          <hr className="my-2 border-gray-800" />
          <Row label="Dihedral Angle (each panel)"  value={`${r.vtail.vtail_dihedral_deg}°`} bold />
          <Row label="Panel Area (each of 2)"       value={r.vtail.vtail_panel_m2}  unit="m²" bold />
          <Row label="Total V-Tail Area"            value={r.vtail.vtail_total_m2}  unit="m²" />
          <Row label="Moment Arm"                   value={r.vtail.momentArm_m}     unit="m" />
          <Note text={`Effective H-tail = ${r.htail.area_m2} m². Effective V-tail = ${r.vtail.area_m2} m².`} />
          <Sub title="Ruddervator (one per panel)" />
          <Row label="Surface Chord (35%)"          value={r.vtail.rud_chord_m}  unit="m" bold />
          <Row label="Surface Height (90%)"         value={r.vtail.rud_height_m} unit="m" bold />
          <Row label="Surface Area (each)"          value={r.vtail.rud_area_m2}  unit="m²" />
          <Row label="Deflection Range"             value="±25°" />
          <Note text="Program ruddervator mix in transmitter: same direction = pitch, opposite = yaw." type="warn" />
        </Section>
      ) : (
        <Section title="Vertical Tail (Fin)">
          <Row label="Recommended Airfoil"          value={r.vtail.airfoil} bold />
          <Note text="Symmetric profile (zero camber). NACA 0009 for T-tail or small chord." />
          <hr className="my-2 border-gray-800" />
          <Row label="Area (S_vt)"                  value={r.vtail.area_m2}     unit="m²" bold />
          <Row label="Fin Height"                   value={r.vtail.height_m}    unit="m"  bold />
          <Row label="Fin Chord"                    value={r.vtail.chord_m}     unit="m"  bold />
          <Row label="Aspect Ratio"                 value={r.vtail.AR} />
          <Row label="Moment Arm"                   value={r.vtail.momentArm_m} unit="m" />
          <Row label="Volume Coefficient (V_vt)"    value={r.vtail.V_vt} />
          <Sub title="Rudder" />
          <Row label="Rudder Chord (35% fin chord)" value={r.vtail.rud_chord_m}  unit="m" bold />
          <Row label="Rudder Height (90% fin)"      value={r.vtail.rud_height_m} unit="m" bold />
          <Row label="Rudder Area"                  value={r.vtail.rud_area_m2}  unit="m²" />
          <Row label="Deflection Range"             value="±30°" />
          {r.inputs.tailId === 'H_TAIL' && (
            <Note text="H-tail: build two identical fins, each with area = S_vt / 2." />
          )}
        </Section>
      )}

      {/* ── FUSELAGE ──────────────────────────────────────────────────── */}
      <Section title="Fuselage Sizing">
        <Row label="Total Length"               value={r.fuselage.length_m}  unit="m" bold />
        <Row label="Nose to Wing LE"            value={r.fuselage.nose_arm_m} unit="m" />
        <Row label="Tail Moment Arm"            value={r.fuselage.tail_arm_m} unit="m" />
        <Row label="Width (recommended)"        value={r.fuselage.width_m}   unit="m" />
        <Row label="Height (recommended)"       value={r.fuselage.height_m}  unit="m" />
      </Section>

      {/* ── WEIGHT BUDGET ─────────────────────────────────────────────── */}
      <Section title="Weight Budget">
        <Row label="Wing structure"             value={r.weights.m_wing_kg}    unit="kg" />
        <Row label="Horizontal tail"            value={r.weights.m_htail_kg}   unit="kg" />
        <Row label="Vertical tail"              value={r.weights.m_vtail_kg}   unit="kg" />
        <Row label="Fuselage"                   value={r.weights.m_fuse_kg}    unit="kg" />
        <Row label="Electronics (est.)"         value={r.weights.m_elec_kg}    unit="kg" />
        <Row label="Motor (est.)"               value={r.weights.m_motor_kg}   unit="kg" />
        <Row label="Battery (est.)"             value={r.weights.m_battery_kg} unit="kg" />
        <Row label="Payload"                    value={r.weights.m_payload_kg} unit="kg" />
        <hr className="my-2 border-gray-700" />
        <Row label="Empty Weight"               value={r.weights.m_empty_kg}   unit="kg" bold />
        <Row label="GTOW"                       value={r.weights.m_total_kg}   unit="kg" bold />
        <Row label="Payload Fraction"           value={`${r.weights.payloadFrac_pct}%`}   bold />
        <Note text="Motor and battery are estimates. Replace with actual component masses for precise sizing." />
      </Section>

      {/* ── PROPULSION ────────────────────────────────────────────────── */}
      <Section title="Propulsion Requirements">
        <Row label="Thrust for Level Flight"       value={`${r.propulsion.T_level_N} N  (${r.propulsion.T_level_gf} gf)`} />
        <Row label="Min Recommended Motor Thrust"  value={`${r.propulsion.T_min_N} N  (${r.propulsion.T_min_gf} gf)`}  bold />
        <Row label="Target TWR"                    value={r.propulsion.TWR_target} note="≥ 0.5 recommended" />
        <Row label="Cruise Power Required"         value={r.propulsion.P_cruise_W} unit="W" note="at 60% drivetrain efficiency" />
        <Row label="Estimated Rate of Climb"       value={`${r.propulsion.RC_ms} m/s  (${r.propulsion.RC_fpm} fpm)`} />
        <Row label="Propeller Diameter (est.)"     value={`${r.propulsion.prop_diam_in}"`} />
        <Note text="Use eCalc or MotoCalc with actual motor KV, voltage, and prop data for precise selection." />
      </Section>

      {/* ── SPAR ──────────────────────────────────────────────────────── */}
      <Section title="Main Spar Design">
        <Row label="Spar Position from Wing LE"    value={r.spar.position_m}  unit="m" note="25% chord" bold />
        <Row label="Required Structural Depth"     value={r.spar.depth_m}     unit="m" note="65% of airfoil thickness" />
        <Note text="Pultruded carbon fiber tube or rectangular rod, full span. Ribs at 150–200 mm spacing." />
      </Section>

      {/* ── MATERIALS ─────────────────────────────────────────────────── */}
      <Section title="Material Recommendations">
        <Row label="Primary Recommendation"    value={r.materials.rec.name}   bold />
        <Note text={r.materials.rec.note} />
        <Row label="Alternative"               value={r.materials.alt.name} />
        <Note text={r.materials.alt.note} />

        <Sub title="Weight Comparison (wing + tail surfaces)" />
        <div className="overflow-x-auto mt-1">
          <table className="text-xs font-mono w-full min-w-max">
            <thead>
              <tr className="border-b border-gray-800 text-gray-600">
                <th className="text-left py-1 pr-4 font-normal w-48">Material</th>
                <th className="text-right py-1 pr-4 font-normal">Wing</th>
                <th className="text-right py-1 pr-4 font-normal">Tail</th>
                <th className="text-right py-1 pr-4 font-normal">Structural</th>
                <th className="text-right py-1 font-normal">GTOW (est.)</th>
              </tr>
            </thead>
            <tbody>
              {r.materials.comparison.map(m => (
                <tr key={m.id} className={m.id === r.materials.rec.id ? 'font-bold text-blue-400' : 'text-gray-500'}>
                  <td className="py-0.5 pr-4">{m.name}{m.id === r.materials.rec.id && ' ✓'}</td>
                  <td className="text-right pr-4">{m.mWing} kg</td>
                  <td className="text-right pr-4">{m.mTail} kg</td>
                  <td className="text-right pr-4">{m.mStruct} kg</td>
                  <td className="text-right">{m.mGTOW} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── DESIGN CHECKLIST ──────────────────────────────────────────── */}
      <Section title="Pre-Build Checklist">
        {[
          'Balance aircraft to recommended CG before first flight.',
          'Verify all control surface directions on bench before arming motor.',
          `Apply ${r.wing.washout_deg}° washout at wing tips — essential with high-lift airfoils.`,
          'Reinforce wing root with fiberglass tape — highest bending stress location.',
          `Install carbon fiber spar at ${r.spar.position_m} m from LE, full span.`,
          'Test ruddervator mix (V-tail only) with transmitter before any flight.',
          'Weigh every component and recheck balance with payload installed.',
          'Hand-glide test at walking speed before full-power flight.',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="text-gray-700 text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <p className="text-sm text-gray-400">{item}</p>
          </div>
        ))}
      </Section>

      {/* ── VERIFICATION BUTTON ───────────────────────────────────────── */}
      <div className="mt-6 mb-2">
        <button
          onClick={() => setShowVerification(v => !v)}
          className="w-full py-2.5 rounded border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {showVerification ? '▲ Hide Calculation Steps' : '▼ Show Calculation Steps'}
        </button>
      </div>

      {/* ── VERIFICATION PANEL ────────────────────────────────────────── */}
      {showVerification && (
        <div className="mt-4 mb-10 border border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-bold text-white">Calculation Verification</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Every major formula with substituted values and results.
            </p>
          </div>

          {Object.entries(groups).map(([groupName, steps]) => (
            <div key={groupName}>
              <div className="bg-gray-900/60 px-4 py-2 border-b border-gray-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{groupName}</p>
              </div>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="px-4 py-3 border-b border-gray-800/60 font-mono text-xs hover:bg-gray-900/40"
                >
                  <p className="text-gray-200 font-semibold mb-1 font-sans text-xs">{step.name}</p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                    <span className="text-gray-600">Formula</span>
                    <span className="text-blue-300">{step.formula}</span>
                    <span className="text-gray-600">Values </span>
                    <span className="text-gray-400">{step.calc}</span>
                    <span className="text-gray-600">Result </span>
                    <span className="text-green-400 font-bold">{step.result}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-700 mt-4 mb-8 border-t border-gray-800 pt-3">
        Stall target {r.meta.V_stall_target} m/s · AR {r.meta.AR_target} ·
        V_ht {r.meta.V_ht_target} · V_vt {r.meta.V_vt_target} ·
        SM {r.meta.SM_target_pct}% MAC · Max span {r.meta.maxWingspan} m
      </p>
    </div>
  );
}
