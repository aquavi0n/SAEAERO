import { useState } from 'react';

// ── Tooltip ────────────────────────────────────────────────────────────────
// Hover the ℹ icon to see a plain-English explanation of the term.
function Tip({ text }) {
  return (
    <span className="relative inline-block group ml-1.5 align-middle cursor-help">
      <span className="text-gray-600 group-hover:text-gray-400 text-[10px] border border-gray-700 group-hover:border-gray-500 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center transition-colors select-none font-bold leading-none">
        i
      </span>
      {/* tooltip box — appears to the right of the icon */}
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-56 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2.5 opacity-0 group-hover:opacity-100 z-50 leading-relaxed shadow-2xl transition-opacity whitespace-normal">
        {text}
      </span>
    </span>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
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

// ── Data row ───────────────────────────────────────────────────────────────
// info = plain-English tooltip text shown on ℹ hover
function Row({ label, value, unit = '', info = '', bold = false }) {
  return (
    <div className={`flex items-baseline py-0.5 gap-3 ${bold ? 'text-gray-100' : 'text-gray-300'}`}>
      <span className={`text-sm shrink-0 w-72 flex items-center ${bold ? 'font-semibold text-gray-200' : 'text-gray-400'}`}>
        {label}
        {info && <Tip text={info} />}
      </span>
      <span className="text-sm font-mono">
        {String(value)}
        {unit && <span className="text-gray-600 text-xs ml-1">{unit}</span>}
      </span>
    </div>
  );
}

// ── Plain note ─────────────────────────────────────────────────────────────
function Note({ text }) {
  return <p className="text-xs text-gray-600 mt-1 leading-snug">ℹ {text}</p>;
}

// ── Sub-section label ──────────────────────────────────────────────────────
function Sub({ title }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">{title}</p>;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ResultsDisplay({ results: r, onBack }) {
  const [showVerification, setShowVerification] = useState(false);

  const groups = r.steps.reduce((acc, step) => {
    if (!acc[step.group]) acc[step.group] = [];
    acc[step.group].push(step);
    return acc;
  }, {});

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Aircraft Design Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.inputs.airfoilName} &middot; {r.inputs.wingConfigName} &middot; {r.inputs.tailTypeName} &middot; {r.inputs.payloadKg} kg payload
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.print()}
            className="text-sm border border-gray-700 px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors">
            Print
          </button>
          <button onClick={onBack}
            className="text-sm border border-gray-700 px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors">
            ← Back
          </button>
        </div>
      </div>

      {/* ── TLDR (replaces confusing notices) ──────────────────────────── */}
      <div className="mb-6 p-4 bg-blue-950/40 border border-blue-900/50 rounded-lg">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1.5">Summary</p>
        <p className="text-sm text-gray-300 leading-relaxed">{r.tldr}</p>
      </div>

      {/* ── QUICK SUMMARY ──────────────────────────────────────────────── */}
      <Section title="Quick Summary">
        <div className="grid grid-cols-2 gap-x-8">
          <Row label="Wingspan" value={`${r.summary.wingspan_m} m`} bold
            info="How wide the wing is from tip to tip." />
          <Row label="Wing Area" value={`${r.summary.wingArea_m2} m²`} bold
            info="The total flat surface area of the wing." />
          <Row label="Mean Aerodynamic Chord" value={`${r.summary.chord_m} m`} bold
            info="The average front-to-back width (depth) of the wing." />
          <Row label="Aspect Ratio" value={r.summary.AR} bold
            info="How long and skinny the wing is. Higher = more glider-like and efficient. 7 is a solid middle ground for SAE." />
          <Row label="Stall Speed" value={`${r.summary.V_stall_ms} m/s`} bold
            info="The slowest the plane can fly before the wing stops making lift and it falls. Never fly slower than this." />
          <Row label="Cruise Speed" value={`${r.summary.V_cruise_ms} m/s`} bold
            info="The most efficient flying speed — you get the most range and endurance here." />
          <Row label="Total Weight (GTOW)" value={`${r.summary.m_total_kg} kg`} bold
            info="Gross Take-Off Weight — everything combined: airframe, motor, battery, and payload." />
          <Row label="Max L/D" value={r.summary.LD_max} bold
            info="Lift-to-drag ratio. For every meter the plane drops in a glide, it travels this many meters forward. Higher = more efficient wing." />
          <Row label="Recommended CG" value={`${r.summary.CG_pctMAC}% MAC`} bold
            info="Where to balance the plane. Measured from the front edge of the wing as a percentage of the chord. Balance it here for safe, stable flight." />
          <Row label="Min Motor Thrust" value={`${r.summary.T_min_gf} gf`} bold
            info="The minimum push your motor needs to produce to fly AND climb. If your motor can't do this, the plane won't take off properly." />
        </div>
      </Section>

      {/* ── WING GEOMETRY ──────────────────────────────────────────────── */}
      <Section title="Wing Geometry &amp; Sizing">
        <Row label="Wing Area (S)" value={r.wing.area_m2} unit="m²"
          info="Total flat surface of the wing. Bigger wing = more lift but also more weight and drag." />
        <Row label="Wingspan (b)" value={`${r.wing.span_m} m  [limit: ${r.meta.maxWingspan} m]`} bold
          info="Tip-to-tip width. The 10 m competition limit is applied here." />
        <Row label="Mean Aerodynamic Chord (MAC)" value={r.wing.chord_m} unit="m" bold
          info="Average front-to-back depth of the wing. Most stability calculations use this as the reference length." />
        <Row label="Aspect Ratio (AR)" value={r.wing.AR} bold
          info="Wingspan squared divided by wing area. High AR = efficient and glider-like. 7 is a good SAE compromise." />
        <Row label="Taper Ratio" value={r.wing.taperRatio}
          info="How much the wing narrows from root to tip. 1.0 means it stays the same width all the way — easiest to build." />
        <Row label="Wing Loading" value={`${r.wing.WL_Nm2} N/m²  (${r.wing.WL_kgm2} kg/m²)`}
          info="Weight carried per square meter of wing. Higher loading = faster stall speed. Lower = slower and floatier." />
        <Row label="Airfoil Thickness (t/c)" value={`${r.wing.thicknessPct}%`}
          info="How fat the wing cross-section is compared to its width. Thicker = stronger internal structure, but slightly more drag." />
        <Row label="Airfoil Camber" value={`${r.wing.camberPct}%`}
          info="How curved the top surface of the wing is. More camber = more lift at slow speeds, but more drag too." />
        <Row label="CL_max (airfoil)" value={r.wing.CL_max}
          info="The maximum lift coefficient the airfoil can produce on its own, from the airfoil data." />
        {r.wingConfig.id !== 'MONOPLANE' && (
          <Row label="CL_max (effective, with interference)" value={r.wing.CL_max_eff}
            info="For biplanes and sesquiplanes, the wings interfere with each other and can't each produce full lift. This is the corrected effective CL_max used in all calculations." />
        )}
        <hr className="my-2 border-gray-800" />
        <Row label="Incidence Angle (root)" value={`${r.wing.incidence_deg}°`}
          info="The angle the wing is tilted relative to the fuselage. A few degrees lets the fuselage fly level while the wing is at the right angle to produce lift." />
        <Row label="Geometric Washout (tip)" value={`−${r.wing.washout_deg}°`}
          info="Twisting the wingtip to a lower angle than the root. This makes the root stall before the tip, giving you a warning before the whole wing gives out." />
        <Row label="Dihedral" value={`${r.wing.dihedral_deg}°`}
          info="Tilting the wingtips upward like a shallow V. If the plane rolls sideways, dihedral naturally rolls it back to level." />
        <Note text={r.wing.dihedralNote} />

        {/* Wing configuration badge */}
        <hr className="my-3 border-gray-800" />
        <Row label="Wing Configuration" value={r.wingConfig.name} bold
          info="The planform type selected. Affects lift, drag, and structural weight of the wing." />
        <Note text={r.wingConfig.note} />

        {/* Biplane panel details */}
        {r.wingPanels.type === 'BIPLANE' && (
          <>
            <Sub title="Upper Wing" />
            <Row label="Span" value={r.wingPanels.upper_span_m} unit="m"
              info="Tip-to-tip span of the upper wing. Equal to the full wingspan." />
            <Row label="Chord" value={r.wingPanels.upper_chord_m} unit="m"
              info="Front-to-back depth of the upper wing panel." />
            <Row label="Area" value={r.wingPanels.upper_area_m2} unit="m²"
              info="Surface area of the upper wing. Half of total wing area." />
            <Sub title="Lower Wing" />
            <Row label="Span" value={r.wingPanels.lower_span_m} unit="m"
              info="Tip-to-tip span of the lower wing. Same as upper for a symmetric biplane." />
            <Row label="Chord" value={r.wingPanels.lower_chord_m} unit="m"
              info="Front-to-back depth of the lower wing. Same chord as upper." />
            <Row label="Area" value={r.wingPanels.lower_area_m2} unit="m²"
              info="Surface area of the lower wing. Half of total wing area." />
            <Sub title="Biplane Geometry" />
            <Row label="Gap between wings" value={r.wingPanels.gap_m} unit="m"
              info="Vertical distance between upper and lower wings. Equal to the chord length (gap/chord = 1.0) — the standard proportion for good performance." />
            <Row label="Gap / Chord ratio" value={r.wingPanels.gapChordRatio}
              info="How the gap compares to the wing chord. 1.0 is the standard biplane design ratio. Higher gap reduces wing interference." />
            <Row label="Strut spacing (from root)" value={r.wingPanels.strutSpacing_m} unit="m"
              info="Where to place the interplane struts connecting upper and lower wings. Struts at 1/3 and 2/3 span balance structural loads evenly." />
            <Note text="Drag penalty factor: ×1.10 on CD₀ for struts and interference. Structural weight factor: ×1.30 on wing mass." />
          </>
        )}

        {/* Sesquiplane panel details */}
        {r.wingPanels.type === 'SESQUIPLANE' && (
          <>
            <Sub title="Upper Wing (full span)" />
            <Row label="Span" value={r.wingPanels.upper_span_m} unit="m"
              info="Tip-to-tip span of the upper wing — the full wingspan." />
            <Row label="Chord" value={r.wingPanels.upper_chord_m} unit="m"
              info="Front-to-back depth of the upper wing." />
            <Row label="Area" value={r.wingPanels.upper_area_m2} unit="m²"
              info="Surface area of the upper wing (~62.5% of total)." />
            <Sub title="Lower Wing (60% span)" />
            <Row label="Span" value={r.wingPanels.lower_span_m} unit="m"
              info="Tip-to-tip span of the lower wing — 60% of the full wingspan." />
            <Row label="Chord" value={r.wingPanels.lower_chord_m} unit="m"
              info="Same chord as the upper wing — both panels have identical depth." />
            <Row label="Area" value={r.wingPanels.lower_area_m2} unit="m²"
              info="Surface area of the lower wing (~37.5% of total)." />
            <Sub title="Interplane Geometry" />
            <Row label="Gap between wings" value={r.wingPanels.gap_m} unit="m"
              info="Vertical distance between upper and lower wing surfaces." />
            <Row label="Gap / Chord ratio" value={r.wingPanels.gapChordRatio}
              info="How the gap compares to the wing chord. 1.0 is the standard proportion." />
            <Row label="Strut position (from root)" value={r.wingPanels.strutSpacing_m} unit="m"
              info="Where to place the single interplane strut connecting the two wings — at the midspan of the lower wing." />
            <Note text="Drag penalty factor: ×1.06 on CD₀. Structural weight factor: ×1.18 on wing mass. Better payload fraction than biplane." />
          </>
        )}
      </Section>

      {/* ── AILERONS ───────────────────────────────────────────────────── */}
      <Section title="Ailerons">
        <Row label="Location (from root)" value={`${r.ailerons.inboard_m} m → ${r.ailerons.halfspan_m} m (tip)`}
          info="Where the ailerons start and end. They go on the outer part of the wing — further from center means more roll leverage." />
        <Row label="Span per side" value={r.ailerons.span_each_m} unit="m" bold
          info="Length of each aileron. One on each wing." />
        <Row label="Chord (22% of wing chord)" value={r.ailerons.chord_m} unit="m" bold
          info="How wide (front to back) each aileron is. 22% of the wing chord is the standard proportion." />
        <Row label="Area per side" value={r.ailerons.area_each_m2} unit="m²"
          info="Surface area of one aileron." />
        <Row label="Total Aileron Area" value={r.ailerons.area_total_m2} unit="m²"
          info="Both ailerons combined. Larger area = stronger roll control." />
        <Row label="Deflection Range" value={r.ailerons.deflect}
          info="How far the ailerons move up and down. ±20° is enough for good roll control without stalling the aileron itself." />
        <Note text="Outer 35% of each half-span. Use differential throws (more up than down) to reduce unwanted yaw when rolling." />
      </Section>

      {/* ── AERODYNAMIC PERFORMANCE ────────────────────────────────────── */}
      <Section title="Aerodynamic Performance">
        <Row label="Stall Speed (V_s)" value={r.aero.V_stall_ms} unit="m/s" bold
          info="Minimum safe flying speed. Below this the wing produces so little lift that the plane drops. This is the most important number to respect." />
        <Row label="Best L/D Speed" value={r.aero.V_bestLD_ms} unit="m/s" bold
          info="The speed where you get the most lift for the least drag — the sweet spot. Fly here for maximum range and endurance." />
        <Row label="Recommended Cruise Speed" value={r.aero.V_cruise_ms} unit="m/s"
          info="Same as best L/D speed. This is your go-to flying speed." />
        <hr className="my-2 border-gray-800" />
        <Row label="CL at Stall" value={r.aero.CL_max}
          info="How hard the wing is working right at the edge of stalling. This is the maximum lift the airfoil can produce." />
        <Row label="CL at Best L/D" value={r.aero.CL_LD}
          info="How hard the wing works at the most efficient speed. Less than max — so there's still headroom before stalling." />
        <Row label="CL at Cruise" value={r.aero.CL_cruise}
          info="How hard the wing works during normal flight." />
        <hr className="my-2 border-gray-800" />
        <Row label="Parasite Drag (CD₀ baseline)" value={r.aero.CD0}
          info="Baseline drag from pushing the aircraft through air — fuselage, landing gear, and surface friction. Before any multi-plane penalty is applied." />
        {r.wingConfig.id !== 'MONOPLANE' && (
          <Row label="Effective Parasite Drag (CD₀ with penalty)" value={r.aero.CD0_eff}
            info="CD₀ after applying the biplane/sesquiplane drag penalty for extra struts and wing interference. This is what's used in all performance calculations." />
        )}
        <Row label="Induced Drag (CDᵢ) at Cruise" value={r.aero.CDi_cruise}
          info="Extra drag created as a side-effect of generating lift. Unavoidable — lift always comes with a small drag penalty." />
        <Row label="Total Drag (CD) at Cruise" value={r.aero.CD_cruise}
          info="Total drag coefficient = parasitic drag + lift-induced drag combined." />
        <Row label="Drag Force at Cruise" value={r.aero.D_cruise_N} unit="N"
          info="The actual force (in Newtons) of air resistance pushing back on the plane at cruise speed." />
        <Row label="Oswald Efficiency Factor" value={r.aero.oswaldE}
          info="How close the wing is to a perfect theoretical wing. 1.0 is ideal; 0.8 is realistic for a well-built SAE aircraft." />
        <hr className="my-2 border-gray-800" />
        <Row label="L/D at Cruise" value={r.aero.LD_cruise}
          info="Lift-to-drag ratio at cruise. For every Newton of drag, the wing produces this many Newtons of lift." />
        <Row label="Max L/D" value={r.aero.LD_max} bold
          info="Best possible lift-to-drag ratio. Think of it as the glide ratio — meters forward per meter dropped." />
        <Row label="Glide Ratio" value={r.aero.glideRatio}
          info="Same as max L/D. If the engine cut out, the plane glides this many meters forward for each meter of altitude lost." />
        <Row label="Glide Distance from 100 m alt" value={r.aero.glideDist_100m} unit="m"
          info="If you cut the engine at 100 m altitude with perfect technique, the plane would travel this far before landing." />
        <hr className="my-2 border-gray-800" />
        <Row label="Reynolds Number — Stall" value={r.aero.Re_stall.toLocaleString()}
          info="A number that describes how air flows over the wing at stall speed. Below 70,000 is problematic — the airfoil behaves unpredictably. Above 100,000 is reliable." />
        <Row label="Reynolds Number — Cruise" value={r.aero.Re_cruise.toLocaleString()}
          info="Same but at cruise speed. Higher is always better — more predictable airfoil performance." />
        <Note text="Below Re 100,000 is the 'low Reynolds' regime. Airfoil selection is critical here — standard NACA airfoils underperform." />
      </Section>

      {/* ── STABILITY & CONTROL ────────────────────────────────────────── */}
      <Section title="Stability &amp; Control">
        <Row label="H-Tail Volume Coefficient (V_ht)" value={r.stability.V_ht} bold
          info={`A score for how much pitch control your horizontal tail provides. Think of it as 'pitch authority.' Our target is ${r.meta.V_ht_target} — higher is more stable.`} />
        <Row label="V-Tail Volume Coefficient (V_vt)" value={r.stability.V_vt} bold
          info={`Same idea but for left/right (yaw) stability. Target is ${r.meta.V_vt_target}. Too low and the plane will wander in yaw.`} />
        <Row label="Downwash Gradient (dε/dα)" value={r.stability.dEps_dAlpha}
          info="The wing pushes air downward behind it, which reduces how effectively the tail works. This number accounts for that effect in the stability calculation." />
        <hr className="my-2 border-gray-800" />
        <Row label="Neutral Point" value={`${r.stability.NP_pctMAC}% MAC`} bold
          info="The aerodynamic balance point of the aircraft. Your CG (balance point) MUST be ahead of this or the plane will be uncontrollable." />
        <Row label="Recommended CG Location" value={`${r.stability.CG_pctMAC}% MAC  (${r.stability.CG_from_LE_m} m from wing LE)`} bold
          info="Where to physically balance the plane. Measure from the very front edge of the wing. Shift battery forward or backward to hit this target." />
        <Row label="Static Margin" value={`${r.stability.SM_pct}%`}
          info={`How far ahead of the neutral point your CG sits, as % of chord. ${r.meta.SM_target_pct}% gives safe stability without being too sluggish. Less than 5% = risky. More than 20% = very stable but hard to pitch up.`} />
        <Row label="Pitch Stability" value={r.stability.status}
          info="Whether the plane naturally recovers from pitch disturbances on its own. STABLE = yes. MARGINAL = barely. UNSTABLE = no — do not fly." />
        <Note text="Always verify CG by balancing the actual built aircraft with payload installed before flying." />
      </Section>

      {/* ── HORIZONTAL TAIL ────────────────────────────────────────────── */}
      <Section title="Horizontal Tail">
        <Row label="Recommended Airfoil" value={r.htail.airfoil} bold
          info="Tail surfaces always use symmetric airfoils (equal top and bottom). This lets them push equally up or down to control pitch." />
        <Note text={r.tailAirfoilReason} />
        <hr className="my-2 border-gray-800" />
        <Row label="Area (S_ht)" value={r.htail.area_m2} unit="m²" bold
          info="Total surface area of the horizontal tail. Sized so it has enough authority to control pitch." />
        <Row label="Span" value={r.htail.span_m} unit="m" bold
          info="Tip-to-tip width of the horizontal tail." />
        <Row label="Chord" value={r.htail.chord_m} unit="m" bold
          info="Front-to-back depth of the horizontal tail." />
        <Row label="Aspect Ratio" value={r.htail.AR}
          info="How long and thin the horizontal tail is. 4 is typical — thinner than the main wing." />
        <Row label="Tail Moment Arm (L_ht)" value={r.htail.momentArm_m} unit="m"
          info="Distance from the wing to the tail. Longer arm = smaller tail needed for same stability. It's like a longer lever." />
        <Row label="Volume Coefficient (V_ht)" value={r.htail.V_ht}
          info="Confirms the tail is correctly sized for pitch stability. This should match the target of 0.45." />
        <Row label="Incidence Angle" value="0°"
          info="The tail is set flat (zero angle). It makes no lift in level flight — only moves when the elevator is deflected." />
        <Row label="Tail Download at Cruise" value={r.htail.download_N} unit="N"
          info="The tail pushes down slightly to counteract the nose-down pitching tendency of the wing. This is normal and expected — it's how stable aircraft are designed." />
        <Sub title="Elevator" />
        <Row label="Elevator Chord (30% of tail chord)" value={r.htail.elev_chord_m} unit="m" bold
          info="The movable rear portion of the horizontal tail that the pilot uses to pitch the nose up or down. This is its front-to-back size." />
        <Row label="Elevator Span (90% of tail span)" value={r.htail.elev_span_m} unit="m" bold
          info="How wide the elevator runs. Leaves a small gap at each tip for the hinge structure." />
        <Row label="Elevator Area" value={r.htail.elev_area_m2} unit="m²"
          info="Total surface area of the elevator." />
        <Row label="Deflection Range" value="±25° up / ±20° down"
          info="How far the elevator can move. More deflection up (pitch up) than down is typical — you need more authority to rotate at takeoff." />
      </Section>

      {/* ── VERTICAL TAIL ──────────────────────────────────────────────── */}
      {r.vtail.isVTail ? (
        <Section title="V-Tail (Ruddervator)">
          <Row label="Recommended Airfoil" value={r.vtail.airfoil} bold
            info="Symmetric profile — same on both sides. Works equally in both left and right directions." />
          <hr className="my-2 border-gray-800" />
          <Row label="Dihedral Angle (each panel)" value={`${r.vtail.vtail_dihedral_deg}°`} bold
            info="The angle each V-tail panel is tilted up from flat. This exact angle is calculated so each panel provides both pitch AND yaw control at the same time." />
          <Row label="Panel Area (each of 2)" value={r.vtail.vtail_panel_m2} unit="m²" bold
            info="Area of one V-tail panel. Both panels together replace the separate horizontal and vertical tails." />
          <Row label="Total V-Tail Area" value={r.vtail.vtail_total_m2} unit="m²"
            info="Combined area of both V-tail panels." />
          <Row label="Moment Arm" value={r.vtail.momentArm_m} unit="m"
            info="Distance from wing to V-tail." />
          <Note text={`Effective horizontal tail = ${r.htail.area_m2} m². Effective vertical tail = ${r.vtail.area_m2} m².`} />
          <Sub title="Ruddervator (one per panel)" />
          <Row label="Surface Chord (35% of panel chord)" value={r.vtail.rud_chord_m} unit="m" bold
            info="The movable surface on each V-tail panel. Moving both the same way = pitch control. Moving them opposite = yaw control." />
          <Row label="Surface Height (90% of panel span)" value={r.vtail.rud_height_m} unit="m" bold
            info="How tall each ruddervator is." />
          <Row label="Surface Area (each)" value={r.vtail.rud_area_m2} unit="m²"
            info="Area of one ruddervator." />
          <Row label="Deflection Range" value="±25°"
            info="How far each ruddervator can move." />
          <Note text="Program ruddervator mixing in your transmitter before flying: both surfaces same direction = pitch, opposite directions = yaw." />
        </Section>
      ) : (
        <Section title="Vertical Tail (Fin)">
          <Row label="Recommended Airfoil" value={r.vtail.airfoil} bold
            info="Symmetric profile — zero camber so the fin works equally in both left and right directions." />
          <hr className="my-2 border-gray-800" />
          <Row label="Area (S_vt)" value={r.vtail.area_m2} unit="m²" bold
            info="Total surface area of the vertical fin. Sized to keep the plane pointed straight (yaw stability)." />
          <Row label="Fin Height" value={r.vtail.height_m} unit="m" bold
            info="How tall the vertical fin is." />
          <Row label="Fin Chord" value={r.vtail.chord_m} unit="m" bold
            info="Front-to-back depth of the fin." />
          <Row label="Aspect Ratio" value={r.vtail.AR}
            info="How tall vs wide the fin is. 1.5 is typical for a compact fin." />
          <Row label="Moment Arm" value={r.vtail.momentArm_m} unit="m"
            info="Distance from the wing to the fin. Longer = smaller fin needed for same yaw stability." />
          <Row label="Volume Coefficient (V_vt)" value={r.vtail.V_vt}
            info="Confirms the fin is correctly sized for yaw stability. Should match the 0.04 target." />
          <Sub title="Rudder" />
          <Row label="Rudder Chord (35% of fin chord)" value={r.vtail.rud_chord_m} unit="m" bold
            info="The movable rear part of the fin. Controls left/right yaw — pointing the nose left or right." />
          <Row label="Rudder Height (90% of fin)" value={r.vtail.rud_height_m} unit="m" bold
            info="How tall the rudder is. Leaves a small gap at top and bottom for hinge structure." />
          <Row label="Rudder Area" value={r.vtail.rud_area_m2} unit="m²"
            info="Total surface area of the rudder." />
          <Row label="Deflection Range" value="±30°"
            info="How far the rudder can swing. ±30° gives good directional control." />
          {r.inputs.tailId === 'H_TAIL' && (
            <Note text="H-tail uses two identical vertical fins (twin boom). Build both the same — each fin's area = S_vt ÷ 2." />
          )}
        </Section>
      )}

      {/* ── FUSELAGE ───────────────────────────────────────────────────── */}
      <Section title="Fuselage Sizing">
        <Row label="Total Length" value={r.fuselage.length_m} unit="m" bold
          info="Nose-to-tail length of the fuselage." />
        <Row label="Nose to Wing Leading Edge" value={r.fuselage.nose_arm_m} unit="m"
          info="How far the nose (and motor) sticks out in front of the wing. This affects CG — a longer nose moves weight forward." />
        <Row label="Tail Moment Arm" value={r.fuselage.tail_arm_m} unit="m"
          info="Distance from the wing to the tail — the longer this is, the smaller the tail needs to be." />
        <Row label="Width (recommended)" value={r.fuselage.width_m} unit="m"
          info="How wide to make the fuselage. Wide enough for the payload, narrow enough to reduce drag." />
        <Row label="Height (recommended)" value={r.fuselage.height_m} unit="m"
          info="How tall the fuselage cross-section should be. Slightly taller than wide is aerodynamically better." />
      </Section>

      {/* ── WEIGHT BUDGET ──────────────────────────────────────────────── */}
      <Section title="Weight Budget">
        <Row label="Wing structure" value={r.weights.m_wing_kg} unit="kg"
          info="Estimated wing mass — skin, ribs, and spar — using balsa as the baseline material." />
        <Row label="Horizontal tail" value={r.weights.m_htail_kg} unit="kg"
          info="Estimated horizontal tail mass." />
        <Row label="Vertical tail" value={r.weights.m_vtail_kg} unit="kg"
          info="Estimated vertical fin mass." />
        <Row label="Fuselage" value={r.weights.m_fuse_kg} unit="kg"
          info="Estimated fuselage mass. Scales with wingspan — longer span needs a longer, slightly heavier fuselage." />
        <Row label="Electronics (est.)" value={r.weights.m_elec_kg} unit="kg"
          info="Estimated combined mass of ESC (speed controller), receiver, and servos. Replace with your actual parts." />
        <Row label="Motor (est.)" value={r.weights.m_motor_kg} unit="kg"
          info="Estimated motor mass. Replace with your actual motor's spec sheet value." />
        <Row label="Battery (est.)" value={r.weights.m_battery_kg} unit="kg"
          info="Estimated LiPo battery mass. Replace with your actual battery weight." />
        <Row label="Payload" value={r.weights.m_payload_kg} unit="kg"
          info="The cargo you entered. This is what the whole aircraft is sized around." />
        <hr className="my-2 border-gray-700" />
        <Row label="Empty Weight" value={r.weights.m_empty_kg} unit="kg" bold
          info="Everything except the payload — the bare aircraft ready to fly." />
        <Row label="GTOW" value={r.weights.m_total_kg} unit="kg" bold
          info="Gross Take-Off Weight. Everything. This is the number used in all calculations." />
        <Row label="Payload Fraction" value={`${r.weights.payloadFrac_pct}%`} bold
          info="What percentage of total weight is actually payload. Higher = more efficient aircraft. 30–50% is typical for SAE." />
        <Note text="Motor and battery are estimates. Update with your actual component masses for precise results." />
      </Section>

      {/* ── PROPULSION ─────────────────────────────────────────────────── */}
      <Section title="Propulsion Requirements">
        <Row label="Thrust for Level Flight" value={`${r.propulsion.T_level_N} N  (${r.propulsion.T_level_gf} gf)`}
          info="The minimum motor push needed to maintain straight-and-level flight at cruise speed. Any less and the plane slows down." />
        <Row label="Min Recommended Motor Thrust" value={`${r.propulsion.T_min_N} N  (${r.propulsion.T_min_gf} gf)`} bold
          info="Recommended motor thrust including margin to climb, handle gusts, and maneuver. Your motor's max static thrust should be at least this." />
        <Row label="Target Thrust-to-Weight Ratio" value={r.propulsion.TWR_target}
          info="Motor thrust divided by aircraft weight. 0.5 means the motor pushes with half the plane's weight. Higher = better climb. 0.5 is the minimum for SAE." />
        <Row label="Cruise Power Required" value={r.propulsion.P_cruise_W} unit="W"
          info="Estimated electrical power the motor uses at cruise speed. Divide battery Wh by this to estimate flight time in hours." />
        <Row label="Estimated Rate of Climb" value={`${r.propulsion.RC_ms} m/s  (${r.propulsion.RC_fpm} fpm)`}
          info="How fast the plane climbs with the recommended motor thrust. fpm = feet per minute (common aviation unit)." />
        <Row label="Propeller Diameter (est.)" value={`${r.propulsion.prop_diam_in}"`}
          info="Suggested propeller size in inches. Bigger prop = more efficient but watch for ground clearance. Match to your specific motor's KV rating and battery voltage." />
        <Note text="Use eCalc or MotoCalc with your actual motor KV, voltage, and prop to fine-tune selection." />
      </Section>

      {/* ── SPAR ───────────────────────────────────────────────────────── */}
      <Section title="Main Spar Design">
        <Row label="Spar Position from Wing LE" value={r.spar.position_m} unit="m" bold
          info="Where to put the main structural beam, measured from the front edge of the wing. 25% of the chord is the aerodynamic center — the best structural location too." />
        <Row label="Required Structural Depth" value={r.spar.depth_m} unit="m"
          info="How thick the spar needs to be to resist bending. Must span at least this height within the wing cross-section." />
        <Note text="Use a pultruded carbon fiber tube or rectangular rod, running the full wingspan. Ribs every 150–200 mm." />
      </Section>

      {/* ── MATERIALS ──────────────────────────────────────────────────── */}
      <Section title="Material Recommendations">
        <Row label="Primary Recommendation" value={r.materials.rec.name} bold
          info="The best material for this aircraft's size and payload based on span, area, and structural requirements." />
        <Note text={r.materials.rec.note} />
        <Row label="Alternative" value={r.materials.alt.name}
          info="Second choice if the primary is unavailable or over budget." />
        <Note text={r.materials.alt.note} />

        <Sub title="Weight comparison (wing + tail surfaces)" />
        <div className="overflow-x-auto mt-1">
          <table className="text-xs font-mono w-full min-w-max">
            <thead>
              <tr className="border-b border-gray-800 text-gray-600">
                <th className="text-left py-1 pr-4 font-normal w-44">Material</th>
                <th className="text-right py-1 pr-3 font-normal">Wing</th>
                <th className="text-right py-1 pr-3 font-normal">Tail</th>
                <th className="text-right py-1 pr-3 font-normal">Structural</th>
                <th className="text-right py-1 font-normal">GTOW</th>
              </tr>
            </thead>
            <tbody>
              {r.materials.comparison.map(m => (
                <tr key={m.id} className={m.id === r.materials.rec.id ? 'font-bold text-blue-400' : 'text-gray-500'}>
                  <td className="py-0.5 pr-4">{m.name}{m.id === r.materials.rec.id && ' ✓'}</td>
                  <td className="text-right pr-3">{m.mWing} kg</td>
                  <td className="text-right pr-3">{m.mTail} kg</td>
                  <td className="text-right pr-3">{m.mStruct} kg</td>
                  <td className="text-right">{m.mGTOW} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mt-1">Wing = wing skin+ribs · Tail = H-tail+V-tail · GTOW = total aircraft weight with that material</p>
        </div>
      </Section>

      {/* ── DESIGN CHECKLIST ───────────────────────────────────────────── */}
      <Section title="Pre-Build Checklist">
        {[
          'Balance aircraft to recommended CG before first flight. Shift battery position to hit it.',
          'Verify all control surface directions on the bench before arming the motor.',
          `Twist wingtips ${r.wing.washout_deg}° trailing-edge up (washout) — especially important with high-lift airfoils.`,
          'Reinforce the wing root joint with fiberglass tape — this is where the highest bending force is.',
          `Install carbon fiber spar at ${r.spar.position_m} m from the wing leading edge, full span.`,
          'If V-tail: test ruddervator mix in transmitter before any flight.',
          'Weigh every component. Recalculate CG with actual masses and payload installed.',
          'Do a hand-glide test at walking speed before any full-power flight.',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="text-gray-700 text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <p className="text-sm text-gray-400">{item}</p>
          </div>
        ))}
      </Section>

      {/* ── VERIFICATION TOGGLE ────────────────────────────────────────── */}
      <div className="mt-6 mb-2">
        <button
          onClick={() => setShowVerification(v => !v)}
          className="w-full py-2.5 rounded border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {showVerification ? '▲ Hide Calculation Steps' : '▼ Show Calculation Steps'}
        </button>
      </div>

      {/* ── VERIFICATION PANEL ─────────────────────────────────────────── */}
      {showVerification && (
        <div className="mt-4 mb-10 border border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-bold text-white">Calculation Verification</h2>
            <p className="text-xs text-gray-500 mt-0.5">Every major formula with substituted values and results.</p>
          </div>

          {Object.entries(groups).map(([groupName, steps]) => (
            <div key={groupName}>
              <div className="bg-gray-900/60 px-4 py-2 border-b border-gray-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{groupName}</p>
              </div>
              {steps.map((step, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-800/60 font-mono text-xs hover:bg-gray-900/40">
                  <p className="text-gray-200 font-semibold mb-1 font-sans text-xs">{step.name}</p>
                  <div className="grid grid-cols-[60px_1fr] gap-x-3 gap-y-0.5">
                    <span className="text-gray-600">Formula</span>
                    <span className="text-blue-300">{step.formula}</span>
                    <span className="text-gray-600">Values</span>
                    <span className="text-gray-400">{step.calc}</span>
                    <span className="text-gray-600">Result</span>
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
