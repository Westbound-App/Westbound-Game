"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BackSide, Color, ShaderMaterial, Vector3 } from "three";
import type { Group } from "three";
import type { SceneBiome } from "@/lib/places/types";
import type { SeasonId } from "@/lib/atmosphere/season";
import {
  BIOME_PALETTES,
  LIGHTING,
  seasonalize,
  type LightingPreset,
  type TimeOfDayId,
} from "@/lib/scene/presets";
import { Beacon3D } from "@/components/scene/Beacon3D";
import { Roadside } from "@/components/scene/Roadside";
import { Walker3D } from "@/components/scene/Walker3D";

const CLOUD_TINT: Record<TimeOfDayId, string> = {
  day: "#ffffff",
  golden_hour: "#ffd9b0",
  dusk: "#b78a97",
  night: "#26365a",
};

export type LivingSceneProps = {
  timeOfDay: TimeOfDayId;
  biome: SceneBiome;
  season: SeasonId;
  /** Authoritative speed; the scene clamps to a pleasant visual range */
  speedMps: number;
  walking: boolean;
  /** True during paid rests / holds — Beacon sits, the pair settles */
  resting?: boolean;
  /** Total journey meters at page load — seeds the world so it never loops */
  journeyMeters: number;
  reduceMotion: boolean;
};

/** Big inverted sphere with a three-stop vertical gradient. */
function GradientSky({ preset }: { preset: LightingPreset }) {
  const material = useMemo(() => {
    return new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new Color(preset.skyTop) },
        horizonColor: { value: new Color(preset.skyHorizon) },
        bottomColor: { value: new Color(preset.skyBottom) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          vec3 c = h > 0.0
            ? mix(horizonColor, topColor, pow(min(h * 1.7, 1.0), 0.75))
            : mix(horizonColor, bottomColor, min(-h * 3.0, 1.0));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
  }, [preset]);

  return (
    <mesh material={material} renderOrder={-2}>
      <sphereGeometry args={[300, 24, 16]} />
    </mesh>
  );
}

/** Visible sun / moon disc with a soft glow halo. */
function SunDisc({ preset }: { preset: LightingPreset }) {
  const position = useMemo(() => {
    const v = new Vector3(...preset.sunPosition).normalize().multiplyScalar(270);
    return [v.x, Math.max(v.y, 6), v.z] as [number, number, number];
  }, [preset]);

  return (
    <group position={position}>
      <mesh renderOrder={-1}>
        <sphereGeometry args={[preset.sunDiscSize, 16, 16]} />
        <meshBasicMaterial color={preset.sunDiscColor} toneMapped={false} fog={false} />
      </mesh>
      <mesh renderOrder={-1}>
        <sphereGeometry args={[preset.sunDiscSize * 2.6, 16, 16]} />
        <meshBasicMaterial
          color={preset.sunDiscColor}
          transparent
          opacity={0.18}
          fog={false}
        />
      </mesh>
    </group>
  );
}

/** A few soft drifting cloud clusters. */
function Clouds({ tint }: { tint: string }) {
  const group = useRef<Group>(null);
  const seeds = useMemo(
    () => [
      { x: -90, y: 52, z: -140, s: 16 },
      { x: -20, y: 64, z: -170, s: 22 },
      { x: 60, y: 48, z: -150, s: 14 },
      { x: 120, y: 58, z: -180, s: 19 },
      { x: -150, y: 60, z: -160, s: 18 },
    ],
    [],
  );

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((cloud, i) => {
      cloud.position.x += dt * (0.5 + i * 0.12);
      if (cloud.position.x > 200) cloud.position.x = -200;
    });
  });

  return (
    <group ref={group}>
      {seeds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[j * c.s * 0.5 - c.s * 0.5, j === 1 ? c.s * 0.14 : 0, 0]}>
              <sphereGeometry args={[c.s * (j === 1 ? 0.55 : 0.4), 10, 8]} />
              <meshBasicMaterial color={tint} transparent opacity={0.55} fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Gentle handheld camera behind and above the pair. */
function CameraRig({ reduceMotion }: { reduceMotion: boolean }) {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const sway = reduceMotion ? 0.15 : 1;
    camera.position.set(
      1.15 + Math.sin(t * 0.5) * 0.07 * sway,
      2.45 + Math.sin(t * 0.85) * 0.05 * sway,
      7.0,
    );
    camera.lookAt(1.45, 1.25, -9);
  });
  return null;
}

/** Integrates world motion + gait each frame from authoritative speed. */
function Advance({
  offsetRef,
  strideRef,
  targetSpeed,
}: {
  offsetRef: React.MutableRefObject<number>;
  strideRef: React.MutableRefObject<number>;
  targetSpeed: number;
}) {
  const speed = useRef(0);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    speed.current += (targetSpeed - speed.current) * Math.min(1, dt * 1.5);
    offsetRef.current += speed.current * dt;
    const targetStride = targetSpeed > 0.05 ? 1 : 0;
    strideRef.current += (targetStride - strideRef.current) * Math.min(1, dt * 2);
  });
  return null;
}

export function LivingScene({
  timeOfDay,
  biome,
  season,
  speedMps,
  walking,
  resting = false,
  journeyMeters,
  reduceMotion,
}: LivingSceneProps) {
  const preset = LIGHTING[timeOfDay];
  const palette = useMemo(
    () => seasonalize(BIOME_PALETTES[biome], season),
    [biome, season],
  );

  const offsetRef = useRef(0);
  const strideRef = useRef(0);
  /** World seeds come from real journey distance — scenery never repeats. */
  const tileOrigin = useMemo(
    () => Math.floor(Math.max(0, journeyMeters) / 22),
    [journeyMeters],
  );

  // Authoritative speed, clamped to a range that reads well on screen.
  const targetSpeed = walking ? Math.min(Math.max(speedMps, 0.9), 1.7) : 0;

  useEffect(() => {
    // Reset local motion when the seed jumps (route change / new payload epoch)
    offsetRef.current = 0;
  }, [tileOrigin]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 42, near: 0.1, far: 700, position: [0, 2.45, 7] }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={[preset.fogColor, preset.fogNear, preset.fogFar]} />

      <GradientSky preset={preset} />
      <SunDisc preset={preset} />
      {preset.showStars ? (
        <Stars radius={280} depth={30} count={1500} factor={3.2} fade speed={0.4} />
      ) : null}
      <Clouds tint={CLOUD_TINT[preset.id]} />

      <ambientLight intensity={preset.ambientIntensity} />
      <hemisphereLight
        color={preset.hemiSky}
        groundColor={preset.hemiGround}
        intensity={preset.hemiIntensity}
      />
      <directionalLight
        position={preset.sunPosition}
        color={preset.sunColor}
        intensity={preset.sunIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={30}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
      />

      <Roadside
        offsetRef={offsetRef}
        tileOrigin={tileOrigin}
        palette={palette}
        windowGlow={preset.windowGlow}
      />

      {/* The pair, walking west (-Z), fixed at the origin of the treadmill.
          Both figures are modeled facing -Z, so the camera sees their backs.
          Offset to the right lane — nobody walks the center line. */}
      <group position={[1.7, 0, 0]}>
        <Walker3D phaseRef={offsetRef} strideRef={strideRef} />
        <Beacon3D phaseRef={offsetRef} strideRef={strideRef} resting={resting} />
      </group>

      <CameraRig reduceMotion={reduceMotion} />
      <Advance offsetRef={offsetRef} strideRef={strideRef} targetSpeed={targetSpeed} />

      <EffectComposer>
        <Bloom intensity={0.45} luminanceThreshold={0.78} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
