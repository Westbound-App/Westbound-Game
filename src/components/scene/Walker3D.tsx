"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const COLORS = {
  jacket: "#c4593b",
  sleeve: "#b04f34",
  pants: "#4a4e59",
  boots: "#3b2f27",
  skin: "#e0b08c",
  cap: "#35523e",
  capBrim: "#2c4433",
  pack: "#71503a",
  bedroll: "#a08150",
  strap: "#3f342a",
};

type Props = {
  /** Walk-cycle phase driver (meters walked); gait derives from it */
  phaseRef: React.MutableRefObject<number>;
  /** 0 = standing still, 1 = full stride */
  strideRef: React.MutableRefObject<number>;
};

/**
 * Stylized walker built from primitives: articulated two-segment legs,
 * counter-swinging arms, torso lean, gentle bob. Faces -Z (westbound).
 */
export function Walker3D({ phaseRef, strideRef }: Props) {
  const root = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const torso = useRef<Group>(null);

  useFrame(() => {
    const stride = strideRef.current;
    // ~1.45 m stride length → two steps per cycle
    const t = (phaseRef.current / 1.45) * Math.PI * 2;
    const swing = Math.sin(t) * 0.5 * stride;
    const idle = Math.sin(t * 0.13) * 0.02;

    if (hipL.current) hipL.current.rotation.x = swing;
    if (hipR.current) hipR.current.rotation.x = -swing;
    // Shin trails the thigh: bends most as the leg comes forward
    if (kneeL.current)
      kneeL.current.rotation.x = Math.max(0, Math.sin(t + 1.25)) * 0.75 * stride;
    if (kneeR.current)
      kneeR.current.rotation.x =
        Math.max(0, Math.sin(t + Math.PI + 1.25)) * 0.75 * stride;
    if (armL.current) armL.current.rotation.x = -swing * 0.7;
    if (armR.current) armR.current.rotation.x = swing * 0.7;
    if (torso.current) torso.current.rotation.z = Math.sin(t * 0.5) * 0.02;
    if (root.current) {
      root.current.position.y =
        Math.abs(Math.sin(t)) * 0.045 * stride + idle * (1 - stride);
    }
  });

  return (
    <group ref={root}>
      {/* Legs (hips at y≈0.92) */}
      {[
        { side: -1, hip: hipL, knee: kneeL },
        { side: 1, hip: hipR, knee: kneeR },
      ].map(({ side, hip, knee }) => (
        <group key={side} ref={hip} position={[0.11 * side, 0.92, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.3, 6, 10]} />
            <meshStandardMaterial color={COLORS.pants} roughness={0.9} />
          </mesh>
          <group ref={knee} position={[0, -0.45, 0]}>
            {/* Shin */}
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.062, 0.28, 6, 10]} />
              <meshStandardMaterial color={COLORS.pants} roughness={0.9} />
            </mesh>
            {/* Boot */}
            <mesh position={[0, -0.4, -0.04]} castShadow>
              <boxGeometry args={[0.13, 0.1, 0.26]} />
              <meshStandardMaterial color={COLORS.boots} roughness={0.85} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Torso group leans slightly into the walk */}
      <group ref={torso} position={[0, 0.98, 0]} rotation={[-0.06, 0, 0]}>
        {/* Jacket */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.19, 0.36, 8, 12]} />
          <meshStandardMaterial color={COLORS.jacket} roughness={0.85} />
        </mesh>
        {/* Backpack */}
        <mesh position={[0, 0.34, 0.21]} castShadow>
          <boxGeometry args={[0.32, 0.42, 0.18]} />
          <meshStandardMaterial color={COLORS.pack} roughness={0.9} />
        </mesh>
        {/* Bedroll on top of pack */}
        <mesh
          position={[0, 0.6, 0.21]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <capsuleGeometry args={[0.07, 0.24, 6, 10]} />
          <meshStandardMaterial color={COLORS.bedroll} roughness={0.95} />
        </mesh>
        {/* Shoulder straps */}
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.38, 0.02]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.05, 0.34, 0.02]} />
            <meshStandardMaterial color={COLORS.strap} roughness={0.9} />
          </mesh>
        ))}

        {/* Arms */}
        {[
          { side: -1, r: armL },
          { side: 1, r: armR },
        ].map(({ side, r }) => (
          <group key={side} ref={r} position={[0.24 * side, 0.46, 0]}>
            <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0.08 * side]} castShadow>
              <capsuleGeometry args={[0.055, 0.32, 6, 10]} />
              <meshStandardMaterial color={COLORS.sleeve} roughness={0.85} />
            </mesh>
            {/* Hand */}
            <mesh position={[0.03 * side, -0.42, 0]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={COLORS.skin} roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* Head + cap */}
        <group position={[0, 0.72, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.115, 14, 14]} />
            <meshStandardMaterial color={COLORS.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <sphereGeometry
              args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]}
            />
            <meshStandardMaterial color={COLORS.cap} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.045, -0.12]} rotation={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.115, 0.115, 0.02, 14, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={COLORS.capBrim} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
