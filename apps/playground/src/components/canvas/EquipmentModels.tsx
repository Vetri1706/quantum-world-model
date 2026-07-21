// 3D Equipment Components with Automatic Scale Normalization & Clean 3D Typography (Uncluttered)

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Text, PivotControls, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useQuantumLabStore } from "../../store/useQuantumLabStore";

type EquipmentProps = {
  id: string;
  isInstalled: boolean;
  defaultPos?: [number, number, number];
};

export class EquipmentErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("3D Equipment GLB load issue, falling back to 3D procedural rendering:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const SHARED_OUTLINE_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#f97316",
  wireframe: true,
  transparent: true,
  opacity: 0.85,
  depthTest: true,
});

const ModelGeometryOutline: React.FC<{ targetGroupRef: React.RefObject<THREE.Group | null> }> = ({ targetGroupRef }) => {
  const [wireframeGroup, setWireframeGroup] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!targetGroupRef.current) return;
    const originalGroup = targetGroupRef.current;

    const createOutlineGroup = () => {
      const container = new THREE.Group();

      originalGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // Filter out Text labels and gizmo meshes to prevent floating label boxes
          if (
            mesh.geometry &&
            mesh.type !== "Text" &&
            !mesh.name?.includes("Text") &&
            !mesh.name?.includes("gizmo") &&
            mesh.parent?.type !== "Text"
          ) {
            // Share geometry directly without cloning to preserve 60 FPS performance
            const wireframeMesh = new THREE.Mesh(mesh.geometry, SHARED_OUTLINE_MATERIAL);

            const worldPos = new THREE.Vector3();
            const worldQuaternion = new THREE.Quaternion();
            const worldScale = new THREE.Vector3();

            mesh.getWorldPosition(worldPos);
            mesh.getWorldQuaternion(worldQuaternion);
            mesh.getWorldScale(worldScale);

            wireframeMesh.position.copy(worldPos);
            wireframeMesh.quaternion.copy(worldQuaternion);
            wireframeMesh.scale.copy(worldScale).multiplyScalar(1.012);

            originalGroup.worldToLocal(wireframeMesh.position);

            container.add(wireframeMesh);
          }
        }
      });

      setWireframeGroup(container);
    };

    createOutlineGroup();
    const timer = setTimeout(createOutlineGroup, 80);
    return () => clearTimeout(timer);
  }, [targetGroupRef]);

  if (!wireframeGroup) return null;

  return <primitive object={wireframeGroup} />;
};

export const DraggableEquipment: React.FC<{
  id: string;
  defaultPos: [number, number, number];
  children: React.ReactNode;
}> = ({ id, defaultPos, children }) => {
  const equipmentPositions = useQuantumLabStore((state) => state.equipmentPositions);
  const updateEquipmentPosition = useQuantumLabStore((state) => state.updateEquipmentPosition);
  const selectedEquipmentId = useQuantumLabStore((state) => state.selectedEquipmentId);
  const setSelectedEquipment = useQuantumLabStore((state) => state.setSelectedEquipment);

  const groupRef = useRef<THREE.Group | null>(null);
  const pos = equipmentPositions[id] || defaultPos;
  const isSelected = selectedEquipmentId === id;

  return (
    <PivotControls
      anchor={[0, 0, 0]}
      depthTest={false}
      lineWidth={2}
      axisColors={["#38bdf8", "#22c55e", "#a855f7"]}
      activeAxes={[true, false, true]} // Drag horizontally along 3D stage floor (X & Z axes)
      scale={0.75}
      onDragStart={() => setSelectedEquipment(id)}
      onDrag={(_, __, wMatrix) => {
        const x = wMatrix.elements[12];
        const z = wMatrix.elements[14];
        updateEquipmentPosition(id, [x, 0, z]);
      }}
    >
      <group
        ref={groupRef}
        position={pos}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEquipment(id);
        }}
      >
        {children}

        {/* Blender-Style Active Object Highlight on Actual Hierarchy Geometries */}
        {isSelected && <ModelGeometryOutline targetGroupRef={groupRef} />}
      </group>
    </PivotControls>
  );
};

