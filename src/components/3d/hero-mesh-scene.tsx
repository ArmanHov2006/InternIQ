"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import { IcosahedronGeometry, Mesh, MeshStandardMaterial, Vector2 } from "three";
import { setupGsap } from "@/components/animations/gsap";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";

const HeroMesh = () => {
  const meshRef = useRef<Mesh>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const geometry = useMemo(() => new IcosahedronGeometry(1.15, 2), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#5B8BFF",
        roughness: 0.2,
        metalness: 0.35,
        flatShading: false,
      }),
    []
  );

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      meshRef.current.scale.setScalar(1);
      return;
    }

    const gsap = setupGsap();
    meshRef.current.scale.setScalar(0.001);
    const tween = gsap.to(meshRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.4,
      ease: "elastic.out(1, 0.45)",
    });

    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      targetRotationRef.current = { x: y * 0.18, y: x * 0.32 };
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    const lerpFactor = Math.min(delta * 2.1, 1);
    meshRef.current.rotation.x +=
      (targetRotationRef.current.x - meshRef.current.rotation.x) * lerpFactor;
    meshRef.current.rotation.y +=
      (targetRotationRef.current.y - meshRef.current.rotation.y) * lerpFactor;
    meshRef.current.rotation.z += 0.08 * delta;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};

const HeroMeshScene = () => {
  return (
    <Canvas
      dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1}
      camera={{ position: [0, 0, 3.2], fov: 45 }}
      className="h-full w-full"
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[2.5, 2, 2]} intensity={1.15} />
      <directionalLight position={[-2.5, -1.5, 1.5]} intensity={0.4} color="#7dd3fc" />
      <HeroMesh />
      <Environment preset="city" />
      {!prefersReducedMotion() ? (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={0.55} mipmapBlur />
          <ChromaticAberration
            offset={new Vector2(0.0008, 0.001)}
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
};

export default HeroMeshScene;
