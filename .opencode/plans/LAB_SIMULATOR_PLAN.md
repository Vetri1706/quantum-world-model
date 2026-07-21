# Quantum Lab Simulator - UI/UX & Physics Enhancement Plan

## Current State Analysis

**Tech Stack:**
- React 19 + TypeScript + Vite
- @react-three/fiber + @react-three/drei + @react-three/postprocessing
- Three.js r185
- Zustand for state management
- Framer Motion for UI animations
- Tailwind CSS (custom dark theme)
- Web Workers for physics (split-step Fourier for Schrödinger eq)

**Current 3D Models (7 GLB files in public/models/):**
- `atomic_models.glb` - Atomic model source
- `bunsen_burner.glb` - Chemistry burner
- `crystal_capsule.glb` - Crystal capsule
- `magnetic_field_of_solenoid_by_yuyalyj.glb` - Solenoid magnet
- `newtons_cradle.glb` - Newton's cradle (static, no animation)
- `pwr_nuclear_reactor.glb` - Nuclear reactor
- `riemann_sphere.glb` - Bloch sphere

**Equipment Registry:** 32 defined equipment types (mostly procedural SVG renderers, only 7 use GLB)

**Two Store Systems (inconsistent):**
- `useQuantumLabStore` - Quantum tunneling/interference focused
- `useLabStore` - Generic equipment instances with connections

**6 Screens:**
1. Screen1 - Natural language query
2. Screen2 - Concept briefing + equipment checklist
3. Screen3 - AI Builder (3-panel)
4. Screen4 - Mentor mistake analysis
5. Screen5 - Discovery recap
6. ScreenFreeSandbox - Pure 3D lab (most complete 3D experience)

---

## Phase 1: 3D Model Pipeline & Asset Strategy (Week 1)

### 1.1 Free Model Sources to Harvest
| Source | License | Target Models |
|--------|---------|---------------|
| **Sketchfab** (downloadable) | CC-BY / CC0 | Lab equipment, optical tables, detectors |
| **NASA 3D Resources** | Public Domain | Particle detectors, vacuum chambers |
| **CERN Open Data Portal** | CC0 | LHC detectors, calorimeters |
| **Poly Haven** | CC0 | HDRIs, lab environment assets |
| **GitHub (awesome-3d-assets)** | Various | Scientific equipment collections |
| **Thingiverse/Printables** | CC-BY | Lab hardware (mirrors, lenses, mounts) |
| **Kenney.nl** | CC0 | Low-poly sci-fi lab props |
| **Google Poly (archived)** | CC-BY | Basic geometric shapes |

### 1.2 Required Models by Category
| Category | Models Needed | Priority | Source Strategy |
|----------|---------------|----------|-----------------|
| **Quantum Sources** | Electron gun, Photon source, Laser diode, Wave packet emitter | HIGH | Sketchfab CC0 + procedural fallback |
| **Barriers/Slits** | Potential barrier (animatable), Double slit, Single slit, Crystal lattice | HIGH | Procedural Three.js + GLB for crystal |
| **Detectors** | CCD screen, Single-photon detector, Counter, Spectrometer | HIGH | NASA/CERN models + custom |
| **Optics** | Mirrors (flat/curved), Beam splitters (cube/plate), Lenses, Polarizers, Phase plates | HIGH | Procedural Three.js (parametric) |
| **Fields** | Electric field plates, Magnetic solenoid, Helmholtz coils | MEDIUM | Procedural + GLB for solenoid |
| **Environment** | Optical table (honeycomb), Vacuum chamber, Breadboard, Cable trays | HIGH | Poly Haven + custom |
| **Classical** | Newton's cradle (ANIMATED), Pendulum, Spring-mass, Gyroscope | HIGH | Animate existing GLB + new |
| **Chemistry** | Bunsen burner (animated flame), Beakers, Flasks, Hot plate | MEDIUM | Animate existing + Sketchfab |
| **Analysis** | Oscilloscope, Spectrum analyzer, Bloch sphere (3D), Histogram | MEDIUM | Custom Three.js |

### 1.3 Model Pipeline Setup
```
public/models/
├── sources/           # Raw downloads (gitignored large files)
├── processed/         # GLTF/GLB optimized (draco compressed)
├── procedural/        # Generated at runtime (no files)
└── metadata.json      # Model registry: {id, path, credits, license, animations[]}
```