// Normalized GLTF primitive loader wrapper using Three.js Box3 bounding box math
const GLTFModelNormalized: React.FC<{
  path: string;
  targetSize?: number;
}> = ({ path, targetSize = 1.4 }) => {
  const { scene } = useGLTF(path);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Enhance glTF materials (boost emissive colors, fix opacity & black base colors)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat: any) => {
            if (mat.emissive) {
              mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 1, 4.5);
              if (mat.color && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05) {
                mat.color.copy(mat.emissive);
              }
            }
            mat.transparent = true;
            mat.opacity = Math.max(mat.opacity || 1, 0.85);
            mat.side = THREE.DoubleSide;
            mat.depthWrite = true;
            mat.needsUpdate = true;
          });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = targetSize / maxDim;
      clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    const updatedBox = new THREE.Box3().setFromObject(clone);
    clone.position.y -= updatedBox.min.y;

    return clone;
  }, [scene, targetSize]);

  return <primitive object={clonedScene} />;
};

const AnimatedGLTFModelNormalized: React.FC<{
  path: string;
  targetSize?: number;
  animationNames?: string[];
  playbackSpeed?: number;
}> = ({ path, targetSize = 1.4, animationNames, playbackSpeed = 1.0 }) => {
  const { scene, animations } = useGLTF(path);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Track mesh index for assigning gradient colors to unlit black models
    let meshIndex = 0;
    const totalMeshes = { count: 0 };
    clone.traverse((c) => { if ((c as THREE.Mesh).isMesh) totalMeshes.count++; });

    // Enhance glTF materials (boost emissive colors, fix opacity & black base colors)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const newMaterials = materials.map((mat: any) => {
            const isBlackBase = mat.color && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05;
            const isVeryTransparent = mat.opacity !== undefined && mat.opacity < 0.25;
            const isMeshBasic = mat.isMeshBasicMaterial === true;

            // KHR_materials_unlit creates MeshBasicMaterial — emissive data is LOST.
            // Detect: black MeshBasicMaterial with near-zero opacity = broken unlit emissive.
            // Also detect MeshStandardMaterial with emissive (non-unlit models).
            const hasEmissive = mat.emissive && (mat.emissive.r > 0.01 || mat.emissive.g > 0.01 || mat.emissive.b > 0.01);

            if (hasEmissive && isBlackBase) {
              // MeshStandardMaterial with emissive — use emissive as base color
              const emColor = mat.emissive.clone();
              const boostedAlpha = Math.max(mat.opacity || 1, 0.4);
              meshIndex++;
              return new THREE.MeshBasicMaterial({
                color: emColor,
                transparent: true,
                opacity: boostedAlpha,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
              });
            }

            if (isMeshBasic && isBlackBase && (isVeryTransparent || mat.opacity < 0.5)) {
              // KHR_materials_unlit with black base + low alpha = emissive data was lost.
              // Assign bright neon rainbow color based on mesh index in the model.
              const t = totalMeshes.count > 1 ? meshIndex / (totalMeshes.count - 1) : 0.5;
              const hue = t * 0.85; // 0 = red/pink → 0.85 = violet, full rainbow sweep
              const neonColor = new THREE.Color().setHSL(hue, 1.0, 0.55);
              const boostedAlpha = Math.max(mat.opacity, 0.3) + 0.25;
              meshIndex++;
              return new THREE.MeshBasicMaterial({
                color: neonColor,
                transparent: true,
                opacity: Math.min(boostedAlpha, 0.8),
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
              });
            }

            meshIndex++;

            // Standard material enhancement for other models
            if (mat.emissive) {
              mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 1, 4.5);
              if (isBlackBase) {
                mat.color.copy(mat.emissive);
              }
            }
            mat.transparent = true;
            mat.opacity = Math.max(mat.opacity || 1, 0.85);
            mat.side = THREE.DoubleSide;
            mat.depthWrite = true;
            mat.needsUpdate = true;
            return mat;
          });
          mesh.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = targetSize / maxDim;
      clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    const updatedBox = new THREE.Box3().setFromObject(clone);
    clone.position.y -= updatedBox.min.y;
    return clone;
  }, [scene, targetSize]);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!clonedScene || !animations || animations.length === 0) return;

    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const clipsToPlay = animationNames?.length
      ? animations.filter((clip) => animationNames.includes(clip.name))
      : animations;

    clipsToPlay.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      action.timeScale = playbackSpeed;
    });

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [clonedScene, animations, animationNames, playbackSpeed]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <primitive object={clonedScene} />;
};

export const LaserSourceModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [-4.5, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 1.4, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.7, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.28, 0.1, 32]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3.0} />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.22} color="#38bdf8" anchorX="center" anchorY="bottom">
        Laser Source (500nm)
      </Text>
    </DraggableEquipment>
  );
};

