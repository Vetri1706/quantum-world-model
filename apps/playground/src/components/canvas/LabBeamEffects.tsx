// Sleek, High-Precision Scientific Laser Ray Effect (Clean, Uncluttered)

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type LabBeamEffectsProps = {
  sourcePos: [number, number, number];
  targetPos?: [number, number, number];
  beamColor?: string;
  isEmitting?: boolean;
};

export const LabBeamEffects: React.FC<LabBeamEffectsProps> = ({
  sourcePos,
  targetPos = [4.2, 0, 0],
  beamColor = "#38bdf8",
  isEmitting = true,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef.current) {
      const scale = 1.0 + Math.sin(time * 5) * 0.1;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!isEmitting) return null;

  const dx = targetPos[0] - sourcePos[0];
  const dz = targetPos[2] - sourcePos[2];
  const distance = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const midX = (sourcePos[0] + targetPos[0]) / 2;
  const midZ = (sourcePos[2] + targetPos[2]) / 2;

  return (
    <group>
      {/* Precision Thin Scientific Laser Ray Line */}
      <mesh
        position={[midX, sourcePos[1] + 0.4, midZ]}
        rotation={[0, -angle, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.015, 0.015, distance, 16]} />
        <meshStandardMaterial
          color={beamColor}
          emissive={beamColor}
          emissiveIntensity={4.0}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Subtle Laser Beam Core Glow */}
      <mesh
        position={[midX, sourcePos[1] + 0.4, midZ]}
        rotation={[0, -angle, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.04, 0.04, distance, 16]} />
        <meshStandardMaterial
          color={beamColor}
          emissive={beamColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Detector Impact Hit Ring */}
      <mesh ref={ringRef} position={[targetPos[0] - 0.05, targetPos[1] + 0.6, targetPos[2]]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3.0} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
