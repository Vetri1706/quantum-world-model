// 3D Wave Interference Field Visualizer for Double Slit Experiment

import React, { useMemo } from "react";
import * as THREE from "three";

type InterferenceMeshProps = {
  intensityArray: number[];
};

export const WaveInterferenceMesh: React.FC<InterferenceMeshProps> = ({ intensityArray }) => {
  const points = useMemo(() => {
    if (!intensityArray || intensityArray.length === 0) return [];
    const n = intensityArray.length;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const z = (i / n) * 8 - 4;
      const y = intensityArray[i] * 2.0;
      pts.push(new THREE.Vector3(5.0, y, z));
    }
    return pts;
  }, [intensityArray]);

  const lineMesh = useMemo(() => {
    if (points.length === 0) return null;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: "#ec4899", linewidth: 4 });
    return new THREE.Line(geometry, material);
  }, [points]);

  return (
    <group>
      {/* Target Screen Line */}
      {lineMesh && <primitive object={lineMesh} />}

      {/* Interference Fringes */}
      {points.map((pt, idx) => {
        if (idx % 4 !== 0) return null;
        return (
          <mesh key={idx} position={[5.0, pt.y / 2, pt.z]}>
            <boxGeometry args={[0.05, Math.max(0.05, pt.y), 0.15]} />
            <meshStandardMaterial
              color="#ec4899"
              emissive="#ec4899"
              emissiveIntensity={pt.y * 2.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};