export const ElectronSourceModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [-4.5, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.3, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.45, 0.55, 1.2, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.3, 0.4, 32]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} />
      </mesh>
      <Text position={[0, 1.4, 0]} fontSize={0.22} color="#38bdf8" anchorX="center" anchorY="bottom">
        Electron Source Gun
      </Text>
    </DraggableEquipment>
  );
};

export const BeamSplitterModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [-1.5, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      {/* Base Mount */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.2, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Optical Glass Cube */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.6} transparent roughness={0.05} ior={1.52} />
      </mesh>
      {/* Diagonal Splitter Plane */}
      <mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <planeGeometry args={[1.1, 0.78]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.22} color="#38bdf8" anchorX="center" anchorY="bottom">
        50:50 Beam Splitter
      </Text>
    </DraggableEquipment>
  );
};

export const MirrorModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [-1.5, 0, -1.5] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.2, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Mirror Housing Ring */}
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.1, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Polished Reflective Surface */}
      <mesh position={[0, 0.5, 0.06]} rotation={[0, Math.PI / 4, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.05} emissive="#e2e8f0" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.22} color="#94a3b8" anchorX="center" anchorY="bottom">
        Optical Mirror
      </Text>
    </DraggableEquipment>
  );
};

export const DoubleSlitModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [0, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[1.0, 0.2, 0.6]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Anodized Plate */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.1, 1.4, 1.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Dual Illuminated Slit Lines */}
      <mesh position={[0.06, 0.6, -0.2]}>
        <boxGeometry args={[0.02, 1.0, 0.05]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={4.0} />
      </mesh>
      <mesh position={[0.06, 0.6, 0.2]}>
        <boxGeometry args={[0.02, 1.0, 0.05]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={4.0} />
      </mesh>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#a855f7" anchorX="center" anchorY="bottom">
        Double-Slit Plate
      </Text>
    </DraggableEquipment>
  );
};

export const ProjectionScreenModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [4.2, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      {/* Curved Screen Support */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.15, 1.8, 2.2]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      {/* Phosphor Glowing Detection Screen */}
      <mesh position={[-0.1, 0.8, 0]}>
        <planeGeometry args={[2.0, 1.6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} roughness={0.1} />
      </mesh>
      <Text position={[0, 1.9, 0]} fontSize={0.22} color="#22c55e" anchorX="center" anchorY="bottom">
        Interference Screen
      </Text>
    </DraggableEquipment>
  );
};

// Real GLB Models Loaders with Clean Typography
export const AtomicSourceGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [-4.5, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <Suspense fallback={
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1.4, 32]} />
          <meshStandardMaterial color="#38bdf8" wireframe />
        </mesh>
      }>
        <GLTFModelNormalized path="/models/atomic_models.glb" targetSize={2.4} />
      </Suspense>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#38bdf8" anchorX="center" anchorY="bottom">
        Atomic Model Source
      </Text>
    </DraggableEquipment>
  );
};

