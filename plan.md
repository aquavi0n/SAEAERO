# SAE Aero Design Optimizer — Build Plan (v2)

## Goal
Find the best possible aircraft configuration that lifts the maximum payload
weight as efficiently as possible, given real constraints: motor thrust,
material weight, wing geometry, and tail sizing. Every knob the team can turn
should have a number behind it.

## Stack
- React (Vite)
- Tailwind CSS
- Recharts for graphs
- No backend — all logic is pure client-side math

---

## What the tool answers

| Question | Output |
|---|---|
| How much can we lift? | Max payload (kg) given motor + wing |
| How efficient is this design? | Payload fraction %, L/D ratio, efficiency score |
| Will it fly? | Stability status, stall speed, thrust margin |
| How big does everything need to be? | Wing area, fuselage length, tail sizes |
| What material should we use? | Weight per m², structural efficiency |
| Biplane or monoplane? | Side-by-side comparison of both |
| How much power do we have? | Motor + prop + battery → static thrust |

---

## Project Structure

```
src/
  data/
    airfoils.js          ✓ done
    tailConfigs.js        ✓ done
    materials.js          NEW — foam/balsa/carbon/ply density + structural ratings
    motors.js             NEW — common SAE Aero motors, KV, max current, weight
    wingConfigs.js        NEW — monoplane, biplane, sesquiplane configs
  logic/
    aeroCalcs.js          ✓ done — V_ht, V_vt, NP, static margin, warnings
    liftCalcs.js          NEW — CL, stall speed, cruise speed, required wing area
    weightCalcs.js        NEW — weight budget, structural weight estimates by material
    powerCalcs.js         NEW — thrust from motor+prop+battery, power loading, endurance
    fuselageCalcs.js      NEW — fuselage length, wetted area, drag estimate
    efficiencyCalcs.js    NEW — L/D, payload fraction, combined efficiency score
    biplaneCalcs.js       NEW — biplane interference factor, effective CL_max, total area
    optimizerCalcs.js     NEW — master function that scores any full config
  tests/
    aeroCalcs.test.js     ✓ done
    liftCalcs.test.js     NEW
    weightCalcs.test.js   NEW
    powerCalcs.test.js    NEW
    efficiencyCalcs.test.js NEW
    biplaneCalcs.test.js  NEW
    optimizerCalcs.test.js NEW
  components/
    LeftPanel/            inputs — geometry, material, motor, config selector
    CenterPanel/          SVG wireframe (biplane-aware)
    RightPanel/           readouts — efficiency score, max lift, warnings
  App.jsx
  main.jsx
```

---

## Data Layer — New Files

### `materials.js`
Each material is what you'd build the wing skin/ribs from.

```js
{
  id, name,
  densityKgM2,      // surface density (kg/m²) — what matters for wing weight
  structuralScore,  // 1–10 (stiffness per weight)
  buildDifficulty,  // 'easy' | 'medium' | 'hard'
  costScore,        // 1–5 (5 = most expensive)
  note,             // e.g. "needs fiberglass spar for spans > 1.5m"
}
```

Materials to include:
- EPP foam (3mm)
- Depron foam (3mm)
- Balsa sheet (3mm)
- Balsa + fiberglass skin
- Coroplast (corrugated plastic)
- Carbon fiber sheet (1mm)
- Plywood (3mm lite-ply)

### `motors.js`
Common SAE Aero brushless motors.

```js
{
  id, name,
  kv,               // RPM/V
  maxCurrentA,      // continuous current (A)
  weightG,          // motor weight in grams
  maxThrustG,       // static thrust (g) at max throttle with recommended prop
  recommendedPropIn,// e.g. "12x6"
  note,
}
```

### `wingConfigs.js`
Wing planform types.

```js
{
  id, name,
  liftInterferenceFactor,  // 1.0 for monoplane; ~0.85 for biplane (Munck)
  dragPenaltyFactor,       // 1.0 for monoplane; ~1.10 for biplane (extra struts/interference)
  structuralWeightFactor,  // relative to monoplane (biplane ~1.3x heavier for same span)
  requiresGapInput,        // biplane needs gap/chord ratio
  note,
}
```

Configs: monoplane, biplane (equal-span), sesquiplane (lower wing 60% of upper)

---

## Logic Layer — New Modules

### `liftCalcs.js`

**Required wing area for target flight:**
```
S_required = (2 · W_total · g) / (ρ · V² · CL)
```
where V is target cruise speed, CL is selected airfoil's operating CL.

**Stall speed:**
```
V_stall = sqrt(2 · W · g / (ρ · CL_max · S))
```

**Required CL at a given speed:**
```
CL_required = 2 · W · g / (ρ · V² · S)
```

**Lift-to-drag ratio (L/D):**
```
L/D = CL / CD
CD = CD0 + CL² / (π · e · AR)
CD0 ≈ 0.025 (SAE Aero typical, accounting for fuselage + landing gear)
e   ≈ 0.80  (Oswald efficiency, typical SAE build quality)
```