**Optimization Pipeline:**
1. Download → Blender (decimate, center pivot, apply scale)
2. `gltf-pipeline` (Draco compression, texture resize to 1024px max)
3. Generate metadata.json with attribution
4. Preload via `useGLTF.preload()` in EquipmentModels.tsx

---

## Phase 2: Core 3D Lab Architecture (Week 2)

### 2.1 Unified Lab Store (Merge Two Stores)
```typescript
interface UnifiedLabStore {
  // Experiment management
  activeExperiment: ExperimentId | null;
  availableExperiments: Experiment[];
  
  // 3D Scene
  sceneEntities: Map<string, LabEntity>;
  selectedEntityIds: string[];
  connections: Connection[];
  
  // Physics simulation
  simulationState: SimulationState;
  isSimulating: boolean;
  simulationSpeed: number;
  
  // UI State
  viewport: ViewportState;
  activePanel: 'library' | 'inspector' | 'results' | 'ai';
  
  // Equipment library
  equipmentDefinitions: EquipmentDefinition[];
}
```

### 2.2 Lab Entity System (ECS-lite)
```typescript
interface LabEntity {
  id: string;
  definitionId: string;
  transform: Transform3D;
  physicsBody?: PhysicsBody;
  animationState?: AnimationState;
  parameters: Record<string, any>;
  ports: PortState[];
  metadata: EntityMetadata;
}

interface Transform3D {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
```

### 2.3 Equipment Definition Enhancement
```typescript
interface EquipmentDefinition {
  // ... existing fields
  model: {
    type: 'gltf' | 'procedural' | 'hybrid';
    path?: string;
    proceduralGenerator?: string;
    animations?: ModelAnimation[];
    scaleReference: number;
  };
  physics?: {
    bodyType: 'static' | 'dynamic' | 'kinematic';
    mass?: number;
    collisionShape: 'box' | 'cylinder' | 'sphere' | 'convex' | 'trimesh';
    constraints?: ConstraintDef[];
  };
  animation?: {
    autoPlay: string[];
    triggerMap: Record<string, string>;
  };
  visualEffects?: VisualEffectDef[];
}
```

---

## Phase 3: Physics & Animation Systems (Week 3)

### 3.1 Physics Engine Integration (Rapier.js via WASM)
```bash
npm install @dimforge/rapier3d-compat
```

**Physics Bodies per Equipment:**
| Equipment | Body Type | Constraints | Notes |
|-----------|-----------|-------------|-------|
| Newton's Cradle balls | Dynamic | DistanceConstraint (rod) | 5 balls, elastic collisions |
| Pendulum | Dynamic | RevoluteConstraint (pivot) | Damping configurable |
| Spring-mass | Dynamic | SpringConstraint | Hooke's law |
| Optical table | Static | - | Infinite mass |
| Mirrors/lenses on mounts | Kinematic | - | User-positioned |
| Particles (electrons/photons) | Kinematic | - | Custom trajectory, not RigidBody |

### 3.2 Animation System (Three.js AnimationMixer + Custom)
```typescript
const AnimatedGLTFModel: React.FC<{
  path: string;
  animations?: string[];
  onAnimationComplete?: (name: string) => void;
  playbackSpeed?: number;
}> = ({ path, animations = [], ... }) => {
  const { scene, animations: clips } = useGLTF(path);
  const mixerRef = useRef<AnimationMixer>();
  const actionsRef = useRef<Map<string, AnimationAction>>(new Map());
  
  useFrame((state, delta) => {
    mixerRef.current?.update(delta);
  });
  
  useEffect(() => {
    animations.forEach(name => {
      const clip = clips.find(c => c.name === name);
      if (clip) {
        const action = mixerRef.current!.clipAction(clip);
        action.play();
        actionsRef.current.set(name, action);
      }
    });
  }, [animations]);
  
  const setAnimationWeight = (name: string, weight: number) => {
    actionsRef.current.get(name)?.setEffectiveWeight(weight);
  };
  
  return <primitive object={scene} dispose={null} />;
};
```

### 3.3 Specific Physics Simulations

**Newton's Cradle (Real Physics):**
```typescript
// 5 balls, each: sphere radius 0.025m, mass 0.1kg
// Rod length: 0.3m, angle limit: ±60°
// Coefficient of restitution: 0.99
// Constraint: DistanceConstraint(ball[i], pivot[i], rodLength)
```

