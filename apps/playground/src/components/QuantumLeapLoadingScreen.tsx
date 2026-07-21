import React, { Suspense, useMemo, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Sparkles, X, CheckCircle, Zap } from "lucide-react";


const NoetaLoadingModel: React.FC = () => {
  const { scene, animations } = useGLTF("/loading.glb");

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Standard material enhancement: enable shadows & convert black materials to bright chrome/silver
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat: any) => {
            mat.side = THREE.DoubleSide;
            
            // If the material is black, convert to shiny silver/chrome
            if (mat.color && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05) {
              mat.color.setRGB(0.88, 0.90, 0.95);
              mat.metalness = 0.95;
              mat.roughness = 0.22;
              mat.needsUpdate = true;
            } else if (mat.color) {
              mat.color.convertSRGBToLinear();
            }
          });
        }
      }
    });

    // Center and scale model to fit view nicely (compact scale factor 2.4)
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = 2.4 / maxDim;
      clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    const updatedBox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    updatedBox.getCenter(center);
    clone.position.sub(center);

    // Rotate exactly 90 degrees around X-axis so the concentric rings face the camera upright
    clone.rotation.x = Math.PI / 2;
    clone.rotation.y = 0;
    clone.rotation.z = 0;

    return clone;
  }, [scene]);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!clonedScene || !animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      action.timeScale = 1.0;
    });

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [clonedScene, animations]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <primitive object={clonedScene} />;
};

interface QuantumLeapLoadingScreenProps {
  isOpen: boolean;
  onClose: () => void;
  loadingMessage?: string;
}

export const QuantumLeapLoadingScreen: React.FC<QuantumLeapLoadingScreenProps> = ({
  isOpen,
  onClose,
  loadingMessage = "loading assets...",
}) => {
  const [progress, setProgress] = React.useState(15);

  useEffect(() => {
    if (!isOpen) {
      setProgress(15);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12 + 5);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-8 text-white selection:bg-orange-500 selection:text-white font-sans overflow-hidden">
      {/* Background 3D Viewport - Fullscreen Backdrop */}
      <div className="absolute inset-0 z-0 bg-black">
        <Canvas camera={{ position: [0, 0, 4.0], fov: 60 }} gl={{ antialias: true }}>
          <color attach="background" args={["#000000"]} />
          
          {/* Add lighting to render loading.glb correctly */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 8, 5]} intensity={2.5} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={1.5} color="#00ffff" />
          <pointLight position={[5, -5, 5]} intensity={1.5} color="#ff00ff" />
          
          <Stars radius={100} depth={60} count={2000} factor={3} saturation={0.1} fade speed={1.0} />

          <Suspense fallback={null}>
            <NoetaLoadingModel />
          </Suspense>
        </Canvas>
      </div>

      {/* Top Header Overlay */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 bg-slate-950/45 p-4 rounded-2xl border border-slate-800/25 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/noeta_logo.png" alt="noeta" className="w-8 h-8 object-contain" />
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
              <span>noeta</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono lowercase">
                discovering
              </span>
            </h2>
            <p className="text-xs text-slate-400 lowercase font-medium">learn by discovering, not reading</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 text-slate-400 hover:text-white transition-all backdrop-blur-md"
          title="Close Loading Screen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Badge (Middle Overlay) */}
      <div className="z-10 px-4 py-2 rounded-full bg-slate-900/85 border border-slate-850/80 backdrop-blur-xl shadow-2xl flex items-center gap-2 pointer-events-none mt-auto mb-6">
        <Zap className="w-4 h-4 text-orange-400 animate-bounce" />
        <span className="text-xs font-bold text-slate-200 font-mono tracking-wider lowercase">
          {progress < 100 ? `discovering: ${progress}%` : "ready to discover!"}
        </span>
      </div>

      {/* Bottom Progress Bar & Physics Status Overlay */}
      <div className="w-full max-w-2xl space-y-4 z-10 bg-slate-950/45 p-6 rounded-3xl border border-slate-800/25 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono font-bold text-slate-300">
            <span className="lowercase">{loadingMessage}</span>
            <span className="text-orange-400">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-400 transition-all duration-200 shadow-md shadow-orange-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[11px] font-mono text-slate-400 lowercase">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>tensor core: active</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>3d logo: hydrated</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>wavefunction: loaded</span>
          </div>
        </div>

        {progress >= 100 && (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <span>enter stage</span>
          </button>
        )}
      </div>
    </div>
  );
};
