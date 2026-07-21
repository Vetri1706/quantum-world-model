// Procedural 3D Wave Packet & Probability Density Visualizer

import React, { useMemo } from "react";
import * as THREE from "three";

type WavePacketMeshProps = {
  densityArray: number[];
  xArray: number[];
};

export const WavePacketMesh: React.FC<WavePacketMeshProps> = ({
  densityArray,
  xArray,
}) => {
  // Construct 3D probability density curve points
  const points = useMemo(() => {
    if (!densityArray || densityArray.length === 0) return [];
    const n = densityArray.length;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const x = (xArray[i] || (i / n) * 20 - 10) * 0.5;
      const y = Math.max(0, densityArray[i] * 3.5);
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return pts;
  }, [densityArray, xArray]);

  const lineMesh = useMemo(() => {
    if (points.length === 0) return null;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: "#38bdf8", linewidth: 3 });
    return new THREE.Line(geometry, material);
  }, [points]);

  return (
    <group position={[0, 0, 0]}>
      {/* Probability Wave Ribbon Line */}
      {lineMesh && <primitive object={lineMesh} />}

      {/* Glowing 3D Quantum Particles along Wave Ribbon */}
      {points.map((pt, idx) => {
        if (idx % 8 !== 0 || pt.y < 0.05) return null;
        return (
          <mesh key={idx} position={[pt.x, pt.y, 0]}>
            <sphereGeometry args={[Math.min(0.2, pt.y * 0.15 + 0.05), 16, 16]} />
            <meshStandardMaterial
              color={pt.x > 0 ? "#22c55e" : "#38bdf8"}
              emissive={pt.x > 0 ? "#22c55e" : "#38bdf8"}
              emissiveIntensity={2.8}
            />
          </mesh>
        );
      })}
    </group>
  );
};
