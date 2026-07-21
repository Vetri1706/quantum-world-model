// @ts-nocheck
// Newton's Cradle Entity - Real pendulum physics with animated balls
import React, { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { LabEntityBase } from "../LabEntity";
import {
  defaultCradle,
  initCradleState,
  stepCradle,
  type CradleConfig,
  type CradleState,
} from "../../physics/physicsSimulations/newtonsCradle";
import { useUnifiedLabStore } from "../../store/useUnifiedLabStore";

interface NewtonsCradleEntityProps {
  entity: { id: string; transform: any; metadata: any; parameters: any };
}

const CRADLE_PIVOT_HEIGHT = 0.5;
const CRADLE_BALL_SPACING = 0.025 * 2;

export const NewtonsCradleEntity: React.FC<NewtonsCradleEntityProps> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ballRefs = useRef<THREE.Mesh[]>([]);
  const rodRefs = useRef<THREE.Mesh[]>([]);
  const isSimulationRunning = useUnifiedLabStore((s) => s.simulation.isRunning);
  const simulationSpeed = useUnifiedLabStore((s) => s.simulation.speed);
  
  // Parse parameters
  const config: CradleConfig = useMemo(() => ({
    ...defaultCradle,
    rodLength: 0.3, // 30 cm
    ballMass: 0.1,  // 100 g
    restitution: entity.parameters.restitution || 0.98,
    releaseAngle: (entity.parameters.releaseAngle || 30) * Math.PI / 180,
    damping: 0.001,
    ballCount: 5,
    ballRadius: 0.025,
    startX: -0.1,
  }), [entity.parameters]);
  
  const [cradleState, setCradleState] = useState<CradleState>(() =>
    initCradleState(config, CRADLE_PIVOT_HEIGHT)
  );
  
  // Reset state when config changes
  useEffect(() => {
    setCradleState(initCradleState(config, CRADLE_PIVOT_HEIGHT));
  }, [config]);
  
  // Physics stepping via useFrame
  useFrame((state, delta) => {
    if (!isSimulationRunning) return;
    
    // Step physics at fixed timestep with sub-stepping
    const fixedStep = 1 / 240; // 240 Hz for accurate collisions
    let remainingTime = delta * simulationSpeed;
    const maxSubSteps = 10;
    let steps = 0;
    
    while (remainingTime > 0 && steps < maxSubSteps) {
      const step = Math.min(fixedStep, remainingTime);
      stepCradle(cradleState, config, step);
      remainingTime -= step;
      steps++;
    }
    
    // Update ball positions
    ballRefs.current.forEach((ball, i) => {
      if (!ball) return;
      ball.position.copy(cradleState.positions[i]);
    });
    
    // Update rod positions (chains from pivot to ball)
    rodRefs.current.forEach((rod, i) => {
      if (!rod) return;
      const pivotX = i * CRADLE_BALL_SPACING;
      const ballPos = cradleState.positions[i];
      const mid = new THREE.Vector3(
        (pivotX + ballPos.x) / 2,
        (CRADLE_PIVOT_HEIGHT + ballPos.y) / 2,
        ballPos.z / 2
      );
      rod.position.copy(mid);
      
      // Orient rod toward ball
      const dir = new THREE.Vector3().subVectors(
        new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z),
        new THREE.Vector3(pivotX, CRADLE_PIVOT_HEIGHT, 0)
      );
      const length = dir.length();
      rod.scale.y = length;
      
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      rod.quaternion.copy(quat);
    });
  });
  
  return (
    <LabEntityBase entity={entity as any}>
      <group ref={groupRef}>
        {/* Stand frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.05, 0.1]} />
          <meshStandardMaterial color="#5A3A22" roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh position={[-0.12, 0.25, 0]}>
          <boxGeometry args={[0.02, 0.5, 0.02]} />
          <meshStandardMaterial color="#5A3A22" roughness={0.7} />
        </mesh>
        <mesh position={[0.12, 0.25, 0]}>
          <boxGeometry args={[0.02, 0.5, 0.02]} />
          <meshStandardMaterial color="#5A3A22" roughness={0.7} />
        </mesh>
        
        {/* Top bar (where pendulums hang from) */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.26, 0.02, 0.08]} />
          <meshStandardMaterial color="#3A2A12" roughness={0.6} metalness={0.2} />
        </mesh>
        
        {/* 5 Pendulum balls with rods */}
        {Array.from({ length: 5 }).map((_, i) => {
          const pivotX = i * CRADLE_BALL_SPACING - 0.05;
          return (
            <group key={i}>
              {/* Rod */}
              <mesh
                ref={(el) => { if (el) rodRefs.current[i] = el; }}
                position={[pivotX, 0.25, 0]}
              >
                <cylinderGeometry args={[0.002, 0.002, 0.3, 8]} />
                <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
              </mesh>
              
              {/* Ball */}
              <mesh
                ref={(el) => { if (el) ballRefs.current[i] = el; }}
                position={[pivotX, 0.2, 0]}
                castShadow
              >
                <sphereGeometry args={[config.ballRadius, 32, 32]} />
                <meshPhysicalMaterial 
                  color="#888" 
                  roughness={0.05} 
                  metalness={0.95} 
                  clearcoat={1.0}
                  clearcoatRoughness={0.05}
                />
              </mesh>
            </group>
          );
        })}
        
        {/* Label */}
        <Text 
          position={[0, -0.15, 0]} 
          fontSize={0.05} 
          color="#f59e0b" 
          anchorX="center" 
          anchorY="top"
        >
          Newton's Cradle
        </Text>
        
        {/* Energy readout */}
        <Text 
          position={[0, -0.25, 0.1]} 
          fontSize={0.025} 
          color="#94a3b8" 
          anchorX="center" 
          anchorY="top"
        >
          {`E: ${cradleState.energyTotal.toFixed(3)} J  |  v: ${(cradleState.velocities[0] * config.rodLength).toFixed(2)} m/s`}
        </Text>
      </group>
    </LabEntityBase>
  );
};
