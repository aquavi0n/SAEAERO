# Aero-Design Optimization Dashboard — Build Plan

## Stack
- **React** (Vite)
- **Tailwind CSS** for styling
- **Recharts** for any graphs (stability diagram)
- No backend — all logic is pure client-side math

---

## Project Structure
```
src/
  components/
    LeftPanel/
      InputSlider.jsx       # reusable labeled slider
      AirfoilSelector.jsx   # dropdown + displays airfoil warnings
      TailConfigSelector.jsx # dropdown + conditional dihedral input
      FlaperonsToggle.jsx
    CenterPanel/
      WireframeView.jsx     # SVG top-down aircraft diagram
    RightPanel/
      TVCReadout.jsx        # V_ht, V_vt values + color status
      StabilityIndicator.jsx # Green/Yellow/Red badges
      ScissorsDiagram.jsx   # Recharts plot (NP vs CG)
  hooks/
    useAeroCalcs.js         # all formula logic lives here
  data/
    airfoils.js             # airfoil DB with CL_max, stall AOA, warnings
    tailConfigs.js          # tail types with modifiers and warnings
  App.jsx
  main.jsx
```

---

## Data Layer (`data/`)

**`airfoils.js`** — static config objects:
```
{ id, name, CL_max, stallAngle, warningText, constructionNote }
```

**`tailConfigs.js`** — static config objects:
```
{ id, name, modifier, requiresDihedral, warnings[] }
```

---

## Core Logic (`hooks/useAeroCalcs.js`)

Single custom hook that takes all inputs and returns all derived values. Nothing computed in components.

**Inputs state:**
- `S`, `b`, `c` (wing params)
- `S_ht`, `S_vt`, `L_ht`, `L_vt` (tail params)
- `airfoilId`, `tailConfigId`
- `dihedralAngle` (only active when V-Tail selected)
- `flaperonsEnabled`

**Computed outputs:**
- `V_ht` — with V-Tail: uses `cos²(dihedral)` modifier
- `V_vt` — with V-Tail: uses `sin²(dihedral)` modifier
- `h_n` (neutral point approx) — linear function of `V_ht`
- `staticMargin` — `h_n - CG_position` (CG input needed or assumed)
- `stabilityStatus` — `"stable" | "marginal" | "unstable"`
- `stallRisk` — derived from airfoil + current AOA slider
- `activeWarnings[]` — aggregated list of all triggered warnings

**Constraint checks (trigger warnings):**
- `V_ht < 0.4` → UNSTABLE
- `V_vt < 0.02` → UNSTABLE
- T-Tail selected → deep stall warning always shown
- CG behind NP → negative static margin warning

---

## Component Breakdown

**`LeftPanel`**
- Sliders: S (0.1–3 m²), b (0.5–4 m), c (0.1–1 m), S_ht, S_vt, L_ht, L_vt — all with live numeric readouts
- Airfoil dropdown → shows airfoil-specific warning below it on selection
- Tail config dropdown → conditionally renders dihedral angle slider if V-Tail
- Flapertons toggle → shows complexity note when enabled

**`CenterPanel` — SVG Wireframe**
- Top-down view, scales wing rectangle proportionally to `b` and `c`
- Tail surfaces scale to `S_ht`, `S_vt`
- Moment arm lines show `L_ht`, `L_vt` distances
- All values normalized to a fixed canvas size so proportions are always meaningful
- V-Tail draws angled surfaces using dihedral angle

**`RightPanel`**
- `V_ht` and `V_vt` large numeric readouts with colored backgrounds (green/yellow/red based on thresholds)
- Stability badge: Green Stable / Yellow Marginal / Red Unstable — updates live
- Stall risk badge per selected airfoil
- Active warnings list — stacked red alert boxes for any triggered constraints
- Scissors diagram (Recharts line chart): NP and SM plotted as `V_ht` varies, with a vertical line at current value

---

## Styling
- Dark aerospace theme — near-black background, cyan/teal accents
- Monospace font for all numeric readouts
- Three-column layout, fixed height, no scroll (single screen)
- Warning boxes: pulsing red border for severe constraints

---

## Build Order
1. `data/` files + `useAeroCalcs.js` hook (all math, fully testable in isolation)
2. `LeftPanel` inputs wired to state
3. `RightPanel` readouts consuming hook output
4. `CenterPanel` SVG wireframe
5. Scissors diagram
6. Polish — colors, warnings, responsive tweaks
