"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const COLORS = {
  coat: "#1d1d23",
  white: "#eceae2",
  tan: "#b3763f",
  nose: "#141416",
  collar: "#a8452f",
};

type BeaconMode = "beside" | "ahead" | "sniffing" | "looking_back";

type Props = {
  phaseRef: React.MutableRefObject<number>;
  strideRef: React.MutableRefObject<number>;
  /** Paid rest / hold: Beacon settles into a sit beside the walker */
  resting?: boolean;
};

/**
 * Beacon: Bernese Mountain Dog × Husky. Mostly black, white chest / paws /
 * snout blaze, subtle tan brows. He drifts between natural positions —
 * beside the walker, trotting ahead, pausing to sniff, looking back.
 */
export function Beacon3D({ phaseRef, strideRef, resting = false }: Props) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const legs = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)];
  const mode = useRef<BeaconMode>("beside");
  const modeUntil = useRef(6);
  const pos = useRef({ x: 0.95, z: 0.4 });

  /** Target offset (relative to walker) per behavior. */
  const targets: Record<BeaconMode, { x: number; z: number }> = useMemo(
    () => ({
      beside: { x: 0.95, z: 0.4 },
      ahead: { x: 0.6, z: -2.6 },
      sniffing: { x: 2.1, z: -0.6 },
      looking_back: { x: 0.75, z: -2.2 },
    }),
    [],
  );

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const stride = strideRef.current;
    const k = Math.min(1, dt * 4);
    // Paid rest: settle into a sit beside the walker, watching him
    const sitting = resting && stride < 0.25;

    // Rotate through behaviors on a gentle schedule (idle → stay beside).
    if (t > modeUntil.current) {
      const order: BeaconMode[] = ["beside", "ahead", "looking_back", "beside", "sniffing"];
      const next = order[Math.floor(t / 9) % order.length];
      mode.current = stride > 0.2 && !sitting ? next : "beside";
      modeUntil.current = t + 7 + (Math.floor(t) % 5);
    }

    // Ease toward the current behavior's offset; sniffing = quick dart out,
    // catching up from a sniff = faster trot.
    const target = targets[stride > 0.2 && !sitting ? mode.current : "beside"];
    const ease = mode.current === "sniffing" ? 1.6 : 0.9;
    pos.current.x += (target.x - pos.current.x) * Math.min(1, dt * ease);
    pos.current.z += (target.z - pos.current.z) * Math.min(1, dt * ease);

    if (root.current) {
      root.current.position.set(pos.current.x, 0, pos.current.z);
    }

    // Trot cycle: diagonal pairs, ~2.2× the walker's cadence.
    const sniffing = mode.current === "sniffing" && stride > 0.2 && !sitting;
    const gaitAmp = sniffing ? 0.08 : 0.55 * Math.max(stride, 0.05);
    const g = (phaseRef.current / 1.45) * Math.PI * 2 * 2.2 + 1.3;
    legs.forEach((leg, i) => {
      if (!leg.current) return;
      const pair = i === 0 || i === 3 ? 0 : Math.PI; // FL+RR vs FR+RL
      // Sitting: front legs planted straight, rear legs folded under
      const want = sitting
        ? i < 2
          ? 0
          : 1.15
        : Math.sin(g + pair) * gaitAmp;
      leg.current.rotation.x += (want - leg.current.rotation.x) * k;
    });

    if (body.current) {
      const wantY = sitting
        ? 0.34
        : 0.42 + Math.abs(Math.sin(g)) * 0.02 * stride + Math.sin(t * 1.7) * 0.004;
      const wantPitch = sitting ? -0.34 : sniffing ? 0.12 : 0;
      body.current.position.y += (wantY - body.current.position.y) * k;
      body.current.rotation.x += (wantPitch - body.current.rotation.x) * k;
    }
    if (head.current) {
      // Sitting: watch the walker. Sniffing: nose down. Looking back: turn
      // toward him. Else: forward with small curious tilts.
      const wantPitch = sitting
        ? 0.1 + Math.sin(t * 0.7) * 0.04
        : sniffing
          ? 0.85
          : Math.sin(t * 0.8) * 0.06;
      const wantYaw = sitting
        ? 0.55
        : mode.current === "looking_back" && stride > 0.2
          ? 2.4
          : Math.sin(t * 0.55) * 0.12;
      head.current.rotation.x += (wantPitch - head.current.rotation.x) * Math.min(1, dt * 4);
      head.current.rotation.y += (wantYaw - head.current.rotation.y) * Math.min(1, dt * 3);
    }
    if (tail.current) {
      // Always gently wagging; big happy sweeps while sitting with him.
      const wagSpeed = sitting ? 2.4 : mode.current === "ahead" ? 9 : 5.5;
      const wagAmp = sitting ? 0.45 : mode.current === "ahead" ? 0.5 : 0.3;
      tail.current.rotation.y = Math.sin(t * wagSpeed) * wagAmp;
    }
  });

  const legPositions: Array<[number, number, number]> = [
    [0.11, 0.32, -0.22], // FL
    [-0.11, 0.32, -0.22], // FR
    [0.11, 0.32, 0.24], // RL
    [-0.11, 0.32, 0.24], // RR
  ];

  return (
    <group ref={root}>
      {/* Legs: black upper, white paw */}
      {legPositions.map((p, i) => (
        <group key={i} ref={legs[i]} position={p}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.042, 0.16, 6, 8]} />
            <meshStandardMaterial color={COLORS.coat} roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.26, 0.01]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={COLORS.white} roughness={0.9} />
          </mesh>
        </group>
      ))}

      <group ref={body}>
        {/* Fluffy body — slightly chunky */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.19, 0.4, 8, 12]} />
          <meshStandardMaterial color={COLORS.coat} roughness={0.95} />
        </mesh>
        {/* White chest bib */}
        <mesh position={[0, -0.03, -0.26]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial color={COLORS.white} roughness={0.9} />
        </mesh>
        {/* Ruff fluff */}
        <mesh position={[0, 0.06, -0.2]}>
          <sphereGeometry args={[0.17, 10, 10]} />
          <meshStandardMaterial color={COLORS.coat} roughness={0.95} />
        </mesh>

        {/* Head */}
        <group ref={head} position={[0, 0.16, -0.34]}>
          <mesh castShadow>
            <sphereGeometry args={[0.135, 14, 14]} />
            <meshStandardMaterial color={COLORS.coat} roughness={0.95} />
          </mesh>
          {/* White blaze up the forehead */}
          <mesh position={[0, 0.05, -0.1]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.045, 0.14, 0.05]} />
            <meshStandardMaterial color={COLORS.white} roughness={0.9} />
          </mesh>
          {/* Snout — white */}
          <mesh position={[0, -0.035, -0.13]}>
            <boxGeometry args={[0.09, 0.075, 0.12]} />
            <meshStandardMaterial color={COLORS.white} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.015, -0.195]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial color={COLORS.nose} roughness={0.4} />
          </mesh>
          {/* Tan brows — the Bernese signature */}
          {[-0.055, 0.055].map((x) => (
            <mesh key={x} position={[x, 0.065, -0.115]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color={COLORS.tan} roughness={0.9} />
            </mesh>
          ))}
          {/* Floppy-tipped ears */}
          {[-0.09, 0.09].map((x) => (
            <mesh
              key={x}
              position={[x, 0.115, 0.01]}
              rotation={[-0.25, 0, x > 0 ? -0.45 : 0.45]}
              castShadow
            >
              <coneGeometry args={[0.045, 0.11, 8]} />
              <meshStandardMaterial color={COLORS.coat} roughness={0.95} />
            </mesh>
          ))}
        </group>

        {/* Collar */}
        <mesh position={[0, 0.1, -0.27]} rotation={[Math.PI / 2 - 0.5, 0, 0]}>
          <torusGeometry args={[0.125, 0.022, 8, 16]} />
          <meshStandardMaterial color={COLORS.collar} roughness={0.8} />
        </mesh>

        {/* Plumed tail, carried high */}
        <group ref={tail} position={[0, 0.12, 0.3]}>
          <mesh position={[0, 0.1, 0.08]} rotation={[0.7, 0, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.24, 6, 8]} />
            <meshStandardMaterial color={COLORS.coat} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.22, 0.14]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={COLORS.white} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
