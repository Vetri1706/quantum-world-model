// QWM Data Loader: Parses experiment YAML definitions from quantum/experiments/

import * as yaml from "js-yaml";

export type ExperimentEquipment = {
  component: string;
  role: string;
  required: boolean;
};

export type ExperimentParameter = {
  id: string;
  label: string;
  quantity: string;
  unit: string;
  default: number;
  minimum: number;
  maximum: number;
};

export type QWMExperiment = {
  id: string;
  name: string;
  short_description: string;
  scientific_question: string;
  goal: string;
  steps: string[];
  what_to_watch: string[];
  expected_observation: string;
  difficulty: string;
  configuration: {
    environment: string;
    components: ExperimentEquipment[];
    parameters: ExperimentParameter[];
  };
  concepts: string[];
  equations: string[];
  educational_notes: string;
};

export const defaultQuantumTunnelingExperiment: QWMExperiment = {
  id: "quantum-tunneling",
  name: "Can an electron cross a wall?",
  short_description: "Change an invisible energy wall and watch the electron's chance of getting through.",
  scientific_question: "How do barrier width and particle energy affect the chance that an electron crosses a higher potential-energy region?",
  goal: "Explore quantum tunneling by varying a rectangular barrier and observing the transmission probability.",
  steps: ["Start with the electron energy below the wall height.", "Make the wall wider or narrower.", "Compare the percentage detected on the far side."],
  what_to_watch: ["The wave fades inside the wall instead of stopping instantly.", "A small signal still appears beyond the wall.", "A wider wall makes that signal shrink quickly."],
  expected_observation: "The electron can appear beyond a wall that a classical particle could not cross, but the chance falls rapidly as the wall gets wider.",
  difficulty: "intermediate",
  configuration: {
    environment: "vacuum-chamber",
    components: [
      { component: "electron-source", role: "source", required: true },
      { component: "potential-barrier", role: "barrier", required: true },
      { component: "detector", role: "detector", required: true },
    ],
    parameters: [
      { id: "incident-energy", label: "Incident energy", quantity: "energy", unit: "eV", default: 1.0, minimum: 0.1, maximum: 10.0 },
      { id: "barrier-height", label: "Barrier height", quantity: "energy", unit: "eV", default: 5.0, minimum: 0.1, maximum: 20.0 },
      { id: "barrier-width", label: "Barrier width", quantity: "length", unit: "nm", default: 1.0, minimum: 0.1, maximum: 10.0 },
    ],
  },
  concepts: ["wave-function", "potential-barrier-concept", "probability-density"],
  equations: ["schrodinger-equation", "tunneling-transmission-coefficient"],
  educational_notes: "The simulation represents a probability distribution, not a classical particle drilling through a wall.",
};

export const defaultWaveInterferenceExperiment: QWMExperiment = {
  id: "wave-interference",
  name: "How does a quantum wave make stripes?",
  short_description: "Send light through two openings and see bright and dark bands build up on the screen.",
  scientific_question: "How do slit separation and wavelength create quantum interference fringes on a detector screen?",
  goal: "Observe wave-particle duality and constructive/destructive interference patterns.",
  steps: ["Turn on the laser source.", "Change the wavelength or slit spacing.", "Read the bright and dark bands on the screen."],
  what_to_watch: ["Two paths overlap after the slits.", "Bright bands are where waves add together.", "Dark bands are where waves cancel."],
  expected_observation: "The screen shows an interference pattern, and changing wavelength changes the spacing between its bright bands.",
  difficulty: "beginner",
  configuration: {
    environment: "optical-bench",
    components: [
      { component: "laser-source", role: "source", required: true },
      { component: "double-slit-mask", role: "barrier", required: true },
      { component: "screen-detector", role: "detector", required: true },
    ],
    parameters: [
      { id: "wavelength", label: "Wavelength", quantity: "length", unit: "nm", default: 500, minimum: 200, maximum: 800 },
      { id: "slit-separation", label: "Slit separation", quantity: "length", unit: "μm", default: 2.0, minimum: 0.5, maximum: 5.0 },
      { id: "slit-width", label: "Slit width", quantity: "length", unit: "μm", default: 0.5, minimum: 0.1, maximum: 2.0 },
    ],
  },
  concepts: ["superposition", "wave-particle-duality", "interference-pattern"],
  equations: ["double-slit-equation", "de-broglie-wavelength"],
  educational_notes: "Electrons build up the interference pattern one particle at a time when measured repeatedly.",
};