**Max range speed (best L/D):**
```
V_bestLD = sqrt(2 · W / (ρ · S) · sqrt(π · e · AR / CD0))
```

### `weightCalcs.js`

**Wing weight estimate:**
```
W_wing = S_total · material.densityKgM2 · structuralFactor
structuralFactor ≈ 2.2 (accounts for spar, ribs, covering — not just skin)
```

**Total aircraft weight budget:**
```
W_total = W_wing + W_tail + W_fuselage + W_motor + W_battery + W_electronics + W_payload
```
- `W_tail` = (S_ht + S_vt) · material.densityKgM2 · 1.5 (tail structures are lighter)
- `W_fuselage` = estimated from fuselage length + width (input)
- `W_motor` = from motor database
- `W_battery` = cells · cellWeightG (input)
- `W_electronics` = constant ~150g (ESC, receiver, servos)

**Empty weight (without payload):**
```
W_empty = W_total - W_payload
```

**Payload fraction:**
```
payloadFraction = W_payload / W_total
```
Higher is better. Competitive SAE designs target 40–60%.

### `powerCalcs.js`

**Static thrust from motor+prop:**
```
T_static ≈ motor.maxThrustG * throttleFraction   (from motor DB)
```
Or from first-principles prop formula:
```
T = η_prop · P / V_exit
P = V_battery · I_motor
```

**Thrust-to-weight ratio:**
```
TWR = T_static / (W_total · g)
```
Target TWR ≥ 0.5 for SAE Aero (slow takeoff, not aerobatic).
TWR < 0.3 → cannot climb. TWR > 1.0 → overkill, wasting payload budget on motor weight.

**Thrust required for level flight (= drag):**
```
T_required = W_total · g / (L/D)
```

**Thrust margin:**
```
thrustMargin = T_static - T_required   (must be > 0 to climb)
```

**Estimated flight endurance:**
```
I_cruise = T_required / (motor.kv · V_battery · η_motor)  (simplified)
enduranceMin = (batteryCapacityMAh / 1000) / I_cruise * 60
```

**Max liftable payload:**
This is the key output. Solve for W_payload given T_static:
```
W_total_max = T_static / TWR_target   (e.g., TWR_target = 0.5)
W_payload_max = W_total_max - W_empty
```

### `fuselageCalcs.js`

**Fuselage length from tail arm:**
```
L_fuse ≈ L_ht + 0.5 · c   (tail arm measured from wing AC to tail AC)
```
Wing typically positioned at ~35–40% of fuselage length from nose.

**Nose moment arm (needed for CG balance):**
```
L_nose = L_fuse · 0.35   (typical for nose-heavy layouts)
```

**Fuselage drag contribution (flat plate approximation):**
```
CD_fuse ≈ 0.006 · (A_frontal / S_wing)
A_frontal = fuselage_width · fuselage_height  (inputs)
```

**Wetted area (for total drag estimate):**
```
S_wet = S_wing · (1 + (S_ht + S_vt + S_fuse_side * 2) / S_wing)
```

### `efficiencyCalcs.js`

**Aerodynamic efficiency:** L/D ratio (higher = glides further per unit drag)

**Structural efficiency:**
```
structuralEfficiency = W_payload / W_empty   (payload-to-empty-weight ratio)
```
Good SAE designs: 0.8–1.5

**Overall efficiency score (0–100):**
Weighted composite:
```
score = 0.35 · normalize(payloadFraction, 0.2, 0.6)
      + 0.25 · normalize(L/D, 5, 20)
      + 0.20 · normalize(thrustMargin / W_total, 0, 0.5)
      + 0.10 · normalize(staticMargin, 0.05, 0.20)
      + 0.10 · normalize(1 - stallSpeedRisk, 0, 1)
```
Each term is 0–1 normalized. Score of 100 = theoretically perfect in all categories.

