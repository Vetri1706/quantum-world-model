// Newton's Cradle Physics Simulation
// 5 steel balls, elastic collisions, momentum & energy conservation

import * as THREE from "three";

export interface CradleConfig {
  ballCount: number;
  ballRadius: number;
  rodLength: number;
  ballMass: number;
  restitution: number;
  damping: number; // air resistance
  startX: number; // initial displacement of first ball
  releaseAngle: number; // angle in radians
}

export const defaultCradle: CradleConfig = {
  ballCount: 5,
  ballRadius: 0.025,
  rodLength: 0.3,
  ballMass: 0.1,
  restitution: 0.99,
  damping: 0.001,
  startX: -0.1,
  releaseAngle: Math.PI / 3, // 60 degrees
};

export interface CradleState {
  angles: number[]; // pendulum angle for each ball
  velocities: number[]; // angular velocity for each ball
  positions: THREE.Vector3[]; // 3D positions
  energyTotal: number;
}

export function initCradleState(config: CradleConfig, pivotY: number = 0.5): CradleState {
  const angles = new Array(config.ballCount).fill(0);
  const velocities = new Array(config.ballCount).fill(0);
  
  // First ball starts at release angle
  angles[0] = config.releaseAngle;
  
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < config.ballCount; i++) {
    const x = i * (config.ballRadius * 2);
    const y = pivotY - config.rodLength * Math.cos(angles[i]);
    const z = config.rodLength * Math.sin(angles[i]);
    positions.push(new THREE.Vector3(x, y, z));
  }
  
  return {
    angles,
    velocities,
    positions,
    energyTotal: computeEnergy(config, angles, velocities),
  };
}

function computeEnergy(config: CradleConfig, angles: number[], velocities: number[]): number {
  let energy = 0;
  const g = 9.81;
  
  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    const angVel = velocities[i];
    // Potential energy: -mgL cos(theta) (zero at top)
    energy += -config.ballMass * g * config.rodLength * Math.cos(angle);
    // Kinetic energy: (1/2) m L^2 theta_dot^2
    energy += 0.5 * config.ballMass * config.rodLength * config.rodLength * angVel * angVel;
  }
  
  return energy;
}

export function stepCradle(
  state: CradleState,
  config: CradleConfig,
  deltaTime: number
): CradleState {
  const g = 9.81;
  const L = config.rodLength;
  const dampingFactor = 1 - config.damping;
  
  // RK4 integration for pendulum dynamics
  for (let i = 0; i < config.ballCount; i++) {
    const angle = state.angles[i];
    const angVel = state.velocities[i];
    
    // Simple pendulum ODE: theta'' = -(g/L) sin(theta)
    // RK4 step for accuracy
    const k1 = { dtheta: angVel, domega: -(g / L) * Math.sin(angle) };
    const k2 = {
      dtheta: angVel + 0.5 * deltaTime * k1.domega,
      domega: -(g / L) * Math.sin(angle + 0.5 * deltaTime * k1.dtheta),
    };
    const k3 = {
      dtheta: angVel + 0.5 * deltaTime * k2.domega,
      domega: -(g / L) * Math.sin(angle + 0.5 * deltaTime * k2.dtheta),
    };
    const k4 = {
      dtheta: angVel + deltaTime * k3.domega,
      domega: -(g / L) * Math.sin(angle + deltaTime * k3.dtheta),
    };
    
    const dAngle = (deltaTime / 6) * (k1.dtheta + 2 * k2.dtheta + 2 * k3.dtheta + k4.dtheta);
    const dOmega = (deltaTime / 6) * (k1.domega + 2 * k2.domega + 2 * k3.domega + k4.domega);
    
    state.angles[i] = angle + dAngle;
    state.velocities[i] = (angVel + dOmega) * dampingFactor;
    
    // Clamp angles to prevent full rotation
    const maxAngle = Math.PI / 2;
    if (Math.abs(state.angles[i]) > maxAngle) {
      state.angles[i] = Math.sign(state.angles[i]) * maxAngle;
      state.velocities[i] = 0;
    }
  }
  
  // Ball-ball collisions (sequential impulse)
  const ballSpacing = config.ballRadius * 2;
  for (let i = 0; i < config.ballCount - 1; i++) {
    const ball1Pos = state.angles[i] * L;
    const ball2Pos = state.angles[i + 1] * L;
    const gap = ball2Pos - ball1Pos;
    
    // Contact when gap < 2 * ballRadius
    if (gap < ballSpacing) {
      const v1 = state.velocities[i] * L;
      const v2 = state.velocities[i + 1] * L;
      const relativeVelocity = v2 - v1;
      
      // Only resolve if balls are approaching
      if (relativeVelocity < 0) {
        const impulse = -(1 + config.restitution) * relativeVelocity / (2 / config.ballMass);
        
        state.velocities[i] -= impulse / (config.ballMass * L);
        state.velocities[i + 1] += impulse / (config.ballMass * L);
        
        // Positional correction
        const correction = (ballSpacing - gap) * 0.8;
        const correctionAngle = correction / L;
        state.angles[i] -= correctionAngle / 2;
        state.angles[i + 1] += correctionAngle / 2;
      }
    }
  }
  
  // Update 3D positions
  for (let i = 0; i < config.ballCount; i++) {
    const x = i * ballSpacing;
    const y = 0.5 - L * Math.cos(state.angles[i]);
    const z = L * Math.sin(state.angles[i]);
    state.positions[i].set(x, y, z);
  }
  
  state.energyTotal = computeEnergy(config, state.angles, state.velocities);
  
  return state;
}