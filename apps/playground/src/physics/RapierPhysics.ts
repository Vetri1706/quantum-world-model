// @ts-nocheck
// Rapier Physics Engine Integration for Quantum Lab Simulator
// Handles rigid body simulation for classical mechanics equipment

import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { LabEntity, PhysicsBody, ConstraintDef } from "../store/useUnifiedLabStore";

let world: RAPIER.World | null = null;
let eventQueue: RAPIER.EventQueue | null = null;
const bodyMap = new Map<string, RAPIER.RigidBody>();
const entityMap = new Map<number, string>();

export async function initPhysics(): Promise<void> {
  if (world) return;
  
  await RAPIER.init();
  
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  world = new RAPIER.World(gravity);
  eventQueue = new RAPIER.EventQueue(true);
  
  console.log("Rapier physics initialized");
}

export function getWorld(): RAPIER.World | null {
  return world;
}

export function createRigidBody(
  entityId: string,
  bodyDef: PhysicsBody,
  transform: { position: [number, number, number]; rotation: [number, number, number] }
): RAPIER.RigidBody | null {
  if (!world) return null;
  
  let bodyDesc: RAPIER.RigidBodyDesc;
  
  switch (bodyDef.type) {
    case "dynamic":
      bodyDesc = RAPIER.RigidBodyDesc.dynamic();
      break;
    case "kinematic":
      bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
      break;
    case "static":
    default:
      bodyDesc = RAPIER.RigidBodyDesc.fixed();
      break;
  }
  
  bodyDesc.setTranslation({
    x: transform.position[0],
    y: transform.position[1],
    z: transform.position[2],
  });
  
  const euler = new THREE.Euler(
    transform.rotation[0],
    transform.rotation[1],
    transform.rotation[2]
  );
  const quat = new THREE.Quaternion().setFromEuler(euler);
  bodyDesc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
  
  if (bodyDef.mass !== undefined) {
    bodyDesc.setAdditionalMass(bodyDef.mass);
  }
  
  const body = world.createRigidBody(bodyDesc);
  bodyMap.set(entityId, body);
  entityMap.set(body.handle, entityId);
  
  // Create collider based on shape
  let colliderDesc: RAPIER.ColliderDesc;
  
  switch (bodyDef.collisionShape) {
    case "sphere":
      colliderDesc = RAPIER.ColliderDesc.ball(0.5);
      break;
    case "cylinder":
      colliderDesc = RAPIER.ColliderDesc.cylinder(0.5, 1.0);
      break;
    case "box":
    case "convex":
    case "trimesh":
    default:
      colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
      break;
  }
  
  if (bodyDef.type === "dynamic" && bodyDef.mass !== undefined) {
    colliderDesc.setDensity(bodyDef.mass / 1.0); // Assume volume = 1
  }
  
  world.createCollider(colliderDesc, body);
  
  return body;
}

export function createConstraint(
  constraintDef: ConstraintDef,
  entityAId: string,
  entityBId: string
): RAPIER.Joint | null {
  if (!world) return null;
  
  const bodyA = bodyMap.get(entityAId);
  const bodyB = bodyMap.get(entityBId);
  
  if (!bodyA || !bodyB) return null;
  
  switch (constraintDef.type) {
    case "distance": {
      const distance = constraintDef.params.distance || 1.0;
      const params = RAPIER.JointData.spherical(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: -distance, z: 0 }
      );
      return world.createImpulseJoint(params, bodyA, bodyB, true);
    }
    
    case "revolute": {
      const params = RAPIER.JointData.revolute(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      );
      return world.createImpulseJoint(params, bodyA, bodyB, true);
    }
    
    case "prismatic": {
      const params = RAPIER.JointData.prismatic(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }
      );
      return world.createImpulseJoint(params, bodyA, bodyB, true);
    }
    
    case "spring": {
      // Rapier has impulse spring; for now use spherical + motorized
      const distance = constraintDef.params.distance || 2.0;
      const params = RAPIER.JointData.spherical(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: -distance, z: 0 }
      );
      return world.createImpulseJoint(params, bodyA, bodyB, true);
    }
    
    default:
      return null;
  }
}

export function removeRigidBody(entityId: string): void {
  if (!world) return;
  
  const body = bodyMap.get(entityId);
  if (body) {
    world.removeRigidBody(body);
    bodyMap.delete(entityId);
    entityMap.delete(body.handle);
  }
}

export function updateBodyTransform(
  entityId: string,
  position: [number, number, number],
  rotation: [number, number, number]
): void {
  const body = bodyMap.get(entityId);
  if (!body) return;
  
  body.setNextKinematicTranslation({
    x: position[0],
    y: position[1],
    z: position[2],
  });
  
  const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2]);
  const quat = new THREE.Quaternion().setFromEuler(euler);
  body.setNextKinematicRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
}

export function applyImpulse(
  entityId: string,
  impulse: [number, number, number]
): void {
  const body = bodyMap.get(entityId);
  if (!body || body.bodyType() !== RAPIER.RigidBodyType.Dynamic) return;
  
  body.applyImpulse(
    { x: impulse[0], y: impulse[1], z: impulse[2] },
    true
  );
}

export function stepPhysics(deltaTime: number, maxSubSteps: number = 4): void {
  if (!world || !eventQueue) return;
  
  const fixedTimeStep = 1 / 120;
  let remaining = deltaTime;
  let steps = 0;
  
  while (remaining > 0 && steps < maxSubSteps) {
    const step = Math.min(fixedTimeStep, remaining);
    world.step(eventQueue);
    remaining -= step;
    steps++;
  }
  
  eventQueue.drainCollisionEvents((handle1, handle2, started) => {
    if (started) {
      const id1 = entityMap.get(handle1);
      const id2 = entityMap.get(handle2);
      if (id1 && id2) {
        onCollision(id1, id2);
      }
    }
  });
}