export const defaultNewtonsCradleExperiment: QWMExperiment = {
  id: "newtons-cradle",
  name: "Where does the motion go?",
  short_description: "Release one steel ball and follow momentum as it travels through the cradle.",
  scientific_question: "How do elastic collisions conserve linear momentum and kinetic energy across a series of identical pendulums?",
  goal: "Observe classical momentum transfer and conservation laws in 3D space.",
  steps: ["Pull one end ball back.", "Release it without pushing.", "Compare the motion at both ends of the cradle."],
  what_to_watch: ["The middle balls barely move as a group.", "A ball at the opposite end swings out.", "Small losses reveal that real collisions are not perfect."],
  expected_observation: "The incoming motion is transferred through the row, making an end ball swing out with nearly the same speed.",
  difficulty: "beginner",
  configuration: {
    environment: "physics-stage",
    components: [
      { component: "newtons-cradle", role: "apparatus", required: true },
      { component: "detector", role: "sensor", required: true },
    ],
    parameters: [
      { id: "release-angle", label: "Release Angle", quantity: "angle", unit: "deg", default: 30, minimum: 5, maximum: 60 },
      { id: "restitution", label: "Coefficient of Restitution", quantity: "ratio", unit: "e", default: 0.98, minimum: 0.5, maximum: 1.0 },
    ],
  },
  concepts: ["momentum-conservation", "elastic-collision", "kinetic-energy"],
  equations: ["conservation-of-momentum", "pendulum-period"],
  educational_notes: "When one sphere is pulled back and released, its kinetic energy propagates through the middle spheres into the end sphere.",
};

export const defaultCrystalCapsuleExperiment: QWMExperiment = {
  id: "crystal-capsule",
  name: "Can a crystal filter electron energies?",
  short_description: "Send a wave through a repeating crystal pattern and find the energies that can pass.",
  scientific_question: "How does periodic potential in a 3D crystal capsule trap and localize quantum wave packets into discrete energy bands?",
  goal: "Explore Bloch waves and electronic band structures inside a nanometer crystal capsule.",
  steps: ["Send an electron wave into the crystal capsule.", "Sweep the lattice depth or capsule length.", "Compare the transmitted and reflected parts of the wave."],
  what_to_watch: ["The repeating atoms scatter the wave many times.", "Some energies travel through the lattice.", "Other energies are reflected, creating gaps."],
  expected_observation: "A periodic crystal does not transmit every energy equally; allowed bands and gaps emerge from repeated wave scattering.",
  difficulty: "advanced",
  configuration: {
    environment: "quantum-vacuum",
    components: [
      { component: "crystal-capsule", role: "chamber", required: true },
      { component: "electron-source", role: "source", required: true },
      { component: "detector", role: "detector", required: true },
    ],
    parameters: [
      { id: "lattice-potential", label: "Lattice Depth", quantity: "energy", unit: "eV", default: 8.0, minimum: 1.0, maximum: 20.0 },
      { id: "capsule-length", label: "Capsule Length", quantity: "length", unit: "nm", default: 3.0, minimum: 0.5, maximum: 8.0 },
    ],
  },
  concepts: ["bloch-theorem", "crystal-lattice", "energy-bands", "confinement"],
  equations: ["kronig-penney-model", "bragg-reflection"],
  educational_notes: "The periodic crystal lattice creates allowed energy bands and forbidden band gaps for propagating electron waves.",
};