**Penalty modifiers applied to score:**
- V_ht < 0.4: −20 points
- V_vt < 0.02: −20 points
- TWR < 0.3: −30 points (won't fly)
- staticMargin < 0: −40 points (unstable)
- payloadFraction < 0.25: −15 points
- T-tail selected: −5 points (risk penalty)

### `biplaneCalcs.js`

**Munck's biplane interference:**
```
CL_max_biplane = CL_max_single · liftInterferenceFactor · (1 + gapChordRatio * 0.1)
```
Typical gap/chord = 1.0–1.5 for SAE Aero. Interference factor ~0.85–0.92.

**Total biplane wing area:**
```
S_total = S_upper + S_lower
```

**Effective monoplane equivalent area (for drag calc):**
```
S_equiv = S_total · 0.90   (biplane drag ~10% more than equivalent monoplane)
```

**Structural weight premium:**
Biplane needs inter-plane struts and bracing wires.
```
W_wing_biplane = W_wing_mono · structuralWeightFactor   (~1.25–1.35×)
```

**When biplane wins:**
Biplanes are better when: wingspan is constrained (SAE rules), high CL_max is needed,
and structural weight premium is acceptable. They lose when: no span constraint,
payload fraction is the primary goal (heavier structure hurts).

### `optimizerCalcs.js`

Master function that takes the full design config and returns a complete scorecard.

```js
calcOptimizedDesign({
  // Geometry
  S, b, c,
  S_ht, S_vt, L_ht, L_vt,
  wingConfig,           // monoplane | biplane | sesquiplane
  gapChordRatio,        // biplane only
  fuselageWidth, fuselageHeight,

  // Aerodynamics
  airfoil, tailConfig,
  dihedralAngle, flaperonsEnabled,
  h_cg, aoa,

  // Power system
  motor,                // from motors.js
  batteryS,             // cell count (e.g. 3 for 3S)
  batteryCapacityMAh,
  throttleFraction,     // 0–1, cruise throttle

  // Materials
  wingMaterial,         // from materials.js
  tailMaterial,

  // Weight inputs
  payloadKg,            // target payload
  electronicsWeightG,   // ESC + receiver + servos
  fuselageWeightG,      // estimated or measured
})
```

Returns:
```js
{
  // Aero (from existing aeroCalcs.js)
  V_ht, V_vt, AR, h_n, staticMargin, stabilityStatus, stallRisk,

  // Weight
  W_wing, W_tail, W_total, W_empty, payloadFraction,

  // Power
  thrustStatic, thrustRequired, thrustMargin, TWR, enduranceMin,
  maxPayloadKg,           // ← KEY OUTPUT: how much can this config actually lift?

  // Aero performance
  LD_ratio, V_stall, V_cruise, V_bestLD, CL_required,

  // Fuselage
  fuselageLength, noseArm,

  // Score
  efficiencyScore,        // 0–100
  penaltyBreakdown,       // list of applied penalties

  // All warnings (existing + new power/weight warnings)
  activeWarnings,

  // Diagram data
  scissorsData,
}
```

---

## New Warnings to Add

| Code | Condition | Severity |
|---|---|---|
| TWR_LOW | TWR < 0.3 | critical |
| TWR_MARGINAL | 0.3 ≤ TWR < 0.5 | warning |
| PAYLOAD_FRACTION_LOW | payloadFraction < 0.25 | warning |
| STALL_SPEED_HIGH | V_stall > 8 m/s (hand/bungee launch limit) | warning |
| THRUST_MARGIN_NEG | thrustMargin < 0 | critical (won't maintain level flight) |
| FUSELAGE_TOO_SHORT | fuselageLength < L_ht + 0.3 | critical |
| BIPLANE_GAP_LOW | gapChordRatio < 0.8 | warning (excessive interference) |

---

## UI Layout (updated)

### Left Panel — Inputs
**Section 1: Wing**
- Wing config selector (monoplane / biplane / sesquiplane)
- Wing area S, span b, chord c (sliders)
- Gap/chord ratio (biplane only)
- Airfoil selector
- Flaperons toggle

**Section 2: Tail**
- Tail config selector
- S_ht, S_vt, L_ht, L_vt (sliders)
- Dihedral (V-tail only)

**Section 3: Power System**
- Motor selector (or manual: thrust input in grams)
- Battery S count + capacity (mAh)
- Cruise throttle % slider

**Section 4: Materials & Weight**
- Wing material selector
- Tail material selector
- Fuselage width/height (for drag)
- Electronics weight (g)
- Fuselage weight (g)
- Target payload (kg)

**Section 5: Flight Conditions**
- CG position (% MAC)
- Cruise AOA
- Air density (auto: standard sea level, or manual for altitude)

### Center Panel — SVG Wireframe
- Top-down view (existing) + optional side view for biplane
- Biplane draws both wings with gap visualization
- Fuselage scaled to computed length

### Right Panel — Readouts
**Big Numbers (most important first):**
1. Max Liftable Payload — kg, large font, color-coded
2. Efficiency Score — 0–100
3. Thrust Margin — g remaining after overcoming drag

**Performance Block:**
- L/D ratio
- Stall speed (m/s)
- TWR
- Payload fraction %
- Endurance (min)

**Stability Block (simplified):**
- Static margin % (green/yellow/red)
- Stability status badge

**Warnings list** (existing + new)

**Scissors Diagram** (existing, unchanged)

---

## Build Order

1. ✅ `data/airfoils.js` + `data/tailConfigs.js`
2. ✅ `logic/aeroCalcs.js` — tail volumes, NP, SM, warnings
3. `data/materials.js` + `data/motors.js` + `data/wingConfigs.js`
4. `logic/liftCalcs.js` — CL, stall speed, L/D, wing area sizing
5. `logic/weightCalcs.js` — weight budget, structural estimates
6. `logic/powerCalcs.js` — thrust, TWR, endurance, max payload
7. `logic/fuselageCalcs.js` — fuselage length, frontal drag
8. `logic/efficiencyCalcs.js` — efficiency score, penalties
9. `logic/biplaneCalcs.js` — biplane interference, effective area
10. `logic/optimizerCalcs.js` — master scorecard function
11. Tests for steps 3–10
12. React UI — LeftPanel inputs
13. RightPanel readouts
14. CenterPanel SVG wireframe
15. Polish + warnings + scissors diagram
