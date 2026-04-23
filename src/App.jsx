import React, { useState, useMemo } from 'react';
import { AIRFOILS } from './data/airfoils.js';
import { TAIL_CONFIGS } from './data/tailConfigs.js';
import { WING_CONFIGS } from './data/wingConfigs.js';
import { MOTORS } from './data/motors.js';
import { MATERIALS } from './data/materials.js';
import { autoSize } from './autoSize.js';
import { calcOptimizedDesign } from './logic/optimizerCalcs.js';
import ConfigPanel from './components/ConfigPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';

const DEFAULTS = {
  wingConfigId: 'MONOPLANE',
  airfoilId: 'NACA_4412',
  tailConfigId: 'CONVENTIONAL',
  materialId: 'DEPRON_3MM',
  motorId: 'SUNNYSKY_X2216',
  manualThrustG: 1050,
  manualMotorWeightG: 68,
  batteryS: 3,
  batteryCapacityMAh: 2200,
  payloadKg: 0.5,
  wingspan: 1.4,
  h_cg: 0.28,
};

export default function App() {
  const [cfg, setCfg] = useState(DEFAULTS);

  function set(key, value) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  const result = useMemo(() => {
    try {
      const wingConfig = WING_CONFIGS.find((w) => w.id === cfg.wingConfigId);
      const airfoil = AIRFOILS.find((a) => a.id === cfg.airfoilId);
      const tailConfig = TAIL_CONFIGS.find((t) => t.id === cfg.tailConfigId);
      const material = MATERIALS.find((m) => m.id === cfg.materialId);
      const selectedMotor = MOTORS.find((m) => m.id === cfg.motorId);

      const motor = cfg.motorId === 'CUSTOM'
        ? { ...selectedMotor, maxThrustG: cfg.manualThrustG, weightG: cfg.manualMotorWeightG }
        : selectedMotor;

      const geo = autoSize({
        wingspan: cfg.wingspan,
        payloadKg: cfg.payloadKg,
        airfoilId: cfg.airfoilId,
        wingConfigId: cfg.wingConfigId,
        materialId: cfg.materialId,
        motorId: cfg.motorId,
        manualThrustG: cfg.manualThrustG,
        manualMotorWeightG: cfg.manualMotorWeightG,
        batteryS: cfg.batteryS,
        batteryCapacityMAh: cfg.batteryCapacityMAh,
        h_cg: cfg.h_cg,
      });

      const res = calcOptimizedDesign({
        ...geo,
        wingConfig, airfoil, tailConfig,
        wingMaterial: material,
        tailMaterial: material,
        motor,
        batteryS: cfg.batteryS,
        batteryCapacityMAh: cfg.batteryCapacityMAh,
        payloadKg: cfg.payloadKg,
        manualThrustG: cfg.motorId === 'CUSTOM' ? cfg.manualThrustG : null,
      });

      return { ...res, geo };
    } catch (e) {
      return { error: e.message };
    }
  }, [cfg]);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 h-11 bg-gray-900 border-b border-gray-800 flex items-center px-5 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm text-white tracking-tight">SAE Aero</span>
          <span className="text-gray-600 text-sm">Design Optimizer</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          {result?.geo && !result.error && (
            <>
              <span>Wing area: <span className="text-gray-300 font-medium">{result.geo.S.toFixed(3)} m²</span></span>
              <span className="text-gray-700">·</span>
              <span>AR: <span className="text-gray-300 font-medium">{(result.geo.b ** 2 / result.geo.S).toFixed(1)}</span></span>
              <span className="text-gray-700">·</span>
              <span>Chord: <span className="text-gray-300 font-medium">{(result.geo.c * 100).toFixed(1)} cm</span></span>
            </>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex w-full pt-11 overflow-hidden">
        <div className="w-80 min-w-80 flex-shrink-0 border-r border-gray-800 overflow-y-auto bg-gray-950">
          <ConfigPanel cfg={cfg} set={set} />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-950">
          <ResultsPanel result={result} cfg={cfg} />
        </div>
      </div>
    </div>
  );
}