export const defaultMachZehnderExperiment: QWMExperiment = {
  id: "mach-zehnder",
  name: "Mach-Zehnder Quantum Interferometer",
  short_description: "Split a single photon beam into two paths and recombine them to observe constructive and destructive phase interference.",
  scientific_question: "How does optical path length phase shift affect interference at the output detectors of a Mach-Zehnder interferometer?",
  goal: "Observe quantum superposition and phase-dependent interference between two beam paths.",
  steps: ["Split light with 50:50 beam splitter 1.", "Redirect both paths using optical mirrors.", "Recombine paths at beam splitter 2 and measure output detectors A & B."],
  what_to_watch: ["Phase shift changes constructive interference in Detector A.", "Destructive interference occurs when path phase shift is π radians.", "Total photon count remains conserved across both detectors."],
  expected_observation: "Changing the phase delay shifts the photon detection probability periodically between Detector A and Detector B.",
  difficulty: "intermediate",
  configuration: {
    environment: "optical-bench",
    components: [
      { component: "laser-source", role: "source", required: true },
      { component: "beam-splitter", role: "splitter", required: true },
      { component: "mirror", role: "mirror", required: true },
      { component: "phase-plate", role: "shifter", required: true },
      { component: "detector", role: "detector", required: true },
    ],
    parameters: [
      { id: "phase-shift", label: "Phase Shift (Δφ)", quantity: "angle", unit: "deg", default: 0, minimum: 0, maximum: 360 },
      { id: "splitter-ratio", label: "Splitter Ratio", quantity: "ratio", unit: "%", default: 50, minimum: 10, maximum: 90 },
    ],
  },
  concepts: ["quantum-superposition", "interferometry", "phase-shift", "wave-particle-duality"],
  equations: ["mach-zehnder-intensity", "photon-path-integral"],
  educational_notes: "Even if single photons are sent one at a time, each photon interferes with itself across both paths.",
};

export const defaultSternGerlachExperiment: QWMExperiment = {
  id: "stern-gerlach",
  name: "Stern-Gerlach Quantum Spin Quantization",
  short_description: "Pass magnetic dipole particles through an inhomogeneous magnetic field to observe spin splitting.",
  scientific_question: "Why does a magnetic dipole beam split into discrete spatial paths rather than a continuous distribution?",
  goal: "Demonstrate quantization of intrinsic angular momentum (quantum spin ħ/2).",
  steps: ["Emit silver atoms or electrons.", "Pass beam through inhomogeneous magnetic field gradient dB/dz.", "Measure spatial deflection on two discrete detector plates."],
  what_to_watch: ["Beam splits into two distinct beams (spin up +1/2 and spin down -1/2).", "No particles hit the middle center region.", "Increasing magnetic field gradient increases beam separation."],
  expected_observation: "The beam splits into exactly two discrete spots on the detector, proving quantum spin is quantized.",
  difficulty: "advanced",
  configuration: {
    environment: "vacuum-chamber",
    components: [
      { component: "atomic-source", role: "source", required: true },
      { component: "solenoid-magnet", role: "field", required: true },
      { component: "detector", role: "detector", required: true },
      { component: "riemann-sphere", role: "analyzer", required: true },
    ],
    parameters: [
      { id: "gradient-dBdz", label: "Field Gradient dB/dz", quantity: "gradient", unit: "T/m", default: 10, minimum: 1, maximum: 50 },
      { id: "beam-velocity", label: "Atom Velocity", quantity: "velocity", unit: "m/s", default: 500, minimum: 100, maximum: 2000 },
    ],
  },
  concepts: ["quantum-spin", "spatial-quantization", "magnetic-dipole", "pauli-matrices"],
  equations: ["spin-deflection-force", "zeeman-interaction"],
  educational_notes: "The Stern-Gerlach experiment historically proved that spatial orientation of quantum angular momentum is quantized.",
};

