// @ts-nocheck
// React hook for running physics simulation at fixed timestep
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { stepPhysics } from "./RapierPhysics";
import { useUnifiedLabStore } from "../store/useUnifiedLabStore";

export function usePhysicsLoop() {
  const isRunning = useUnifiedLabStore((s) => s.simulation.isRunning);
  const speed = useUnifiedLabStore((s) => s.simulation.speed);
  const entities = useUnifiedLabStore((s) => s.entities);
  const updateEntityTransform = useUnifiedLabStore((s) => s.setEntityTransform);
  const accumulatorRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!isRunning) return;
    
    // Accumulate time and step physics at fixed rate
    const scaledDelta = delta * speed;
    accumulatorRef.current += scaledDelta;
    
    // Step at most 4 sub-steps per frame
    stepPhysics(scaledDelta, 4);
    
    // Sync transforms back to entities with dynamic bodies
    entities.forEach((entity) => {
      if (entity.physicsBody?.type === "dynamic") {
        // Import dynamically to avoid circular deps
        import("./RapierPhysics").then(({ getBodyTransform }) => {
          const transform = getBodyTransform(entity.id);
          if (transform) {
            updateEntityTransform(entity.id, {
              position: transform.position,
              rotation: transform.rotation,
            });
          }
        });
      }
    });
  });
}
