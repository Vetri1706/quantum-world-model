import type { EquipmentDefinition } from "../types/playground";

export const equipmentRegistry: EquipmentDefinition[] = [
  // ================= QUANTUM SOURCES =================
  {
    id: "electron-gun",
    name: "Electron Gun",
    category: "Quantum Sources",
    icon: "⌁",
    svg: "electron-gun",
    description: "Emits a beam of high-energy electrons. Adjust beam energy and emission rate.",
    defaultSize: { width: 90, height: 50 },
    difficulty: 3,
    supports: ["Quantum Tunneling", "Double Slit", "Wave Packet"],
    ports: [
      { id: "out", label: "Electron Beam", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "energy", label: "Energy", type: "number", defaultValue: 5, unit: "eV", minimum: 0.1, maximum: 100, step: 0.1 },
      { id: "beamWidth", label: "Beam Width", type: "number", defaultValue: 2, unit: "nm", minimum: 0.1, maximum: 20, step: 0.1 },
      { id: "particle", label: "Particle Type", type: "select", defaultValue: "electron", allowedValues: ["electron", "positron"] },
      { id: "emissionRate", label: "Emission Rate", type: "number", defaultValue: 10, unit: "kHz", minimum: 1, maximum: 100, step: 1 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateElectronGun",
    rendererHook: "renderElectronGun",
    compatibleExperiments: ["quantum-tunneling", "double-slit"]
  },
  {
    id: "photon-source",
    name: "Photon Source",
    category: "Quantum Sources",
    icon: "✺",
    svg: "photon-source",
    description: "Produces single photons or weak coherent photon pulses for optical quantum setups.",
    defaultSize: { width: 80, height: 50 },
    difficulty: 4,
    supports: ["Double Slit", "Polarization", "Single Photon"],
    ports: [
      { id: "out", label: "Photon Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "wavelength", label: "Wavelength", type: "number", defaultValue: 650, unit: "nm", minimum: 350, maximum: 800, step: 1 },
      { id: "intensity", label: "Intensity", type: "number", defaultValue: 1, unit: "mW", minimum: 0.1, maximum: 100, step: 0.1 },
      { id: "mode", label: "Emission Mode", type: "select", defaultValue: "single", allowedValues: ["single", "coherent", "thermal"] }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulatePhotonSource",
    rendererHook: "renderPhotonSource",
    compatibleExperiments: ["double-slit", "polarization-test"]
  },
  {
    id: "wavepacket-generator",
    name: "Wave Packet Generator",
    category: "Quantum Sources",
    icon: "∿",
    svg: "wavepacket-generator",
    description: "Emits modulated quantum wave packets to study time-dependent tunneling and dispersion.",
    defaultSize: { width: 100, height: 60 },
    difficulty: 5,
    supports: ["Wave Packet", "Quantum Tunneling", "Dispersion"],
    ports: [
      { id: "out", label: "Wave Packet Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "centerEnergy", label: "Center Energy", type: "number", defaultValue: 4, unit: "eV", minimum: 0.1, maximum: 20, step: 0.1 },
      { id: "sigma", label: "Spatial Spread (σ)", type: "number", defaultValue: 1.5, unit: "nm", minimum: 0.5, maximum: 10, step: 0.1 },
      { id: "chirp", label: "Chirp Rate", type: "number", defaultValue: 0, unit: "fs⁻²", minimum: -5, maximum: 5, step: 0.1 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateWavePacket",
    rendererHook: "renderWavePacket",
    compatibleExperiments: ["quantum-tunneling"]
  },

  // ================= QUANTUM OBJECTS =================
  {
    id: "potential-barrier",
    name: "Potential Barrier",
    category: "Quantum Objects",
    icon: "▥",
    svg: "potential-barrier",
    description: "A rectangular potential barrier representing a dielectric slab or electric field barrier.",
    defaultSize: { width: 60, height: 100 },
    difficulty: 2,
    supports: ["Quantum Tunneling", "Refraction", "Bound States"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "height", label: "Barrier Height", type: "number", defaultValue: 6, unit: "eV", minimum: 0.1, maximum: 50, step: 0.1 },
      { id: "width", label: "Barrier Width", type: "number", defaultValue: 1.2, unit: "nm", minimum: 0.1, maximum: 10, step: 0.05 },
      { id: "material", label: "Material Type", type: "select", defaultValue: "semiconductor", allowedValues: ["semiconductor", "vacuum", "insulator"] }
    ],
    placementRules: [],
    simulationHook: "simulateBarrier",
    rendererHook: "renderBarrier",
    compatibleExperiments: ["quantum-tunneling"]
  },
  {
    id: "potential-well",
    name: "Potential Well",
    category: "Quantum Objects",
    icon: "⊔",
    svg: "potential-well",
    description: "Creates an energy well that can trap particles in quantum bound states.",
    defaultSize: { width: 80, height: 100 },
    difficulty: 2,
    supports: ["Bound States", "Resonance", "Wave Packet"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "depth", label: "Well Depth", type: "number", defaultValue: -5, unit: "eV", minimum: -50, maximum: -0.1, step: 0.1 },
      { id: "width", label: "Well Width", type: "number", defaultValue: 2, unit: "nm", minimum: 0.5, maximum: 15, step: 0.1 }
    ],
    placementRules: [],
    simulationHook: "simulateWell",
    rendererHook: "renderWell",
    compatibleExperiments: ["quantum-well-resonance"]
  },
  {
    id: "infinite-wall",
    name: "Infinite Wall",
    category: "Quantum Objects",
    icon: "█",
    svg: "infinite-wall",
    description: "An impenetrable boundary forcing the particle wave function to zero at the interface.",
    defaultSize: { width: 40, height: 120 },
    difficulty: 1,
    supports: ["Particle in a Box", "Boundary Conditions"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "absorbEnergy", label: "Absorption Coefficient", type: "number", defaultValue: 0, unit: "%", minimum: 0, maximum: 100, step: 1 }
    ],
    placementRules: [],
    simulationHook: "simulateInfiniteWall",
    rendererHook: "renderInfiniteWall",
    compatibleExperiments: ["particle-in-a-box"]
  },
  {
    id: "single-slit",
    name: "Single Slit",
    category: "Quantum Objects",
    icon: "▯",
    svg: "single-slit",
    description: "A narrow opening in a barrier to demonstrate wave diffraction.",
    defaultSize: { width: 30, height: 120 },
    difficulty: 2,
    supports: ["Slit Diffraction", "Wave Fronts"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "slitWidth", label: "Slit Width", type: "number", defaultValue: 0.5, unit: "nm", minimum: 0.05, maximum: 5, step: 0.05 },
      { id: "thickness", label: "Aperture Thickness", type: "number", defaultValue: 1, unit: "nm", minimum: 0.1, maximum: 5, step: 0.1 }
    ],
    placementRules: [],
    simulationHook: "simulateSingleSlit",
    rendererHook: "renderSingleSlit",
    compatibleExperiments: ["slit-diffraction"]
  },
  {
    id: "double-slit",
    name: "Double Slit",
    category: "Quantum Objects",
    icon: "‖</",
    svg: "double-slit",
    description: "Two narrow parallel openings in a barrier to demonstrate wave-particle interference.",
    defaultSize: { width: 30, height: 120 },
    difficulty: 3,
    supports: ["Double Slit", "Interference", "Wave Fronts"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "slitWidth", label: "Slit Width", type: "number", defaultValue: 0.4, unit: "nm", minimum: 0.05, maximum: 3, step: 0.05 },
      { id: "separation", label: "Slit Separation", type: "number", defaultValue: 2, unit: "nm", minimum: 0.5, maximum: 10, step: 0.1 },
      { id: "thickness", label: "Material Thickness", type: "number", defaultValue: 1, unit: "nm", minimum: 0.1, maximum: 5, step: 0.1 }
    ],
    placementRules: [],
    simulationHook: "simulateDoubleSlit",
    rendererHook: "renderDoubleSlit",
    compatibleExperiments: ["double-slit"]
  },

  // ================= OPTICAL COMPONENTS =================
  {
    id: "laser",
    name: "Laser",
    category: "Optical Components",
    icon: "⚡",
    svg: "laser",
    description: "Emits a bright, continuous coherent light beam at a specific color/wavelength.",
    defaultSize: { width: 90, height: 40 },
    difficulty: 1,
    supports: ["Coherent Source", "Polarization", "Interferometry"],
    ports: [
      { id: "out", label: "Laser Beam", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "wavelength", label: "Wavelength", type: "number", defaultValue: 532, unit: "nm", minimum: 380, maximum: 780, step: 1 },
      { id: "power", label: "Power", type: "number", defaultValue: 5, unit: "mW", minimum: 0.5, maximum: 50, step: 0.5 },
      { id: "polarization", label: "Polarization Angle", type: "number", defaultValue: 0, unit: "°", minimum: 0, maximum: 360, step: 1 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateLaser",
    rendererHook: "renderLaser",
    compatibleExperiments: ["polarization-test", "interferometer"]
  },
  {
    id: "mirror",
    name: "Mirror",
    category: "Optical Components",
    icon: "╱",
    svg: "mirror",
    description: "Reflects incoming beams based on its angle of incidence.",
    defaultSize: { width: 60, height: 60 },
    difficulty: 2,
    supports: ["Reflections", "Interferometry", "Beam Deflection"],
    ports: [
      { id: "in", label: "Light In", type: "input", kind: "beam", position: { x: 20, y: 80 } },
      { id: "out", label: "Light Out", type: "output", kind: "beam", position: { x: 80, y: 20 } }
    ],
    inspector: [
      { id: "reflectivity", label: "Reflectivity", type: "number", defaultValue: 99.9, unit: "%", minimum: 80, maximum: 100, step: 0.1 },
      { id: "coating", label: "Mirror Coating", type: "select", defaultValue: "silver", allowedValues: ["silver", "gold", "dielectric"] }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateMirror",
    rendererHook: "renderMirror",
    compatibleExperiments: ["interferometer"]
  },
  {
    id: "beam-splitter",
    name: "Beam Splitter",
    category: "Optical Components",
    icon: "⧉",
    svg: "beam-splitter",
    description: "Splits a light beam into two: transmits a portion and reflects the rest.",
    defaultSize: { width: 60, height: 60 },
    difficulty: 3,
    supports: ["Interferometry", "Beam Splitting", "Phase Shifts"],
    ports: [
      { id: "in", label: "Light In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "trans", label: "Transmitted Out", type: "output", kind: "beam", position: { x: 100, y: 50 } },
      { id: "refl", label: "Reflected Out", type: "output", kind: "beam", position: { x: 50, y: 0 } }
    ],
    inspector: [
      { id: "ratio", label: "T/R Ratio", type: "select", defaultValue: "50/50", allowedValues: ["50/50", "70/30", "90/10"] },
      { id: "type", label: "Splitter Type", type: "select", defaultValue: "non-polarizing", allowedValues: ["non-polarizing", "polarizing"] }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateBeamSplitter",
    rendererHook: "renderBeamSplitter",
    compatibleExperiments: ["interferometer"]
  },
  {
    id: "lens",
    name: "Lens",
    category: "Optical Components",
    icon: "()",
    svg: "lens",
    description: "Focuses or collimates light beams. Standard spherical biconvex optics.",
    defaultSize: { width: 40, height: 70 },
    difficulty: 2,
    supports: ["Focal Paths", "Beam Focusing"],
    ports: [
      { id: "in", label: "Light In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Light Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "focalLength", label: "Focal Length", type: "number", defaultValue: 50, unit: "mm", minimum: -200, maximum: 200, step: 1 },
      { id: "aperture", label: "Aperture Size", type: "number", defaultValue: 25.4, unit: "mm", minimum: 5, maximum: 75, step: 0.1 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateLens",
    rendererHook: "renderLens",
    compatibleExperiments: []
  },
  {
    id: "polarizer",
    name: "Polarizer",
    category: "Optical Components",
    icon: "⎊",
    svg: "polarizer",
    description: "Filters light so that only photons matching the polarization angle pass through.",
    defaultSize: { width: 60, height: 60 },
    difficulty: 3,
    supports: ["Polarization", "Malus's Law", "Qubit Projections"],
    ports: [
      { id: "in", label: "Light In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Light Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "angle", label: "Transmission Axis", type: "number", defaultValue: 45, unit: "°", minimum: 0, maximum: 180, step: 0.5 },
      { id: "extinction", label: "Extinction Ratio", type: "number", defaultValue: 100000, unit: ":1", minimum: 100, maximum: 1000000, step: 100 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulatePolarizer",
    rendererHook: "renderPolarizer",
    compatibleExperiments: ["polarization-test"]
  },
  {
    id: "phase-plate",
    name: "Phase Plate",
    category: "Optical Components",
    icon: "⏔",
    svg: "phase-plate",
    description: "Adds a specified phase delay (e.g. wave retarders) to the transmitting wave.",
    defaultSize: { width: 50, height: 60 },
    difficulty: 4,
    supports: ["Polarization", "Phase Retardation", "Wave Plates"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "phaseShift", label: "Phase Shift (Δφ)", type: "number", defaultValue: 90, unit: "°", minimum: 0, maximum: 360, step: 1 },
      { id: "axis", label: "Fast Axis Angle", type: "number", defaultValue: 0, unit: "°", minimum: 0, maximum: 180, step: 1 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulatePhasePlate",
    rendererHook: "renderPhasePlate",
    compatibleExperiments: ["polarization-test"]
  },

  // ================= MEASUREMENT =================
  {
    id: "detector",
    name: "Quantum Detector",
    category: "Measurement",
    icon: "⌗",
    svg: "detector",
    description: "Detects particles/photons and generates electrical pulses. Triggers counters.",
    defaultSize: { width: 70, height: 60 },
    difficulty: 2,
    supports: ["Particle Detection", "Signal Counts"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "signal", label: "Coax Out", type: "output", kind: "signal", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "efficiency", label: "Quantum Efficiency", type: "number", defaultValue: 85, unit: "%", minimum: 10, maximum: 100, step: 1 },
      { id: "darkCount", label: "Dark Counts", type: "number", defaultValue: 50, unit: "Hz", minimum: 0, maximum: 1000, step: 5 },
      { id: "deadTime", label: "Dead Time", type: "number", defaultValue: 45, unit: "ns", minimum: 5, maximum: 500, step: 5 }
    ],
    placementRules: [],
    simulationHook: "simulateDetector",
    rendererHook: "renderDetector",
    compatibleExperiments: ["quantum-tunneling", "double-slit", "polarization-test"]
  },
  {
    id: "projection-screen",
    name: "Projection Screen",
    category: "Measurement",
    icon: "📺",
    svg: "projection-screen",
    description: "A wide fluorescent plate that shows particle collisions. Used to observe diffraction fringes.",
    defaultSize: { width: 40, height: 160 },
    difficulty: 1,
    supports: ["Interference", "Diffraction", "Visual Pattern"],
    ports: [
      { id: "in", label: "Beam Input", type: "input", kind: "beam", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "resolution", label: "Screen Resolution", type: "select", defaultValue: "high", allowedValues: ["low", "medium", "high"] },
      { id: "persistence", label: "Phosphor Decay", type: "number", defaultValue: 200, unit: "ms", minimum: 10, maximum: 2000, step: 50 }
    ],
    placementRules: [],
    simulationHook: "simulateProjectionScreen",
    rendererHook: "renderProjectionScreen",
    compatibleExperiments: ["double-slit"]
  },
  {
    id: "beam-stop",
    name: "Beam Stop",
    category: "Measurement",
    icon: "⚃",
    svg: "beam-stop",
    description: "Absorbs any incident light or particle streams to prevent stray rays from polluting detectors.",
    defaultSize: { width: 50, height: 50 },
    difficulty: 1,
    supports: ["Beam Damping", "Aperture Stop"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "absorption", label: "Absorption Coeff.", type: "number", defaultValue: 99.99, unit: "%", minimum: 90, maximum: 100, step: 0.01 }
    ],
    placementRules: ["on-bench"],
    simulationHook: "simulateBeamStop",
    rendererHook: "renderBeamStop",
    compatibleExperiments: ["interferometer"]
  },
  {
    id: "counter",
    name: "Signal Counter",
    category: "Measurement",
    icon: "🔢",
    svg: "counter",
    description: "Digital logic counter that tallies electrical pulses over a gate time window.",
    defaultSize: { width: 80, height: 50 },
    difficulty: 2,
    supports: ["Pulse Counting", "Coincidence Checks"],
    ports: [
      { id: "in", label: "Coax In", type: "input", kind: "signal", position: { x: 0, y: 50 } },
      { id: "out", label: "Coax Out", type: "output", kind: "signal", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "gateTime", label: "Gate Interval", type: "number", defaultValue: 1, unit: "s", minimum: 0.1, maximum: 60, step: 0.1 },
      { id: "displayMode", label: "Display Style", type: "select", defaultValue: "counts-per-sec", allowedValues: ["total-counts", "counts-per-sec"] }
    ],
    placementRules: [],
    simulationHook: "simulateCounter",
    rendererHook: "renderCounter",
    compatibleExperiments: ["quantum-tunneling"]
  },

  // ================= ENVIRONMENT =================
  {
    id: "vacuum-chamber",
    name: "Vacuum Chamber",
    category: "Environment",
    icon: "⎔",
    svg: "vacuum-chamber",
    description: "Maintains low gas density to prevent air dispersion of electrons. Necessary for electron guns.",
    defaultSize: { width: 180, height: 120 },
    difficulty: 3,
    supports: ["Vacuum Environment", "Thermal Insulation"],
    ports: [],
    inspector: [
      { id: "pressure", label: "Pressure", type: "number", defaultValue: 1e-6, unit: "Torr", minimum: 1e-8, maximum: 760, step: 1e-7 },
      { id: "temperature", label: "Temperature", type: "number", defaultValue: 293, unit: "K", minimum: 4, maximum: 400, step: 1 }
    ],
    placementRules: [],
    simulationHook: "simulateVacuum",
    rendererHook: "renderVacuum",
    compatibleExperiments: ["quantum-tunneling"]
  },
  {
    id: "optical-bench",
    name: "Optical Bench",
    category: "Environment",
    icon: "⌸",
    svg: "optical-bench",
    description: "Damped honeycomb laboratory table that isolates optics from ambient structural vibrations.",
    defaultSize: { width: 200, height: 80 },
    difficulty: 1,
    supports: ["Vibration Control", "Grid Mounting"],
    ports: [],
    inspector: [
      { id: "spacing", label: "Thread Spacing", type: "number", defaultValue: 25, unit: "mm", minimum: 10, maximum: 50, step: 5 },
      { id: "vibrationIsolation", label: "Damping Factor", type: "number", defaultValue: 45, unit: "dB", minimum: 10, maximum: 80, step: 5 }
    ],
    placementRules: [],
    simulationHook: "simulateOpticalBench",
    rendererHook: "renderOpticalBench",
    compatibleExperiments: ["interferometer"]
  },

  // ================= FIELDS =================
  {
    id: "electric-field",
    name: "Electric Field Plate",
    category: "Fields",
    icon: "⇄",
    svg: "electric-field",
    description: "Generates a localized uniform electrostatic field to deflect charged particles.",
    defaultSize: { width: 100, height: 60 },
    difficulty: 4,
    supports: ["Charged Deflection", "Field Stark Effect"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "voltage", label: "Plate Voltage", type: "number", defaultValue: 100, unit: "V", minimum: -1000, maximum: 1000, step: 5 },
      { id: "plateGap", label: "Plate Spacing", type: "number", defaultValue: 15, unit: "mm", minimum: 5, maximum: 50, step: 1 }
    ],
    placementRules: [],
    simulationHook: "simulateElectricField",
    rendererHook: "renderElectricField",
    compatibleExperiments: []
  },
  {
    id: "magnetic-field",
    name: "Magnetic Solenoid",
    category: "Fields",
    icon: "🧲",
    svg: "magnetic-field",
    description: "Produces a static longitudinal magnetic field. Induces Larmor precession and Zeeman splitting.",
    defaultSize: { width: 110, height: 70 },
    difficulty: 4,
    supports: ["Larmor Precession", "Zeeman Splitting"],
    ports: [
      { id: "in", label: "Beam In", type: "input", kind: "beam", position: { x: 0, y: 50 } },
      { id: "out", label: "Beam Out", type: "output", kind: "beam", position: { x: 100, y: 50 } }
    ],
    inspector: [
      { id: "fieldStrength", label: "Field B", type: "number", defaultValue: 0.5, unit: "Tesla", minimum: -5, maximum: 5, step: 0.05 },
      { id: "length", label: "Coil Length", type: "number", defaultValue: 100, unit: "mm", minimum: 10, maximum: 500, step: 10 }
    ],
    placementRules: [],
    simulationHook: "simulateMagneticField",
    rendererHook: "renderMagneticField",
    compatibleExperiments: []
  },

  // ================= VISUALIZATION =================
  {
    id: "probability-plot",
    name: "Probability Plot",
    category: "Visualization",
    icon: "📈",
    svg: "probability-plot",
    description: "Draws the real-time wave function absolute amplitude square |Ψ(x)|².",
    defaultSize: { width: 160, height: 100 },
    difficulty: 2,
    supports: ["Wavefunction View", "Quantum Observables"],
    ports: [
      { id: "in", label: "Signal In", type: "input", kind: "signal", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "verticalScale", label: "Y-Scale Gain", type: "number", defaultValue: 1, unit: "x", minimum: 0.1, maximum: 10, step: 0.1 },
      { id: "plotStyle", label: "Curve Style", type: "select", defaultValue: "solid", allowedValues: ["solid", "dotted", "filled"] }
    ],
    placementRules: [],
    simulationHook: "renderProbabilityCurve",
    rendererHook: "renderProbabilityPlot",
    compatibleExperiments: ["quantum-tunneling"]
  },
  {
    id: "state-viewer",
    name: "State Viewer",
    category: "Visualization",
    icon: "⚛",
    svg: "state-viewer",
    description: "Displays quantum state coefficients (phasor bars) for discrete state superpositions.",
    defaultSize: { width: 150, height: 100 },
    difficulty: 3,
    supports: ["Ket State", "Phasor View", "Basis Rotations"],
    ports: [
      { id: "in", label: "Signal In", type: "input", kind: "signal", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "basis", label: "Measurement Basis", type: "select", defaultValue: "Z-basis", allowedValues: ["X-basis", "Y-basis", "Z-basis"] },
      { id: "showPhase", label: "Render Phase Angles", type: "boolean", defaultValue: true }
    ],
    placementRules: [],
    simulationHook: "renderStatePhasors",
    rendererHook: "renderStateViewer",
    compatibleExperiments: ["polarization-test"]
  },
  {
    id: "bloch-sphere",
    name: "Bloch Sphere",
    category: "Visualization",
    icon: "⊕",
    svg: "bloch-sphere",
    description: "Holographic projection representing two-level quantum states (qubits) on a 3D sphere.",
    defaultSize: { width: 120, height: 120 },
    difficulty: 5,
    supports: ["Qubit State", "Bloch Spheres", "Precession Trail"],
    ports: [
      { id: "in", label: "Signal In", type: "input", kind: "signal", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "vectorColor", label: "State Vector Color", type: "select", defaultValue: "#ff007f", allowedValues: ["#ff007f", "#00ffcc", "#ffff00"] },
      { id: "renderTrace", label: "Draw Vector Trail", type: "boolean", defaultValue: true }
    ],
    placementRules: [],
    simulationHook: "renderBlochProjection",
    rendererHook: "renderBlochSphere",
    compatibleExperiments: ["polarization-test"]
  },

  // ================= ANALYSIS =================
  {
    id: "histogram",
    name: "Coincidence Histogram",
    category: "Analysis",
    icon: "📊",
    svg: "histogram",
    description: "Plots count histograms or time-delay correlations between twin detector signals.",
    defaultSize: { width: 160, height: 100 },
    difficulty: 3,
    supports: ["Signal Correlation", "Coincidence Analysis"],
    ports: [
      { id: "in", label: "Signal In", type: "input", kind: "signal", position: { x: 0, y: 50 } }
    ],
    inspector: [
      { id: "binWidth", label: "Bin Width", type: "number", defaultValue: 5, unit: "ns", minimum: 0.1, maximum: 100, step: 0.1 },
      { id: "maxBins", label: "Number of Bins", type: "number", defaultValue: 50, minimum: 10, maximum: 200, step: 10 }
    ],
    placementRules: [],
    simulationHook: "renderHistogramPlot",
    rendererHook: "renderHistogram",
    compatibleExperiments: []
  },

  // ================= UTILITIES =================
  {
    id: "bnc-t",
    name: "BNC T-Connector",
    category: "Utilities",
    icon: "⊤",
    svg: "bnc-t",
    description: "Splits a single BNC signal cable path into two separate paths for measurement distribution.",
    defaultSize: { width: 50, height: 40 },
    difficulty: 1,
    supports: ["Signal Splitting", "Cable Routing"],
    ports: [
      { id: "in", label: "Signal In", type: "input", kind: "signal", position: { x: 0, y: 50 } },
      { id: "out1", label: "Signal Out 1", type: "output", kind: "signal", position: { x: 100, y: 25 } },
      { id: "out2", label: "Signal Out 2", type: "output", kind: "signal", position: { x: 100, y: 75 } }
    ],
    inspector: [
      { id: "label", label: "Port Identifier", type: "string", defaultValue: "T-1" }
    ],
    placementRules: [],
    simulationHook: "splitSignal",
    rendererHook: "renderBncT",
    compatibleExperiments: []
  }
];