export const defaultPhotoelectricExperiment: QWMExperiment = {
  id: "photoelectric-effect",
  name: "Photoelectric Effect & Quantum Photons",
  short_description: "Shine monochromatic light onto a metal cathode and measure the stopping potential of ejected photoelectrons.",
  scientific_question: "Why does photoelectron kinetic energy depend on light frequency f rather than light intensity?",
  goal: "Prove Einstein's photon hypothesis E = hf - Φ and measure Planck's constant h.",
  steps: ["Select light wavelength λ (UV to Visible).", "Shine onto metal cathode plate inside vacuum phototube.", "Increase retarding voltage V until photocurrent drops to zero."],
  what_to_watch: ["Below threshold frequency f0, no electrons are emitted regardless of light intensity.", "Higher light frequency increases maximum kinetic energy (stopping voltage).", "Higher light intensity increases photoelectron current."],
  expected_observation: "Stopping potential vs frequency yields a straight line with slope equal to h/e.",
  difficulty: "intermediate",
  configuration: {
    environment: "vacuum-chamber",
    components: [
      { component: "laser-source", role: "source", required: true },
      { component: "vacuum-chamber", role: "phototube", required: true },
      { component: "electric-field", role: "voltage", required: true },
      { component: "detector", role: "ammeter", required: true },
    ],
    parameters: [
      { id: "photon-frequency", label: "Wavelength λ", quantity: "wavelength", unit: "nm", default: 350, minimum: 200, maximum: 700 },
      { id: "work-function", label: "Work Function (Φ)", quantity: "energy", unit: "eV", default: 2.3, minimum: 1.5, maximum: 5.0 },
      { id: "stopping-voltage", label: "Retarding Voltage (V)", quantity: "voltage", unit: "V", default: 1.2, minimum: 0, maximum: 10 },
    ],
  },
  concepts: ["photon-quanta", "work-function", "stopping-potential", "planck-constant"],
  equations: ["photoelectric-equation", "einstein-photon-energy"],
  educational_notes: "Light transfers energy in discrete quanta (photons). One photon ejects one electron if hf > Φ.",
};

export const defaultRutherfordExperiment: QWMExperiment = {
  id: "rutherford-scattering",
  name: "Rutherford Alpha Particle Scattering",
  short_description: "Fire energetic alpha particles at thin gold foil to observe nuclear Coulomb deflection angles.",
  scientific_question: "How does electrostatic Coulomb repulsion by a concentrated atomic nucleus scatter alpha particles at large angles?",
  goal: "Discover the dense atomic nucleus via high-angle particle scattering.",
  steps: ["Emit alpha particles (He²⁺) from radioactive source.", "Direct beam at ultra-thin gold foil target.", "Measure scattering angle distribution across 360° detector ring."],
  what_to_watch: ["Most alpha particles pass straight through gold foil with minimal deflection.", "A tiny fraction (1 in 8000) bounce backwards at angles > 90°.", "Backscattering proves positive atomic charge is concentrated in a tiny nucleus."],
  expected_observation: "Differential cross section scales as 1 / sin⁴(θ/2), characteristic of point Coulomb scattering.",
  difficulty: "intermediate",
  configuration: {
    environment: "vacuum-chamber",
    components: [
      { component: "atomic-source", role: "source", required: true },
      { component: "crystal-capsule", role: "target", required: true },
      { component: "detector", role: "scintillator", required: true },
    ],
    parameters: [
      { id: "alpha-energy", label: "Alpha Energy", quantity: "energy", unit: "MeV", default: 5.0, minimum: 1.0, maximum: 15.0 },
      { id: "target-Z", label: "Target Atomic Number (Z)", quantity: "number", unit: "Z", default: 79, minimum: 6, maximum: 82 },
    ],
  },
  concepts: ["atomic-nucleus", "coulomb-scattering", "rutherford-formula", "cross-section"],
  equations: ["rutherford-scattering-formula", "impact-parameter"],
  educational_notes: "Rutherford concluded that the atom is mostly empty space with almost all mass concentrated in a tiny nucleus.",
};

export function loadExperimentYaml(rawYaml: string): QWMExperiment | null {
  try {
    const doc = yaml.load(rawYaml) as QWMExperiment;
    if (doc && doc.id) {
      return doc;
    }
  } catch (err) {
    console.error("Failed to parse experiment YAML:", err);
  }
  return null;
}

