// @ts-nocheck
// LabEntity Base Component - Base wrapper for all 3D equipment in the scene
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PivotControls, Text } from "@react-three/drei";
import { useUnifiedLabStore, type LabEntity } from "../store/useUnifiedLabStore";

interface LabEntityProps {
  entity: LabEntity;
  children: React.ReactNode;
  onPhysicsUpdate?: (position: [number, number, number], rotation: [number, number, number]) => void;
}

export const LabEntityBase: React.FC<LabEntityProps> = ({ entity, children, onPhysicsUpdate }) => {
  const groupRef = useRef<THREE.Group>(null);
  const selectedEntityIds = useUnifiedLabStore((s) => s.selectedEntityIds);
  const setEntityPosition = useUnifiedLabStore((s) => s.setEntityPosition);
  const toggleEntitySelection = useUnifiedLabStore((s) => s.toggleEntitySelection);
  const removeEntity = useUnifiedLabStore((s) => s.removeEntity);
  
  const isSelected = selectedEntityIds.includes(entity.id);
  
  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;
      
      if ((e.key === "Delete" || e.key === "Backspace") && isSelected) {
        e.preventDefault();
        removeEntity(entity.id);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, entity.id, removeEntity]);
  
  return (
    <PivotControls
      anchor={[0, 0, 0]}
      depthTest={false}
      lineWidth={2}
      axisColors={["#38bdf8", "#22c55e", "#a855f7"]}
      activeAxes={[true, true, true]}
      scale={0.75}
      visible={isSelected}
      onDragStart={() => toggleEntitySelection(entity.id)}
      onDrag={(_, matrix) => {
        const x = matrix.elements[12];
        const y = matrix.elements[13];
        const z = matrix.elements[14];
        setEntityPosition(entity.id, [x, y, z]);
      }}
    >
      <group
        ref={groupRef}
        position={entity.transform.position}
        rotation={entity.transform.rotation}
        scale={entity.transform.scale}
        onClick={(e) => {
          e.stopPropagation();
          toggleEntitySelection(entity.id);
        }}
      >
        {children}
        
        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.05, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3.0} />
          </mesh>
        )}
      </group>
    </PivotControls>
  );
};
