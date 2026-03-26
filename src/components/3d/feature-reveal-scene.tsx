"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Group, MathUtils, SpotLight } from "three";

interface FeatureRevealSceneProps {
  progress: number;
}

const BriefcaseMesh = ({ progress }: FeatureRevealSceneProps) => {
  const groupRef = useRef<Group>(null);
  const spotOneRef = useRef<SpotLight>(null);
  const spotTwoRef = useRef<SpotLight>(null);
  const spotThreeRef = useRef<SpotLight>(null);

  const target = useMemo(
    () => ({
      y: MathUtils.lerp(-2.2, 0.15, progress),
      scale: MathUtils.lerp(0.42, 1.1, progress),
      rotX: MathUtils.lerp(0.65, 0.08, progress),
      rotY: MathUtils.lerp(-1.4, 0.02, progress),
    }),
    [progress]
  );

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const l = Math.min(delta * 3.2, 1);
    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, target.y, l);
    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, target.rotX, l);
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, target.rotY, l);
    groupRef.current.scale.setScalar(
      MathUtils.lerp(groupRef.current.scale.x, target.scale, l)
    );

    if (spotOneRef.current && spotTwoRef.current && spotThreeRef.current) {
      spotOneRef.current.intensity = MathUtils.lerp(0.15, 2.8, progress);
      spotTwoRef.current.intensity = MathUtils.lerp(0.1, 2.2, progress);
      spotThreeRef.current.intensity = MathUtils.lerp(0.08, 1.8, progress);
    }
  });

  return (
    <>
      <spotLight ref={spotOneRef} position={[2.6, 3.2, 2.5]} angle={0.35} penumbra={0.6} />
      <spotLight
        ref={spotTwoRef}
        position={[-3.2, 2.2, 2.1]}
        angle={0.38}
        penumbra={0.55}
        color="#60a5fa"
      />
      <spotLight
        ref={spotThreeRef}
        position={[0, 3.8, -2.5]}
        angle={0.4}
        penumbra={0.5}
        color="#a78bfa"
      />
      <group ref={groupRef} position={[0, -2.2, 0]} rotation={[0.65, -1.4, 0]} scale={0.42}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[1.95, 1.12, 0.72]} />
          <meshStandardMaterial color="#1E3A8A" metalness={0.45} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.56, 0.08]}>
          <boxGeometry args={[1.95, 0.24, 0.76]} />
          <meshStandardMaterial color="#3B82F6" metalness={0.35} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.89, 0]}>
          <torusGeometry args={[0.38, 0.085, 20, 56]} />
          <meshStandardMaterial color="#93C5FD" metalness={0.6} roughness={0.2} />
        </mesh>
      </group>
    </>
  );
};

const FeatureRevealScene = ({ progress }: FeatureRevealSceneProps) => {
  return (
    <Canvas
      dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1}
      camera={{ position: [0, 0.5, 4.6], fov: 42 }}
      className="h-full w-full"
    >
      <ambientLight intensity={0.25} />
      <BriefcaseMesh progress={progress} />
      <Environment preset="night" />
    </Canvas>
  );
};

export default FeatureRevealScene;