export const PhysicsNewtonsCradle3D: React.FC = () => {
  const ball1Ref = useRef<THREE.Group>(null);
  const ball5Ref = useRef<THREE.Group>(null);
  const impactGlowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 4.5;
    const cycle = Math.sin(time);

    // Left ball swings out when cycle > 0
    if (cycle > 0) {
      const angle = Math.sin(time) * 0.55;
      if (ball1Ref.current) ball1Ref.current.rotation.z = angle;
      if (ball5Ref.current) ball5Ref.current.rotation.z = 0;
    } else {
      // Right ball swings out when cycle < 0
      const angle = Math.sin(time) * 0.55;
      if (ball1Ref.current) ball1Ref.current.rotation.z = 0;
      if (ball5Ref.current) ball5Ref.current.rotation.z = angle;
    }

    // Impact flash ring when ball strikes center
    if (impactGlowRef.current) {
      const isImpacting = Math.abs(cycle) < 0.15;
      impactGlowRef.current.scale.setScalar(isImpacting ? 1.4 : 0.01);
    }
  });

  const ballSpacing = 0.22;
  const pivotY = 1.2;
  const stringLen = 1.0;

  return (
    <group position={[0, 0, 0]}>
      {/* Frame Base & Support Rods */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.6, 0.1, 0.9]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Chrome Arch Pillars */}
      <mesh position={[-0.7, 0.65, -0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.1} />
      </mesh>
      <mesh position={[-0.7, 0.65, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.1} />
      </mesh>
      <mesh position={[0.7, 0.65, -0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.1} />
      </mesh>
      <mesh position={[0.7, 0.65, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.1} />
      </mesh>

      {/* Top Crossbars */}
      <mesh position={[0, 1.25, -0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.45, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.25, 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.45, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1.0} roughness={0.1} />
      </mesh>

      {/* Center Impact Flash Ring */}
      <mesh ref={impactGlowRef} position={[0, pivotY - stringLen, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} transparent opacity={0.5} />
      </mesh>

      {/* 5 Pendulum Balls */}
      {/* Ball 1 (Far Left - Animated) */}
      <group ref={ball1Ref} position={[-2 * ballSpacing, pivotY, 0]}>
        <mesh position={[0, -stringLen / 2, -0.35]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen / 2, 0.35]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen, 0]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
        </mesh>
      </group>

      {/* Ball 2 (Middle Left - Stationary) */}
      <group position={[-1 * ballSpacing, pivotY, 0]}>
        <mesh position={[0, -stringLen / 2, -0.35]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen / 2, 0.35]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen, 0]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
        </mesh>
      </group>

      {/* Ball 3 (Center - Stationary) */}
      <group position={[0, pivotY, 0]}>
        <mesh position={[0, -stringLen / 2, -0.35]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen / 2, 0.35]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen, 0]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
        </mesh>
      </group>

      {/* Ball 4 (Middle Right - Stationary) */}
      <group position={[1 * ballSpacing, pivotY, 0]}>
        <mesh position={[0, -stringLen / 2, -0.35]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen / 2, 0.35]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen, 0]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
        </mesh>
      </group>

      {/* Ball 5 (Far Right - Animated) */}
      <group ref={ball5Ref} position={[2 * ballSpacing, pivotY, 0]}>
        <mesh position={[0, -stringLen / 2, -0.35]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen / 2, 0.35]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, stringLen, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -stringLen, 0]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
        </mesh>
      </group>
    </group>
  );
};

export const NewtonsCradleGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [0, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <EquipmentErrorBoundary fallback={<PhysicsNewtonsCradle3D />}>
        <Suspense fallback={<PhysicsNewtonsCradle3D />}>
          <AnimatedGLTFModelNormalized path="/models/newtons_cradle.glb" targetSize={1.4} playbackSpeed={1.0} />
        </Suspense>
      </EquipmentErrorBoundary>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#f59e0b" anchorX="center" anchorY="bottom">
        Newton's Cradle (Animated)
      </Text>
    </DraggableEquipment>
  );
};

export const CrystalCapsuleGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [0, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <EquipmentErrorBoundary fallback={
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 1.4, 32]} />
          <meshStandardMaterial color="#a855f7" wireframe />
        </mesh>
      }>
        <Suspense fallback={
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 1.4, 32]} />
            <meshStandardMaterial color="#a855f7" wireframe />
          </mesh>
        }>
          <GLTFModelNormalized path="/models/crystal_capsule.glb" targetSize={1.4} />
        </Suspense>
      </EquipmentErrorBoundary>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#a855f7" anchorX="center" anchorY="bottom">
        Crystal Capsule
      </Text>
    </DraggableEquipment>
  );
};

export const BunsenBurnerGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [3.5, 0, 2] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <Suspense fallback={
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 1.4, 32]} />
          <meshStandardMaterial color="#f97316" wireframe />
        </mesh>
      }>
        <GLTFModelNormalized path="/models/bunsen_burner.glb" targetSize={1.4} />
      </Suspense>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#f97316" anchorX="center" anchorY="bottom">
        Bunsen Burner
      </Text>
    </DraggableEquipment>
  );
};

export const NuclearReactorGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [0, 0, -2] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <Suspense fallback={
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 1.4, 32]} />
          <meshStandardMaterial color="#22c55e" wireframe />
        </mesh>
      }>
        <GLTFModelNormalized path="/models/pwr_nuclear_reactor.glb" targetSize={1.4} />
      </Suspense>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#22c55e" anchorX="center" anchorY="bottom">
        Nuclear Reactor
      </Text>
    </DraggableEquipment>
  );
};

