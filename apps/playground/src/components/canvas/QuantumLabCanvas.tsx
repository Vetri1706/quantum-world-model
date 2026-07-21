// R3F 3D Canvas with OrbitControls, EffectComposer Bloom Pass, and Interactive Active Laboratory Beams & Telemetry

import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";
import {
  LaserSourceModel,
  ElectronSourceModel,
  AtomicSourceGLBModel,
  NewtonsCradleGLBModel,
  CrystalCapsuleGLBModel,
  BunsenBurnerGLBModel,
  NuclearReactorGLBModel,
  SolenoidMagnetGLBModel,
  RiemannSphereGLBModel,
  PotentialBarrierModel,
  DetectorModel,
  ChemistryBeakerModel,
  BeamSplitterModel,
  MirrorModel,
  DoubleSlitModel,
  ProjectionScreenModel,
} from "./EquipmentModels";
import { WavePacketMesh } from "./WavePacketMesh";
import { WaveInterferenceMesh } from "./WaveInterferenceMesh";
import { LabBeamEffects } from "./LabBeamEffects";

export const QuantumLabCanvas: React.FC = () => {
  const installedEquipment = useQuantumLabStore((state) => state.installedEquipment);
  const equipmentPositions = useQuantumLabStore((state) => state.equipmentPositions);
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const physicsState = useQuantumLabStore((state) => state.physicsState);
  const updatePhysicsSimulation = useQuantumLabStore((state) => state.updatePhysicsSimulation);
  const updateInterferenceSimulation = useQuantumLabStore((state) => state.updateInterferenceSimulation);

  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker physics simulation loop
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../workers/physicsWorker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "QUANTUM_TUNNELING_UPDATE") {
        updatePhysicsSimulation(payload.density, payload.xArr, payload.transmission);
      } else if (type === "INTERFERENCE_UPDATE") {
        updateInterferenceSimulation(payload.intensity);
      }
    };

    const interval = setInterval(() => {
      if (!workerRef.current) return;
      if (activeExperiment.id === "quantum-tunneling") {
        workerRef.current.postMessage({
          type: "STEP_QUANTUM_TUNNELING",
          params: {
            barrierHeight: physicsState.barrierHeight,
            barrierWidth: physicsState.barrierWidth,
            incidentEnergy: physicsState.incidentEnergy,
            particleMass: physicsState.particleMass,
          },
        });
      } else if (activeExperiment.id === "wave-interference") {
        workerRef.current.postMessage({
          type: "CALCULATE_INTERFERENCE",
          params: {
            wavelength: physicsState.wavelength,
            slitSeparation: physicsState.slitSeparation,
            slitWidth: physicsState.slitWidth,
            screenDistance: 5.0,
          },
        });
      }
    }, 40);

    return () => {
      clearInterval(interval);
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [
    activeExperiment.id,
    physicsState.barrierHeight,
    physicsState.barrierWidth,
    physicsState.incidentEnergy,
    physicsState.particleMass,
    physicsState.wavelength,
    physicsState.slitSeparation,
    physicsState.slitWidth,
  ]);

  const selectedEquipmentId = useQuantumLabStore((state) => state.selectedEquipmentId);
  const removeEquipment = useQuantumLabStore((state) => state.removeEquipment);

  // Global Blender-Style Keyboard Delete Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedEquipmentId) {
        e.preventDefault();
        removeEquipment(selectedEquipmentId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEquipmentId, removeEquipment]);

  const hasSource = installedEquipment.includes("electron-source") || installedEquipment.includes("laser-source") || installedEquipment.includes("atomic-source");
  const hasBarrier = installedEquipment.includes("potential-barrier") || installedEquipment.includes("double-slit-mask") || installedEquipment.includes("crystal-capsule") || installedEquipment.includes("nuclear-reactor");
  const hasDetector = installedEquipment.includes("detector") || installedEquipment.includes("screen-detector") || installedEquipment.includes("riemann-sphere");

  const sourcePos = equipmentPositions["laser-source"] || equipmentPositions["electron-source"] || equipmentPositions["atomic-source"] || [-4.5, 0, 0];
  const detectorPos = equipmentPositions["detector"] || [4.2, 0, 0];

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
      <Canvas
        camera={{ position: [0, 4.2, 11], fov: 42 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />
        <pointLight position={[-5, 5, 0]} intensity={2.5} color="#38bdf8" />
        <pointLight position={[0, 5, 0]} intensity={3.0} color="#a855f7" />
        <pointLight position={[4, 5, 0]} intensity={2.5} color="#22c55e" />

        {/* Camera Orbit Controls */}
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={25}
        />

        {/* Grid & Stage Floor */}
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#334155"
          fadeDistance={30}
        />
        <ContactShadows opacity={0.6} scale={20} blur={2} far={10} resolution={256} color="#000000" />

        {/* Distinct 3D Emitter Sources */}
        <LaserSourceModel id="laser-source" isInstalled={installedEquipment.includes("laser-source") || installedEquipment.includes("laser")} />
        <ElectronSourceModel id="electron-source" isInstalled={installedEquipment.includes("electron-source") || installedEquipment.includes("electron-gun")} />
        <AtomicSourceGLBModel id="atomic-source" isInstalled={installedEquipment.includes("atomic-source")} />

        {/* Optical & Interferometer Components */}
        <BeamSplitterModel id="beam-splitter" isInstalled={installedEquipment.includes("beam-splitter")} />
        <MirrorModel id="mirror" isInstalled={installedEquipment.includes("mirror")} />
        <DoubleSlitModel id="double-slit-mask" isInstalled={installedEquipment.includes("double-slit-mask") || installedEquipment.includes("double-slit")} />
        <ProjectionScreenModel id="projection-screen" isInstalled={installedEquipment.includes("projection-screen") || installedEquipment.includes("screen-detector")} />

        {/* Real GLB 3D Equipment Models */}
        <NewtonsCradleGLBModel id="newtons-cradle" isInstalled={installedEquipment.includes("newtons-cradle")} />
        <CrystalCapsuleGLBModel id="crystal-capsule" isInstalled={installedEquipment.includes("crystal-capsule")} />
        <NuclearReactorGLBModel id="nuclear-reactor" isInstalled={installedEquipment.includes("nuclear-reactor")} />
        <SolenoidMagnetGLBModel id="solenoid-magnet" isInstalled={installedEquipment.includes("solenoid-magnet")} />
        <RiemannSphereGLBModel id="riemann-sphere" isInstalled={installedEquipment.includes("riemann-sphere") || installedEquipment.includes("spin-analyzer")} />
        <BunsenBurnerGLBModel id="bunsen-burner" isInstalled={installedEquipment.includes("bunsen-burner")} />

        {/* Supporting Equipment */}
        <PotentialBarrierModel
          id="potential-barrier"
          isInstalled={installedEquipment.includes("potential-barrier")}
          height={physicsState.barrierHeight}
          width={physicsState.barrierWidth}
        />
        <DetectorModel id="detector" isInstalled={installedEquipment.includes("detector")} />
        <ChemistryBeakerModel id="beaker" isInstalled={installedEquipment.includes("beaker")} />

        {/* Active Volumetric Laser Beam Effects */}
        {hasSource && hasDetector && (
          <LabBeamEffects sourcePos={sourcePos} targetPos={detectorPos} />
        )}

        {/* Physics Visualization Wave Packet & Interference */}
        {hasSource && hasBarrier && hasDetector && (activeExperiment.id === "quantum-tunneling" || activeExperiment.id === "crystal-capsule") && (
          <WavePacketMesh
            densityArray={physicsState.densityArray}
            xArray={physicsState.xArray}
          />
        )}

        {hasSource && hasBarrier && hasDetector && activeExperiment.id === "wave-interference" && (
          <WaveInterferenceMesh intensityArray={physicsState.intensityArray} />
        )}

        {/* Postprocessing Bloom Pass for Glowing Emissive Materials */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            height={300}
            intensity={1.8}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
