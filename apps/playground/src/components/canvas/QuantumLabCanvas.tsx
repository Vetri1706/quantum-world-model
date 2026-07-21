import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Sliders,
  Eye,
  Camera,
  Sun,
  Box,
  Layers,
  ChevronRight,
  Magnet,
  Grid3X3,
  Compass,
} from "lucide-react";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";
import {
  LaserSourceModel,
  ElectronSourceModel,
  NewtonsCradleGLBModel,
  CrystalCapsuleGLBModel,
  BunsenBurnerGLBModel,
  SolenoidMagnetGLBModel,
  RiemannSphereGLBModel,
  QuantumRingGLBModel,
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
  const updateEquipmentPosition = useQuantumLabStore((state) => state.updateEquipmentPosition);
  const selectedEquipmentId = useQuantumLabStore((state) => state.selectedEquipmentId);
  const setSelectedEquipment = useQuantumLabStore((state) => state.setSelectedEquipment);
  const removeEquipment = useQuantumLabStore((state) => state.removeEquipment);
  const activeExperiment = useQuantumLabStore((state) => state.activeExperiment);
  const physicsState = useQuantumLabStore((state) => state.physicsState);
  const updatePhysicsSimulation = useQuantumLabStore((state) => state.updatePhysicsSimulation);
  const updateInterferenceSimulation = useQuantumLabStore((state) => state.updateInterferenceSimulation);

  const [transformMode, setTransformMode] = useState<"select" | "move" | "rotate" | "scale">("move");
  const [shadingMode, setShadingMode] = useState<"solid" | "wireframe" | "rendered">("solid");

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

  // Global Keyboard Shortcuts (G: Move, R: Rotate, S: Scale, Del: Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "g" || e.key === "G") setTransformMode("move");
      if (e.key === "r" || e.key === "R") setTransformMode("rotate");
      if (e.key === "s" || e.key === "S") setTransformMode("scale");

      if ((e.key === "Delete" || e.key === "Backspace") && selectedEquipmentId) {
        e.preventDefault();
        removeEquipment(selectedEquipmentId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEquipmentId, removeEquipment]);

  const hasSource = installedEquipment.includes("electron-source") || installedEquipment.includes("laser-source");
  const hasBarrier = installedEquipment.includes("potential-barrier") || installedEquipment.includes("double-slit-mask") || installedEquipment.includes("crystal-capsule");
  const hasDetector = installedEquipment.includes("detector") || installedEquipment.includes("screen-detector") || installedEquipment.includes("riemann-sphere");

  const sourcePos = equipmentPositions["laser-source"] || equipmentPositions["electron-source"] || [-4.5, 0, 0];
  const detectorPos = equipmentPositions["detector"] || [4.2, 0, 0];
  const activeSelectedPos = selectedEquipmentId ? equipmentPositions[selectedEquipmentId] || [0, 0, 0] : [0, 0, 0];

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden font-sans select-none">
      {/* Blender Viewport Top Header Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-slate-900 border-b border-slate-800 text-slate-300 text-xs px-3 flex items-center justify-between z-20 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-bold text-[11px]">
            Object Mode
          </span>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <button className="hover:text-white transition-colors">View</button>
            <button className="hover:text-white transition-colors">Select</button>
            <button className="hover:text-white transition-colors">Add</button>
            <button className="hover:text-white transition-colors">Object</button>
          </div>
        </div>

        {/* Center Orientation & Snap Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
            <Compass className="w-3 h-3 text-orange-500" />
            <span>Global</span>
          </div>
          <button className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white">
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Shading Mode Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShadingMode("solid")}
            className={`p-1.5 rounded transition-all ${shadingMode === "solid" ? "bg-orange-500 text-white font-bold" : "text-slate-400 hover:text-white"}`}
            title="Solid Shading"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShadingMode("wireframe")}
            className={`p-1.5 rounded transition-all ${shadingMode === "wireframe" ? "bg-orange-500 text-white font-bold" : "text-slate-400 hover:text-white"}`}
            title="Wireframe Shading"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShadingMode("rendered")}
            className={`p-1.5 rounded transition-all ${shadingMode === "rendered" ? "bg-orange-500 text-white font-bold" : "text-slate-400 hover:text-white"}`}
            title="Rendered Shading"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Blender Left Vertical Tool Strip */}
      <div className="absolute top-11 left-3 z-20 flex flex-col gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setTransformMode("select")}
          className={`p-2 rounded-lg transition-all ${transformMode === "select" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          title="Select Box (W)"
        >
          <MousePointer className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTransformMode("move")}
          className={`p-2 rounded-lg transition-all ${transformMode === "move" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          title="Move / Translate (G)"
        >
          <Move className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTransformMode("rotate")}
          className={`p-2 rounded-lg transition-all ${transformMode === "rotate" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          title="Rotate (R)"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTransformMode("scale")}
          className={`p-2 rounded-lg transition-all ${transformMode === "scale" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          title="Scale (S)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Blender Right Outliner & Transform Inspector Panel */}
      <div 
        style={{ top: "220px" }}
        className="absolute left-3 z-20 w-64 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-3 text-slate-300 text-xs"
      >
        {/* Outliner Scene Collection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-[11px] text-slate-200 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              <span>Scene Collection</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono">View Layer</span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400 pl-1">
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <Camera className="w-3 h-3 text-slate-500" />
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 pl-1">
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <Sun className="w-3 h-3 text-yellow-500" />
              <span>Sun Light</span>
            </div>

            {/* Active installed objects list */}
            {installedEquipment.map((eqId) => {
              const isSelected = selectedEquipmentId === eqId;
              return (
                <div
                  key={eqId}
                  onClick={() => setSelectedEquipment(eqId)}
                  className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-all ${
                    isSelected
                      ? "bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Box className={`w-3 h-3 ${isSelected ? "text-orange-500" : "text-slate-400"}`} />
                  <span className="truncate">{eqId}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transform Inspector for Selected Object */}
        {selectedEquipmentId && (
          <div className="space-y-2 border-t border-slate-800 pt-2 font-mono">
            <div className="flex items-center justify-between font-bold text-[11px] text-slate-200">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-orange-500" />
                <span>Transform ({selectedEquipmentId})</span>
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-red-400 font-bold">X</span>
                <input
                  type="number"
                  step="0.1"
                  value={activeSelectedPos[0]}
                  onChange={(e) =>
                    updateEquipmentPosition(selectedEquipmentId, [
                      parseFloat(e.target.value) || 0,
                      activeSelectedPos[1],
                      activeSelectedPos[2],
                    ])
                  }
                  className="w-16 bg-transparent text-right text-slate-200 focus:outline-none"
                />
                <span className="text-slate-500 text-[10px]">m</span>
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-green-400 font-bold">Y</span>
                <input
                  type="number"
                  step="0.1"
                  value={activeSelectedPos[1]}
                  onChange={(e) =>
                    updateEquipmentPosition(selectedEquipmentId, [
                      activeSelectedPos[0],
                      parseFloat(e.target.value) || 0,
                      activeSelectedPos[2],
                    ])
                  }
                  className="w-16 bg-transparent text-right text-slate-200 focus:outline-none"
                />
                <span className="text-slate-500 text-[10px]">m</span>
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-blue-400 font-bold">Z</span>
                <input
                  type="number"
                  step="0.1"
                  value={activeSelectedPos[2]}
                  onChange={(e) =>
                    updateEquipmentPosition(selectedEquipmentId, [
                      activeSelectedPos[0],
                      activeSelectedPos[1],
                      parseFloat(e.target.value) || 0,
                    ])
                  }
                  className="w-16 bg-transparent text-right text-slate-200 focus:outline-none"
                />
                <span className="text-slate-500 text-[10px]">m</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Canvas
        camera={{ position: [0, 4.2, 11], fov: 42 }}
        gl={{ antialias: true }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedEquipment(null);
          }
        }}
      >
        <color attach="background" args={["#2c2c2c"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />

        {/* Camera Orbit Controls */}
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={25}
        />

        {/* Deselect Clickable Empty Space Floor Backdrop Plane */}
        <mesh
          name="backdrop-floor-plane"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          onPointerDown={(e) => {
            e.stopPropagation();
            setSelectedEquipment(null);
          }}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Blender Top-Right Navigation Orientation Axes Gizmo */}
        <GizmoHelper alignment="top-right" margin={[70, 70]}>
          <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="#ffffff" />
        </GizmoHelper>

        {/* Blender Viewport Dark Grid Floor */}
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={1}
          cellColor="#444444"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#555555"
          fadeDistance={30}
        />
        <ContactShadows opacity={0.5} scale={20} blur={2} far={10} resolution={256} color="#000000" />

        {/* Distinct 3D Emitter Sources */}
        <LaserSourceModel id="laser-source" isInstalled={installedEquipment.includes("laser-source") || installedEquipment.includes("laser")} />
        <ElectronSourceModel id="electron-source" isInstalled={installedEquipment.includes("electron-source") || installedEquipment.includes("electron-gun")} />

        {/* Optical & Interferometer Components */}
        <BeamSplitterModel id="beam-splitter" isInstalled={installedEquipment.includes("beam-splitter")} />
        <MirrorModel id="mirror" isInstalled={installedEquipment.includes("mirror")} />
        <DoubleSlitModel id="double-slit-mask" isInstalled={installedEquipment.includes("double-slit-mask") || installedEquipment.includes("double-slit")} />
        <ProjectionScreenModel id="projection-screen" isInstalled={installedEquipment.includes("projection-screen") || installedEquipment.includes("screen-detector")} />

        {/* Real GLB 3D Equipment Models */}
        <NewtonsCradleGLBModel id="newtons-cradle" isInstalled={installedEquipment.includes("newtons-cradle")} />
        <CrystalCapsuleGLBModel id="crystal-capsule" isInstalled={installedEquipment.includes("crystal-capsule")} />
        <SolenoidMagnetGLBModel id="solenoid-magnet" isInstalled={installedEquipment.includes("solenoid-magnet")} />
        <RiemannSphereGLBModel id="riemann-sphere" isInstalled={installedEquipment.includes("riemann-sphere") || installedEquipment.includes("spin-analyzer")} />
        <QuantumRingGLBModel id="quantum-ring" isInstalled={installedEquipment.includes("quantum-ring")} />
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
            luminanceThreshold={0.75}
            luminanceSmoothing={0.7}
            height={300}
            intensity={0.9}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