export function getBodyTransform(entityId: string): {
  position: [number, number, number];
  rotation: [number, number, number];
} | null {
  const body = bodyMap.get(entityId);
  if (!body) return null;
  
  const t = body.translation();
  const r = body.rotation();
  const euler = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion(r.x, r.y, r.z, r.w)
  );
  
  return {
    position: [t.x, t.y, t.z],
    rotation: [euler.x, euler.y, euler.z],
  };
}

export function setBodyLinearDamping(entityId: string, damping: number): void {
  const body = bodyMap.get(entityId);
  if (!body) return;
  body.setLinearDamping(damping);
}

export function setBodyAngularDamping(entityId: string, damping: number): void {
  const body = bodyMap.get(entityId);
  if (!body) return;
  body.setAngularDamping(damping);
}

export function restrictRotationAxes(
  entityId: string,
  axes: { x: boolean; y: boolean; z: boolean }
): void {
  const body = bodyMap.get(entityId);
  if (!body) return;
  
  body.setEnabledRotations(axes.x, axes.y, axes.z, true);
}

export function restrictTranslationAxes(
  entityId: string,
  axes: { x: boolean; y: boolean; z: boolean }
): void {
  const body = bodyMap.get(entityId);
  if (!body) return;
  
  body.setEnabledTranslations(axes.x, axes.y, axes.z, true);
}

export function resetPhysics(): void {
  if (!world) return;
  
  bodyMap.forEach((body) => {
    world!.removeRigidBody(body);
  });
  bodyMap.clear();
  entityMap.clear();
}

// Collision event handler
function onCollision(entityIdA: string, entityIdB: string): void {
  // Dispatch collision events to simulation handlers
  // e.g., Newton's cradle ball-ball collisions
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lab:collision", {
        detail: { entityIdA, entityIdB },
      })
    );
  }
}

// Newton's Cradle physics setup
export function setupNewtonsCradle(
  ballEntityIds: string[],
  pivots: Array<{ position: [number, number, number] }>,
  rodLength: number = 0.3,
  ballRadius: number = 0.025
): void {
  if (!world) return;
  
  ballEntityIds.forEach((ballId, i) => {
    const ballBody = bodyMap.get(ballId);
    const pivot = pivots[i];
    if (!ballBody || !pivot) return;
    
    // Create fixed pivot body
    const pivotDesc = RAPIER.RigidBodyDesc.fixed().setTranslation({
      x: pivot.position[0],
      y: pivot.position[1],
      z: pivot.position[2],
    });
    const pivotBody = world.createRigidBody(pivotDesc);
    
    // Distance constraint (rod)
    const jointParams = RAPIER.JointData.spherical(
      { x: 0, y: -rodLength, z: 0 }, // ball attach point
      { x: 0, y: 0, z: 0 }          // pivot
    );
    world.createImpulseJoint(jointParams, ballBody, pivotBody, true);
    
    // Restrict to swing in ZY plane
    ballBody.setEnabledRotations(false, true, true, true);
  });
}

// Pendulum setup (single)
export function setupPendulum(
  ballEntityId: string,
  pivotPosition: [number, number, number],
  rodLength: number = 0.3
): void {
  if (!world) return;
  
  const ballBody = bodyMap.get(ballEntityId);
  if (!ballBody) return;
  
  // Create fixed pivot
  const pivotDesc = RAPIER.RigidBodyDesc.fixed().setTranslation({
    x: pivotPosition[0],
    y: pivotPosition[1],
    z: pivotPosition[2],
  });
  const pivotBody = world.createRigidBody(pivotDesc);
  
  // Revolute joint for pendulum swing
  const jointParams = RAPIER.JointData.revolute(
    { x: 0, y: -rodLength, z: 0 }, // ball attach point (local to ball)
    { x: 0, y: 0, z: 0 },           // pivot (local to pivot)
    { x: 1, y: 0, z: 0 }            // rotation axis (X axis)
  );
  world.createImpulseJoint(jointParams, ballBody, pivotBody, true);
  
  ballBody.setLinearDamping(0.1);
  ballBody.setAngularDamping(0.05);
}

// Spring-mass system
export function setupSpringMass(
  massEntityId: string,
  anchorPosition: [number, number, number],
  restLength: number = 1.0,
  stiffness: number = 50,
  damping: number = 5
): void {
  if (!world) return;
  
  const massBody = bodyMap.get(massEntityId);
  if (!massBody) return;
  
  // Create fixed anchor
  const anchorDesc = RAPIER.RigidBodyDesc.fixed().setTranslation({
    x: anchorPosition[0],
    y: anchorPosition[1],
    z: anchorPosition[2],
  });
  const anchorBody = world.createRigidBody(anchorDesc);
  
  // Distance constraint as spring (approximate)
  const jointParams = RAPIER.JointData.spherical(
    { x: 0, y: restLength, z: 0 },
    { x: 0, y: 0, z: 0 }
  );
  const joint = world.createImpulseJoint(jointParams, massBody, anchorBody, true);
  
  // Apply motor force to simulate spring
  massBody.setLinearDamping(damping / 100);
}

export function getLinearVelocity(entityId: string): [number, number, number] {
  const body = bodyMap.get(entityId);
  if (!body) return [0, 0, 0];
  const v = body.linvel();
  return [v.x, v.y, v.z];
}

export function getAngularVelocity(entityId: string): [number, number, number] {
  const body = bodyMap.get(entityId);
  if (!body) return [0, 0, 0];
  const v = body.angvel();
  return [v.x, v.y, v.z];
}