**Double Pendulum (Chaos Demo):**
```typescript
// Two linked pendulums, configurable lengths/masses
// Real-time Lagrangian integration
```

**Wave Packet Evolution (Existing - enhance):**
- Keep split-step Fourier in worker
- Add 3D visualization: |ψ|² as volumetric density
- Add phase visualization (color hue)

**Particle Trajectories in Fields:**
```typescript
// Lorentz force: F = q(E + v × B)
// Integrate with RK4 in worker
// Render as animated particle trails
```

---

## Phase 4: Equipment Interaction & Connections (Week 4)

### 4.1 Port-Based Connection System
```typescript
<Connection 
  from={portA.worldPosition} 
  to={portB.worldPosition}
  type="beam" | "signal" | "cable"
  animated={isSimulating}
/>

const canConnect = (outPort: PortDef, inPort: PortDef) => 
  outPort.kind === inPort.kind && outPort.type === 'output' && inPort.type === 'input';
```

### 4.2 Drag-and-Drop from Library → 3D Scene
```typescript
// EquipmentLibrary.tsx
const onDragStart = (e, defId) => {
  e.dataTransfer.setData('application/lab-equipment', defId);
  // Show ghost preview on canvas
};

// QuantumLabCanvas.tsx - Drop zone
const onDrop = (e) => {
  const defId = e.dataTransfer.getData('application/lab-equipment');
  const position = getDropPosition(e); // Raycast to grid
  addEntity(defId, position);
};
```

### 4.3 Snap-to-Grid & Alignment
- Optical bench grid: 25mm spacing (configurable)
- Snap guides: Show alignment lines to nearby equipment
- Port snapping: Auto-connect when ports are near

---

## Phase 5: Visual Polish & Lab Atmosphere (Week 5)

### 5.1 Environment & Lighting
```typescript
<Environment 
  preset="warehouse" 
  background={false} 
/>
<HDRI 
  url="/hdri/lab_01.hdr"
  intensity={1.2}
/>

<LabLighting>
  <AmbientLight intensity={0.3} />
  <DirectionalLight position={[5, 10, 5]} intensity={2} castShadow />
  <SpotLight position={[0, 3, 0]} angle={Math.PI/6} penumbra={0.5} />
</LabLighting>

// Optical table with honeycomb pattern
<OpticalTable size={[2, 1.5]} holeSpacing={0.025} />
```

### 5.2 Post-Processing Stack
```typescript
<EffectComposer>
  <RenderPass />
  <BloomPass 
    strength={1.5} 
    radius={0.5} 
    threshold={0.8}
    luminanceThreshold={0.9}
  />
  <BokehPass focus={0.5} aperture={0.01} maxblur={0.01} />
  <ChromaticAberrationPass offset={[0.001, 0.001]} />
  <VignettePass darkness={0.3} />
  <NoisePass opacity={0.02} />
</EffectComposer>
```

### 5.3 Visual Effects per Equipment
| Equipment | Effect | Implementation |
|-----------|--------|----------------|
| Laser | Coherent beam + dust scattering | Volumetric light shaft (raymarch) |
| Electron gun | Particle stream + glow | GPU particles (Points + shader) |
| Detector hit | Flash + ripple | Expanding ring shader |
| Magnetic field | Field lines | Animated curve tubes |
| Electric field | Equipotential lines | Computed shader |
| Plasma (fusion) | Volume emission | 3D noise texture + raymarch |

---

## Phase 6: Free Sandbox Mode Enhancement (Week 6)

### 6.1 Unified Equipment Palette
```typescript
const equipmentCategories = {
  'Quantum Sources': ['electron-gun', 'photon-source', 'laser', 'wavepacket-gen'],
  'Barriers & Slits': ['potential-barrier', 'potential-well', 'double-slit', 'crystal-lattice'],
  'Optics': ['mirror', 'beam-splitter', 'lens', 'polarizer', 'phase-plate'],
  'Detectors': ['detector', 'screen', 'counter', 'spectrometer'],
  'Fields': ['e-field-plates', 'magnetic-solenoid', 'helmholtz-coil'],
  'Environment': ['vacuum-chamber', 'optical-table', 'breadboard'],
  'Classical Mechanics': ['newtons-cradle', 'pendulum', 'spring-mass', 'gyroscope'],
  'Chemistry': ['bunsen-burner', 'beaker', 'flask', 'hot-plate'],
  'Analysis': ['oscilloscope', 'bloch-sphere', 'histogram', 'probability-plot'],
};
```

