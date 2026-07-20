import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface BlochSphere3DProps {
  theta?: number;
  phi?: number;
  stateVectorText?: string;
  width?: number;
  height?: number;
}

export const BlochSphere3D: React.FC<BlochSphere3DProps> = ({
  theta = Math.PI / 2,
  phi = 0,
  stateVectorText = "|Psi> = 1/sqrt(2)|0> + 1/sqrt(2)|1>",
  width = 280,
  height = 220,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2.2, 1.6, 2.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x5682C4, 1.5, 10);
    pointLight.position.set(3, 4, 3);
    scene.add(pointLight);

    const sphereGeo = new THREE.SphereGeometry(1, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x999999, wireframe: true, transparent: true, opacity: 0.12 });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    const equatorGeo = new THREE.RingGeometry(0.99, 1.01, 64);
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0x5682C4, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const equatorMesh = new THREE.Mesh(equatorGeo, equatorMat);
    equatorMesh.rotation.x = Math.PI / 2;
    scene.add(equatorMesh);

    const axisMatZ = new THREE.LineBasicMaterial({ color: 0x47833E, transparent: true, opacity: 0.5 });
    const geoZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0)]);
    scene.add(new THREE.Line(geoZ, axisMatZ));

    const axisMatX = new THREE.LineBasicMaterial({ color: 0xCC3333, transparent: true, opacity: 0.4 });
    const geoX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(1.2, 0, 0)]);
    scene.add(new THREE.Line(geoX, axisMatX));

    const axisMatY = new THREE.LineBasicMaterial({ color: 0x5682C4, transparent: true, opacity: 0.4 });
    const geoY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -1.2), new THREE.Vector3(0, 0, 1.2)]);
    scene.add(new THREE.Line(geoY, axisMatY));

    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.cos(theta);
    const z = Math.sin(theta) * Math.sin(phi);

    const arrowDir = new THREE.Vector3(x, y, z).normalize();
    const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), 1.0, 0x5682C4, 0.18, 0.08);
    scene.add(arrowHelper);

    const tipGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x5682C4, emissive: 0x5682C4, emissiveIntensity: 0.8 });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.set(x, y, z);
    scene.add(tipMesh);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      sphereMesh.rotation.y += 0.003;
      equatorMesh.rotation.z += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [theta, phi, width, height]);

  return (
    <div className="bloch-sphere-container">
      <div ref={mountRef} style={{ width, height, cursor: "grab" }} />
      <div className="bloch-state-text">{stateVectorText}</div>
    </div>
  );
};
