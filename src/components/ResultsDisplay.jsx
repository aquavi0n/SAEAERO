// ResultsDisplay — renders the full aircraft design report as organized text sections.
// No charts or graphics — all numbers, all calculations.

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, unit = '', note = '', bold = false }) {
  return (
    <div className={`flex items-baseline py-0.5 gap-3 ${bold ? 'font-semibold' : ''}`}>
      <span className="text-sm text-gray-600 w-72 shrink-0">{label}</span>
      <span className="text-sm font-mono">
        {String(value)}
        {unit && <span className="text-gray-400 text-xs ml-1">{unit}</span>}
      </span>
      {note && <span className="text-xs text-gray-400 shrink-0">{note}</span>}
    </div>
  );
}

function Note({ text, type = 'info' }) {
  const cls = type === 'crit' ? 'text-red-600' : type === 'warn' ? 'text-orange-600' : 'text-gray-500';
  const icon = type === 'crit' ? '✖' : type === 'warn' ? '⚠' : 'ℹ';
  return <p className={`text-xs mt-1 leading-snug ${cls}`}>{icon} {text}</p>;
}

function Sub({ title }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1">{title}</p>;
}

export default function ResultsDisplay({ results: r, onBack }) {
  const stabColor =
    r.stability.status === 'STABLE'   ? 'text-green-700' :
    r.stability.status === 'MARGINAL' ? 'text-orange-600' :
    'text-red-600';

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aircraft Design Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.inputs.airfoilName} &middot; {r.inputs.tailTypeName} &middot; {r.inputs.payloadKg} kg payload
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600"
          >
            Print
          </button>
          <button
            onClick={onBack}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <div className="mb-6 p-3 border border-orange-200 bg-orange-50 rounded">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Notices</p>
          {r.warnings.map((w, i) => <Note key={i} text={w.text} type={w.level} />)}
        </div>
      )}

      {/* ── QUICK SUMMARY ─────────────────────────────────────────────────── */}
      <Section title="Quick Summary">
        <div className="grid grid-cols-2 gap-x-8">
          <Row label="Wingspan"                  value={`${r.summary.wingspan_m} m`}     bold />
          <Row label="Wing Area"                 value={`${r.summary.wingArea_m2} m²`}   bold />
          <Row label="Mean Aerodynamic Chord"    value={`${r.summary.chord_m} m`}        bold />
          <Row label="Aspect Ratio"              value={r.summary.AR}                    bold />
          <Row label="Stall Speed"               value={`${r.summary.V_stall_ms} m/s`}  bold />
          <Row label="Cruise Speed (best L/D)"   value={`${r.summary.V_cruise_ms} m/s`} bold />
          <Row label="Total Weight (GTOW)"       value={`${r.summary.m_total_kg} kg`}    bold />
          <Row label="Max L/D"                   value={r.summary.LD_max}               bold />
          <Row label="Recommended CG"            value={`${r.summary.CG_pctMAC}% MAC`}  bold />
          <Row label="Min Motor Thrust Required" value={`${r.summary.T_min_gf} gf`}     bold />
        </div>
      </Section>

      {/* ── WING GEOMETRY ────────────────────────────────────────────────── */}
      <Section title="Wing Geometry &amp; Sizing">
        <Row label="Wing Area (S)"              value={r.wing.area_m2}   unit="m²" />
        <Row label="Wingspan (b)"               value={`${r.wing.span_m} m  [limit: ${r.meta.maxWingspan} m]`} bold />
        <Row label="Mean Aerodynamic Chord (MAC)" value={r.wing.chord_m} unit="m" bold />
        <Row label="Aspect Ratio (AR)"          value={r.wing.AR}                  bold />
        <Row label="Taper Ratio"                value={r.wing.taperRatio} note="Rectangular — same chord root to tip" />
        <Row label="Wing Loading"               value={`${r.wing.WL_Nm2} N/m²   (${r.wing.WL_kgm2} kg/m²)`} />
        <Row label="Airfoil Thickness (t/c)"    value={`${r.wing.thicknessPct}%`} />
        <Row label="Airfoil Camber"             value={`${r.wing.camberPct}%`} />
        <Row label="CL_max (with selected airfoil)" value={r.wing.CL_max} />
        <hr className="my-2 border-gray-100" />
        <Row label="Incidence Angle (root)"     value={`${r.wing.incidence_deg}°`}   note="Positive — leading edge up" />
        <Row label="Geometric Washout (tip)"    value={`−${r.wing.washout_deg}°`}    note="Tip LE rotated down relative to root; prevents tip stall" />
        <Row label="Dihedral"                   value={`${r.wing.dihedral_deg}°`} />
        <Note text={r.wing.dihedralNote} />
      </Section>

      {/* ── AILERONS ─────────────────────────────────────────────────────── */}
      <Section title="Ailerons">
        <Row label="Location (from root)"       value={`${r.ailerons.inboard_m} m inboard edge → ${r.ailerons.halfspan_m} m (tip)`} />
        <Row label="Span per side"              value={r.ailerons.span_each_m} unit="m"  bold />
        <Row label="Chord (22% of wing chord)"  value={r.ailerons.chord_m}     unit="m"  bold />
        <Row label="Area per side"              value={r.ailerons.area_each_m2} unit="m²" />
        <Row label="Total Aileron Area"         value={r.ailerons.area_total_m2} unit="m²" />
        <Row label="Deflection Range"           value={r.ailerons.deflect} />
        <Note text="Occupies outer 35% of each half-span. Differential deflection (more up than down) recommended to reduce adverse yaw." />
      </Section>

      {/* ── AERODYNAMIC PERFORMANCE ──────────────────────────────────────── */}
      <Section title="Aerodynamic Performance">
        <Row label="Stall Speed (V_s)"          value={r.aero.V_stall_ms}   unit="m/s" bold note="sea level, ISA" />
        <Row label="Best L/D Speed (V_LD)"      value={r.aero.V_bestLD_ms}  unit="m/s" bold />
        <Row label="Recommended Cruise Speed"   value={r.aero.V_cruise_ms}  unit="m/s" note="= V_LD for max range" />
        <hr className="my-2 border-gray-100" />
        <Row label="CL at Stall"                value={r.aero.CL_max}  note="= CL_max" />
        <Row label="CL at Best L/D"             value={r.aero.CL_LD} />
        <Row label="CL at Cruise"               value={r.aero.CL_cruise} />
        <hr className="my-2 border-gray-100" />
        <Row label="Parasite Drag Coefficient (CD₀)"  value={r.aero.CD0} />
        <Row label="Induced Drag Coefficient (CDᵢ) at Cruise" value={r.aero.CDi_cruise} />
        <Row label="Total Drag Coefficient (CD) at Cruise"    value={r.aero.CD_cruise} />
        <Row label="Total Drag Force at Cruise" value={r.aero.D_cruise_N}  unit="N" />
        <Row label="Oswald Efficiency Factor"   value={r.aero.oswaldE}     note="typical SAE build quality" />
        <hr className="my-2 border-gray-100" />
        <Row label="Lift-to-Drag Ratio at Cruise"  value={r.aero.LD_cruise} />
        <Row label="Maximum L/D (best L/D speed)"  value={r.aero.LD_max}    bold />
        <Row label="Glide Ratio"                   value={r.aero.glideRatio} note="= max L/D" />
        <Row label="Glide Distance from 100 m alt" value={r.aero.glideDist_100m} unit="m" />
        <hr className="my-2 border-gray-100" />
        <Row label="Reynolds Number — Stall"    value={r.aero.Re_stall.toLocaleString()}  note="chord-based, sea level" />
        <Row label="Reynolds Number — Cruise"   value={r.aero.Re_cruise.toLocaleString()} />
        <Note text="Low-Re regime (< 500,000) — airfoil selection is critical. Laminar separation bubbles cause early CL drop." />
      </Section>

      {/* ── STABILITY & CONTROL ──────────────────────────────────────────── */}
      <Section title="Stability &amp; Control">
        <Row label="H-Tail Volume Coefficient (V_ht)"   value={r.stability.V_ht}    note={`target ${r.meta.V_ht_target}`}  bold />
        <Row label="V-Tail Volume Coefficient (V_vt)"   value={r.stability.V_vt}    note={`target ${r.meta.V_vt_target}`}  bold />
        <Row label="Downwash Gradient (dε/dα)"          value={r.stability.dEps_dAlpha} />
        <hr className="my-2 border-gray-100" />
        <Row label="Neutral Point"                      value={`${r.stability.NP_pctMAC}% MAC`} bold />
        <Row label="Recommended CG Location"            value={`${r.stability.CG_pctMAC}% MAC  (${r.stability.CG_from_LE_m} m from wing LE)`} bold />
        <Row label="Static Margin (at rec. CG)"         value={`${r.stability.SM_pct}%`}  note={`target ${r.meta.SM_target_pct}%`} />
        <Row label="Pitch Stability Status"             value={r.stability.status} />
        <Note text="CG must be FORWARD of neutral point to be stable. Moving CG aft increases maneuverability but decreases stability. Never exceed neutral point." />
        <Note text="Verify CG by balancing actual aircraft before flight. Shift battery fore/aft to trim." />
      </Section>

      {/* ── HORIZONTAL TAIL ──────────────────────────────────────────────── */}
      <Section title="Horizontal Tail">
        <Row label="Recommended Airfoil"        value={r.htail.airfoil}      bold />
        <Note text={r.tailAirfoilReason} />
        <hr className="my-2 border-gray-100" />
        <Row label="Horizontal Tail Area (S_ht)" value={r.htail.area_m2}    unit="m²" bold />
        <Row label="Horizontal Tail Span"        value={r.htail.span_m}     unit="m"  bold />
        <Row label="Horizontal Tail Chord"       value={r.htail.chord_m}    unit="m"  bold />
        <Row label="Horizontal Tail Aspect Ratio" value={r.htail.AR} />
        <Row label="Tail Moment Arm (L_ht)"      value={r.htail.momentArm_m} unit="m" />
        <Row label="Volume Coefficient (V_ht)"   value={r.htail.V_ht} />
        <Row label="Incidence Angle"             value="0°" note="Set to 0°; trim via elevator neutral or radio mix" />
        <Row label="Tail Download at Cruise"     value={r.htail.download_N}  unit="N" note="negative lift for pitch trim" />
        <Sub title="Elevator" />
        <Row label="Elevator Chord (30% of tail chord)" value={r.htail.elev_chord_m} unit="m" bold />
        <Row label="Elevator Span  (90% of tail span)"  value={r.htail.elev_span_m}  unit="m" bold />
        <Row label="Elevator Area"               value={r.htail.elev_area_m2} unit="m²" />
        <Row label="Deflection Range"            value="±25° up / ±20° down" />
        <Note text="Up elevator (trailing edge up) pitches nose up. Verify direction before flight." />
      </Section>

      {/* ── VERTICAL TAIL ────────────────────────────────────────────────── */}
      {r.vtail.isVTail ? (
        <Section title="V-Tail (Ruddervator)">
          <Row label="Recommended Airfoil"       value={r.vtail.airfoil} bold />
          <Note text="Symmetric profile; same recommendation applies to both panels." />
          <hr className="my-2 border-gray-100" />
          <Row label="V-Tail Dihedral Angle (each panel)" value={`${r.vtail.vtail_dihedral_deg}°`} bold />
          <Row label="Panel Area (each of 2)"    value={r.vtail.vtail_panel_m2}  unit="m²" bold />
          <Row label="Total V-Tail Area"         value={r.vtail.vtail_total_m2}  unit="m²" />
          <Row label="Tail Moment Arm"           value={r.vtail.momentArm_m}     unit="m" />
          <Note text={`Effective H-tail area = ${r.htail.area_m2} m² (${r.meta.V_ht_target} V_ht). Effective V-tail area = ${r.vtail.area_m2} m² (${r.meta.V_vt_target} V_vt).`} />
          <Sub title="Ruddervator Control Surfaces (one per panel)" />
          <Row label="Surface Chord (35% of panel chord)" value={r.vtail.rud_chord_m}  unit="m" bold />
          <Row label="Surface Height (90% of panel span)" value={r.vtail.rud_height_m} unit="m" bold />
          <Row label="Surface Area (each)"       value={r.vtail.rud_area_m2} unit="m²" />
          <Row label="Deflection Range"          value="±25°" />
          <Note text="Ruddervator mixing: both surfaces deflect same direction for pitch; opposite directions for yaw. Program this mix in your transmitter before flight." type="warn" />
        </Section>
      ) : (
        <Section title="Vertical Tail (Fin)">
          <Row label="Recommended Airfoil"       value={r.vtail.airfoil} bold />
          <Note text="Symmetric profile (zero camber). NACA 0009 preferred for small chord or T-tail." />
          <hr className="my-2 border-gray-100" />
          <Row label="Vertical Tail Area (S_vt)" value={r.vtail.area_m2}     unit="m²" bold />
          <Row label="Fin Height"                value={r.vtail.height_m}    unit="m"  bold />
          <Row label="Fin Chord"                 value={r.vtail.chord_m}     unit="m"  bold />
          <Row label="Fin Aspect Ratio"          value={r.vtail.AR} />
          <Row label="Tail Moment Arm"           value={r.vtail.momentArm_m} unit="m" />
          <Row label="Volume Coefficient (V_vt)" value={r.vtail.V_vt} />
          <Sub title="Rudder" />
          <Row label="Rudder Chord (35% of fin chord)"  value={r.vtail.rud_chord_m}  unit="m" bold />
          <Row label="Rudder Height (90% of fin height)" value={r.vtail.rud_height_m} unit="m" bold />
          <Row label="Rudder Area"               value={r.vtail.rud_area_m2}  unit="m²" />
          <Row label="Deflection Range"          value="±30°" />
          {r.inputs.tailId === 'H_TAIL' && (
            <Note text="H-tail (twin boom): each vertical fin area = S_vt / 2. Build both fins identical." />
          )}
        </Section>
      )}

      {/* ── FUSELAGE SIZING ──────────────────────────────────────────────── */}
      <Section title="Fuselage Sizing">
        <Row label="Total Fuselage Length"      value={r.fuselage.length_m}  unit="m" bold />
        <Row label="Nose to Wing Leading Edge"  value={r.fuselage.nose_arm_m} unit="m" />
        <Row label="Tail Moment Arm (wing AC → tail AC)" value={r.fuselage.tail_arm_m} unit="m" />
        <Row label="Recommended Width"          value={r.fuselage.width_m}   unit="m" />
        <Row label="Recommended Height"         value={r.fuselage.height_m}  unit="m" />
        <Note text="Fuselage cross-section should taper smoothly from max depth at wing to tail. Keep frontal area minimal to reduce CD₀." />
      </Section>

      {/* ── WEIGHT BUDGET ────────────────────────────────────────────────── */}
      <Section title="Weight Budget">
        <Row label="Wing structure"             value={r.weights.m_wing_kg}    unit="kg" />
        <Row label="Horizontal tail"            value={r.weights.m_htail_kg}   unit="kg" />
        <Row label="Vertical tail"              value={r.weights.m_vtail_kg}   unit="kg" />
        <Row label="Fuselage"                   value={r.weights.m_fuse_kg}    unit="kg" />
        <Row label="Electronics (ESC + RX + servos, est.)" value={r.weights.m_elec_kg} unit="kg" />
        <Row label="Motor (estimated)"          value={r.weights.m_motor_kg}   unit="kg" />
        <Row label="Battery (estimated)"        value={r.weights.m_battery_kg} unit="kg" />
        <Row label="Payload"                    value={r.weights.m_payload_kg} unit="kg" />
        <hr className="my-2 border-gray-200" />
        <Row label="Empty Weight"               value={r.weights.m_empty_kg}   unit="kg" bold />
        <Row label="Total Weight (GTOW)"        value={r.weights.m_total_kg}   unit="kg" bold />
        <Row label="Payload Fraction"           value={`${r.weights.payloadFrac_pct}%`} bold />
        <Note text="Motor and battery are estimates — replace with actual component masses for precise sizing. Structural weights assume balsa (0.040 kg/m²) as baseline." />
      </Section>

      {/* ── PROPULSION REQUIREMENTS ──────────────────────────────────────── */}
      <Section title="Propulsion Requirements">
        <Row label="Thrust for Level Flight at Cruise"  value={`${r.propulsion.T_level_N} N  (${r.propulsion.T_level_gf} gf)`} />
        <Row label="Minimum Recommended Motor Thrust"   value={`${r.propulsion.T_min_N} N  (${r.propulsion.T_min_gf} gf)`}  bold />
        <Row label="Target Thrust-to-Weight Ratio"      value={r.propulsion.TWR_target} note="≥ 0.5 for adequate climb" />
        <Row label="Cruise Power Required (est.)"       value={r.propulsion.P_cruise_W} unit="W" note="at 60% total drivetrain efficiency" />
        <Row label="Estimated Rate of Climb"            value={`${r.propulsion.RC_ms} m/s  (${r.propulsion.RC_fpm} fpm)`} />
        <Row label="Propeller Diameter (rough estimate)" value={`${r.propulsion.prop_diam_in}"`} />
        <Note text="Use eCalc or MotoCalc with actual motor KV, voltage, and propeller data for precise motor/prop selection." />
      </Section>

      {/* ── SPAR & STRUCTURE ─────────────────────────────────────────────── */}
      <Section title="Main Spar Design">
        <Row label="Spar Position from Wing LE" value={r.spar.position_m}  unit="m" note="25% chord (aerodynamic center)" bold />
        <Row label="Required Spar Structural Depth" value={r.spar.depth_m} unit="m" note="65% of airfoil thickness at spar station" />
        <Note text="Main spar: pultruded carbon fiber tube or rectangular rod, running full span. Spar should be continuous through fuselage or joined with a proper sleeve/stub." />
        <Note text="Secondary spar (optional): at 65–75% chord for torsional stiffness on high-AR wings." />
        <Note text="Ribs at 150–200 mm spacing. Rib cutouts should maintain 15% minimum material around spar holes." />
      </Section>

      {/* ── MATERIAL RECOMMENDATIONS ─────────────────────────────────────── */}
      <Section title="Material Recommendations">
        <Row label="Primary Recommendation"    value={r.materials.rec.name}   bold />
        <Note text={r.materials.rec.note} />
        <Row label="Alternative"               value={r.materials.alt.name} />
        <Note text={r.materials.alt.note} />

        <Sub title="Weight Comparison Across All Materials (wing + tail surfaces)" />
        <div className="mt-1 overflow-x-auto">
          <table className="text-xs font-mono w-full min-w-max">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400">
                <th className="text-left py-1 pr-4 font-normal w-48">Material</th>
                <th className="text-right py-1 pr-4 font-normal">Wing</th>
                <th className="text-right py-1 pr-4 font-normal">Tail</th>
                <th className="text-right py-1 pr-4 font-normal">Structural</th>
                <th className="text-right py-1 font-normal">GTOW (est.)</th>
              </tr>
            </thead>
            <tbody>
              {r.materials.comparison.map(m => (
                <tr
                  key={m.id}
                  className={m.id === r.materials.rec.id ? 'font-bold text-blue-700' : 'text-gray-700'}
                >
                  <td className="py-0.5 pr-4">
                    {m.name}
                    {m.id === r.materials.rec.id && ' ✓'}
                  </td>
                  <td className="text-right pr-4">{m.mWing} kg</td>
                  <td className="text-right pr-4">{m.mTail} kg</td>
                  <td className="text-right pr-4">{m.mStruct} kg</td>
                  <td className="text-right">{m.mGTOW} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note text="GTOW estimate holds motor, battery, electronics, and fuselage constant. Actual GTOW will shift slightly as wing sizing converges with chosen material." />
      </Section>

      {/* ── DESIGN CHECKLIST ─────────────────────────────────────────────── */}
      <Section title="Pre-Build Design Checklist">
        {[
          'Balance aircraft to recommended CG before first flight. Adjust battery position.',
          'Verify all control surface directions on bench before arming motor.',
          'Apply 2–3° washout to wing tips (if using S1223 or E214 — essential for stall safety).',
          'Reinforce wing root with fiberglass tape or plywood gusset — highest bending stress.',
          `Add carbon fiber spar at ${r.spar.position_m} m from wing LE, running full span.`,
          'Test elevon/ruddervator mixing (if V-tail) with transmitter before any taxi or flight.',
          'Perform weight and balance check with actual payload installed.',
          'Do a hand-glide test at walking speed to confirm pitch stability before full-power flight.',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="text-gray-300 text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <p className="text-sm text-gray-700">{item}</p>
          </div>
        ))}
      </Section>

      <p className="text-xs text-gray-400 mt-4 mb-8 border-t border-gray-100 pt-3">
        Computed at stall target {r.meta.V_stall_target} m/s · AR {r.meta.AR_target} ·
        V_ht target {r.meta.V_ht_target} · V_vt target {r.meta.V_vt_target} ·
        Static margin target {r.meta.SM_target_pct}% MAC · Max wingspan {r.meta.maxWingspan} m
      </p>
    </div>
  );
}