### 6.2 Experiment Presets (One-Click Setup)
```typescript
const experimentPresets = {
  'quantum-tunneling': {
    name: 'Quantum Tunneling',
    entities: [
      { def: 'electron-gun', pos: [-2, 0, 0], params: { energy: 5 } },
      { def: 'potential-barrier', pos: [0, 0, 0], params: { height: 10, width: 1 } },
      { def: 'detector', pos: [2, 0, 0] },
      { def: 'probability-plot', pos: [0, 2, -1] },
    ],
    connections: [
      { from: 'electron-gun.out', to: 'potential-barrier.in' },
      { from: 'potential-barrier.out', to: 'detector.in' },
      { from: 'detector.signal', to: 'probability-plot.in' },
    ],
  },
  'double-slit': { ... },
  'newtons-cradle': { ... },
  'magnetic-bottle': { ... },
};
```

---

## Phase 7: AI Integration & Smart Features (Week 7)

### 7.1 AI Mentor with Visual Grounding
- AI can reference specific equipment by ID
- AI suggests equipment placement
- AI explains physics in context of current setup

### 7.2 Smart Auto-Wiring
```typescript
const autoWire = (entities: LabEntity[]) => {
  // Topological sort by signal flow
  // Connect compatible ports automatically
  // Avoid crossing wires
};
```

### 7.3 Natural Language → Lab Setup
```
"I want to see electron interference"
→ AI selects: electron-gun + double-slit + detector + probability-plot
→ Positions them optimally
→ Sets default parameters
→ Starts simulation
```

---

## Free Model Acquisition Checklist

### Priority 1 - Core Quantum Lab (Need 15+ models)
- [ ] Electron gun (thermionic emission style)
- [ ] Photon source / single-photon emitter
- [ ] Laser diode module
- [ ] Wave packet generator (abstract)
- [ ] Potential barrier (procedural preferred)
- [ ] Double slit mask (procedural)
- [ ] Crystal lattice (existing GLB OK)
- [ ] CCD detector / phosphor screen
- [ ] Single-photon avalanche diode (SPAD)
- [ ] Particle counter
- [ ] Spectrometer / energy analyzer

### Priority 2 - Optical Components (Procedural mostly)
- [ ] Flat mirror (procedural)
- [ ] Curved mirror (procedural)
- [ ] Beam splitter cube (procedural)
- [ ] Lens elements (procedural)
- [ ] Polarizer (procedural)
- [ ] Quarter/half wave plate (procedural)
- [ ] Optical fiber (procedural curve)

### Priority 3 - Classical Mechanics (Need Animation)
- [ ] Newton's cradle - **ANIMATE EXISTING GLB** (5 pendulums with constraints)
- [ ] Simple pendulum
- [ ] Double pendulum
- [ ] Spring-mass system
- [ ] Torsion balance
- [ ] Gyroscope

### Priority 4 - Environment & Fields
- [ ] Optical table with M6 holes (procedural grid)
- [ ] Vacuum chamber (cylindrical with flanges)
- [ ] Magnetic solenoid (existing GLB OK, add field viz)
- [ ] Helmholtz coil pair
- [ ] Parallel plate capacitor (procedural)
- [ ] Cable raceways

### Priority 5 - Chemistry (Existing OK)
- [ ] Bunsen burner - **ADD FLAME ANIMATION** to existing GLB
- [ ] Beaker/flask (existing OK)
- [ ] Hot plate stirrer

---

## Implementation Order (Dependencies)

```
Week 1: Asset Pipeline + Model Acquisition
  ↓
Week 2: Unified Store + Entity System (foundation)
  ↓
Week 3: Physics Engine (Rapier) + Animation System
  ↓
Week 4: Equipment Interaction (Drag-drop, connections, snap)
  ↓
Week 5: Visual Polish (Environment, lighting, post-FX, effects)
  ↓
Week 6: Sandbox Mode + Presets + Equipment Library Sync
  ↓
Week 7: AI Integration + Smart Features
```

---

## Key Files to Modify/Create