export const SolenoidMagnetGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [-2, 0, 2] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <EquipmentErrorBoundary fallback={
        <mesh position={[0, 0.7, 0]}>
          <torusGeometry args={[0.6, 0.2, 16, 32]} />
          <meshStandardMaterial color="#ec4899" wireframe />
        </mesh>
      }>
        <Suspense fallback={
          <mesh position={[0, 0.7, 0]}>
            <torusGeometry args={[0.6, 0.2, 16, 32]} />
            <meshStandardMaterial color="#ec4899" wireframe />
          </mesh>
        }>
          <AnimatedGLTFModelNormalized path="/models/magnetic_field_of_solenoid_by_yuyalyj.glb" targetSize={1.4} playbackSpeed={1.0} />
        </Suspense>
      </EquipmentErrorBoundary>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#ec4899" anchorX="center" anchorY="bottom">
        Solenoid Magnet
      </Text>
    </DraggableEquipment>
  );
};

export const RiemannSphereGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [2.5, 0, 1.5] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <Suspense fallback={
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color="#06b6d4" wireframe />
        </mesh>
      }>
        <GLTFModelNormalized path="/models/riemann_sphere.glb" targetSize={1.4} />
      </Suspense>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#06b6d4" anchorX="center" anchorY="bottom">
        Riemann Sphere
      </Text>
    </DraggableEquipment>
  );
};

export const QuantumRingGLBModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [0, 0, 1.5] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <EquipmentErrorBoundary fallback={
        <mesh position={[0, 0.7, 0]}>
          <torusGeometry args={[0.7, 0.15, 16, 32]} />
          <meshStandardMaterial color="#0f172a" wireframe />
        </mesh>
      }>
        <Suspense fallback={
          <mesh position={[0, 0.7, 0]}>
            <torusGeometry args={[0.7, 0.15, 16, 32]} />
            <meshStandardMaterial color="#0f172a" wireframe />
          </mesh>
        }>
          <AnimatedGLTFModelNormalized path="/models/quantum_ring.glb" targetSize={1.5} playbackSpeed={1.0} />
        </Suspense>
      </EquipmentErrorBoundary>
      <Text position={[0, 1.7, 0]} fontSize={0.22} color="#0f172a" anchorX="center" anchorY="bottom">
        Quantum Ring (Animated GLB)
      </Text>
    </DraggableEquipment>
  );
};

// Procedural Low-poly fallback models
export const PotentialBarrierModel: React.FC<EquipmentProps & { height?: number; width?: number }> = ({
  id,
  isInstalled,
  height = 5,
  width = 1,
  defaultPos = [0, 0, 0],
}) => {
  if (!isInstalled) return null;
  const barrierScaleX = Math.max(0.2, width * 0.8);
  const barrierScaleY = Math.max(0.5, height * 0.4);

  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, barrierScaleY / 2 - 0.2, 0]}>
        <boxGeometry args={[barrierScaleX + 0.4, barrierScaleY + 0.4, 2.2]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.1} transmission={0.85} thickness={0.5} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, barrierScaleY / 2, 0]}>
        <boxGeometry args={[barrierScaleX, barrierScaleY, 1.8]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={3.0} transparent opacity={0.7} />
      </mesh>
      <Text position={[0, barrierScaleY + 0.5, 0]} fontSize={0.22} color="#a855f7" anchorX="center" anchorY="bottom">
        Potential Barrier ({height} eV)
      </Text>
    </DraggableEquipment>
  );
};

export const DetectorModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [4.2, 0, 0] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.8, 1.0, 0.4, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.25, 1.8, 1.8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.8} roughness={0.2} />
      </mesh>
      <Text position={[0, 1.6, 0]} fontSize={0.22} color="#22c55e" anchorX="center" anchorY="bottom">
        Particle Detector
      </Text>
    </DraggableEquipment>
  );
};

export const ChemistryBeakerModel: React.FC<EquipmentProps> = ({ id, isInstalled, defaultPos = [2, 0, 2] }) => {
  if (!isInstalled) return null;
  return (
    <DraggableEquipment id={id} defaultPos={defaultPos}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 32, 1, true]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.6, 32]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, 1.3, 0]} fontSize={0.22} color="#06b6d4" anchorX="center" anchorY="bottom">
        Glass Beaker
      </Text>
    </DraggableEquipment>
  );
};

// Preload GLB assets for smooth rendering
useGLTF.preload("/models/atomic_models.glb");
useGLTF.preload("/models/newtons_cradle.glb");
useGLTF.preload("/models/crystal_capsule.glb");
useGLTF.preload("/models/bunsen_burner.glb");
useGLTF.preload("/models/pwr_nuclear_reactor.glb");
useGLTF.preload("/models/magnetic_field_of_solenoid_by_yuyalyj.glb");
useGLTF.preload("/models/riemann_sphere.glb");