### New Files
```
/src/
├── store/
│   └── useUnifiedLabStore.ts          # Single store replacing both
├── physics/
│   ├── RapierPhysics.ts               # Rapier integration
│   ├── physicsSimulations/            # Per-equation sims
│   │   ├── newtonsCradle.ts
│   │   ├── wavePacket.ts              # Enhance existing
│   │   ├── particleInFields.ts
│   │   └── doublePendulum.ts
│   └── usePhysicsLoop.ts              # React hook for fixed timestep
├── entities/
│   ├── LabEntity.tsx                  # Base entity component
│   ├── EntityFactory.ts               # Create from definition
│   └── equipment/                     # One per equipment type
│       ├── ElectronGunEntity.tsx
│       ├── NewtonsCradleEntity.tsx
│       ├── LaserEntity.tsx
│       └── ...
├── canvas/
│   ├── LabCanvas.tsx                  # Main canvas (replace QuantumLabCanvas)
│   ├── LabEnvironment.tsx             # HDRI, table, lighting
│   ├── ConnectionRenderer.tsx         # Bezier curves between ports
│   ├── GridSnapOverlay.tsx            # Visual grid + snap guides
│   └── DropZone.tsx                   # Handle library drops
├── components/
│   ├── EquipmentPalette.tsx           # Unified library (replace EquipmentLibrary)
│   ├── EntityInspector.tsx            # Unified inspector
│   ├── ExperimentPresets.tsx          # One-click setups
│   └── SimulationControls.tsx         # Play/pause/speed/step
├── effects/
│   ├── LaserBeam.tsx                  # Volumetric beam
│   ├── ParticleStream.tsx             # GPU particles
│   ├── FieldLines.tsx                 # Magnetic/electric viz
│   └── DetectorFlash.tsx              # Hit effects
└── data/
    ├── equipmentRegistryV2.ts         # Enhanced definitions
    ├── experimentPresets.ts
    └── modelMetadata.json             # Credits, licenses
```

### Modified Files
- `src/store/useQuantumLabStore.ts` → Deprecate, migrate to unified
- `src/store/useLabStore.ts` → Deprecate
- `src/components/canvas/EquipmentModels.tsx` → Refactor to use EntityFactory
- `src/components/screens/ScreenFreeSandbox.tsx` → Major overhaul
- `src/components/screens/Screen3Playground.tsx` → Sync with unified store

---

## Success Criteria

1. **Visual Quality**: Looks like a professional lab simulator (Blender/Unity quality)
2. **Physics Accuracy**: Newton's cradle conserves momentum/energy to <1% error
3. **Responsiveness**: 60fps with 50+ entities, physics at 120Hz fixed timestep
4. **Extensibility**: Add new equipment in <30 min (definition + optional GLB)
5. **Free Assets**: All models CC0/CC-BY with proper attribution
6. **Unified UX**: Single equipment library works in both AI Builder and Free Sandbox
7. **Animation**: All moving parts animate (pendulums swing, beams pulse, particles flow)
8. **Connections**: Visual wiring with signal flow animation during simulation

---

## Budget: $0 (All Free Assets)

| Resource | Cost | Source |
|----------|------|--------|
| 3D Models | $0 | Sketchfab CC0, NASA, CERN, Poly Haven, Kenney, Thingiverse |
| HDRI Environments | $0 | Poly Haven (lab_01, warehouse_01) |
| Textures | $0 | AmbientCG, Poly Haven |
| Physics Engine | $0 | Rapier.js (MIT) |
| Post-processing | $0 | @react-three/postprocessing (MIT) |
| Icons/UI | $0 | Lucide React (ISC) |

---

## Clarifying Questions for User

1. **Physics Scope**: Should classical mechanics (pendulums, springs, collisions) be as physically accurate as quantum simulations, or is visual plausibility sufficient?

2. **Model Priority**: Which 3-5 experiments are most important to nail first? (Quantum tunneling, Double slit, Newton's cradle, Magnetic bottle, Crystal lattice?)

3. **AI Integration Depth**: Should the AI mentor be able to *modify* the 3D scene directly (add/remove equipment, change params), or just provide text guidance?

4. **Target Devices**: Desktop only, or should mobile/tablet be considered? (Affects UI density, touch controls)

5. **Multi-user/Collaboration**: Is real-time collaboration a future goal? (Affects state architecture)

6. **Data Export**: Should simulation results be exportable (CSV, plots, video capture)?

7. **Accessibility**: Color-blind safe palettes, keyboard navigation, screen reader support needed?