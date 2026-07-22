"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { BiomePalette } from "@/lib/scene/presets";
import { tileRandoms } from "@/lib/scene/presets";

/** Meters of road covered by one procedural tile. */
const TILE = 22;
/** Tiles rendered ahead of (and one behind) the camera. */
const TILES_AHEAD = 7;

type WorldProps = {
  /** Meters advanced since page load — drives world motion. */
  offsetRef: React.MutableRefObject<number>;
  /**
   * Absolute tile index at page load (journey meters / TILE). Keeps tile
   * SEEDS tied to real journey distance (never loops, consistent across
   * clients) while local coordinates stay small for float precision.
   */
  tileOrigin: number;
  palette: BiomePalette;
  windowGlow: number;
};

function Conifer({ x, z, s, tint }: { x: number; z: number; s: number; tint: string }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 1, 6]} />
        <meshStandardMaterial color="#4a3527" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.1 + i * 0.78, 0]} castShadow>
          <coneGeometry args={[1.15 - i * 0.3, 1.3, 7]} />
          <meshStandardMaterial color={tint} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Deciduous({ x, z, s, tint, trunk }: { x: number; z: number; s: number; tint: string; trunk: string }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.16, 1.4, 6]} />
        <meshStandardMaterial color={trunk} roughness={1} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.95, 9, 8]} />
        <meshStandardMaterial color={tint} roughness={1} />
      </mesh>
      <mesh position={[0.55, 1.5, 0.2]} castShadow>
        <sphereGeometry args={[0.6, 8, 7]} />
        <meshStandardMaterial color={tint} roughness={1} />
      </mesh>
    </group>
  );
}

function House({ x, z, flip, glow, tone }: { x: number; z: number; flip: boolean; glow: number; tone: number }) {
  const wall = tone < 0.4 ? "#e8e4da" : tone < 0.7 ? "#c9cfd4" : "#9a5b45";
  const face = flip ? 1 : -1;
  return (
    <group position={[x, 0, z]} rotation={[0, flip ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[4.4, 2.3, 3.4]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.15, 1.5, 4]} />
        <meshStandardMaterial color="#4a4642" roughness={1} />
      </mesh>
      <mesh position={[1.2, 3.1, 0.8]}>
        <boxGeometry args={[0.45, 1, 0.45]} />
        <meshStandardMaterial color="#7a5a48" roughness={1} />
      </mesh>
      {/* Warm windows facing the road */}
      {[-1.2, 1.2].map((wx) => (
        <mesh key={wx} position={[wx, 1.25, face * 1.71]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            color="#ffc978"
            emissive="#ffb45e"
            emissiveIntensity={0.15 + glow * 2.4}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[0, 0.95, face * 1.71]}>
        <planeGeometry args={[0.8, 1.8]} />
        <meshStandardMaterial color="#5c4a38" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** One 22 m stretch of road world, fully determined by its absolute index. */
function Tile({
  index,
  localIndex,
  palette,
  windowGlow,
}: {
  /** Absolute journey tile — seeds the content */
  index: number;
  /** Position tile relative to page-load origin — keeps coords small */
  localIndex: number;
  palette: BiomePalette;
  windowGlow: number;
}) {
  const r = tileRandoms(index, 24);
  const z0 = -localIndex * TILE;
  const [deciduousTint, coniferTint] =
    r[0] < 0.5
      ? [palette.deciduous[0], palette.conifer[1]]
      : [palette.deciduous[1], palette.conifer[0]];

  const trees: React.ReactElement[] = [];
  const treeCount = Math.round(palette.treeDensity * 6);
  // Low understory brush hugging the road edge
  for (let side = 0; side < 2; side += 1) {
    const sign = side === 0 ? -1 : 1;
    for (let i = 0; i < 2; i += 1) {
      const k = 12 + side * 2 + i;
      trees.push(
        <mesh
          key={`b${side}-${i}`}
          position={[
            sign * (6.4 + r[k] * 2.6),
            0.32,
            z0 - r[(k + 5) % 24] * TILE,
          ]}
          castShadow
        >
          <sphereGeometry args={[0.45 + r[(k + 9) % 24] * 0.45, 8, 7]} />
          <meshStandardMaterial
            color={r[(k + 3) % 24] < 0.5 ? palette.deciduous[0] : palette.conifer[1]}
            roughness={1}
          />
        </mesh>,
      );
    }
  }
  for (let side = 0; side < 2; side += 1) {
    const sign = side === 0 ? -1 : 1;
    for (let i = 0; i < treeCount; i += 1) {
      const k = 2 + side * treeCount + i;
      const x = sign * (9.5 + r[k] * 15);
      const z = z0 - r[(k + 7) % 24] * TILE;
      const s = 1.5 + r[(k + 11) % 24] * 1.6;
      if (r[(k + 3) % 24] < 0.45) {
        trees.push(<Conifer key={`c${side}-${i}`} x={x} z={z} s={s} tint={coniferTint} />);
      } else {
        trees.push(
          <Deciduous key={`d${side}-${i}`} x={x} z={z} s={s} tint={deciduousTint} trunk={palette.trunk} />,
        );
      }
    }
  }

  const hasHouse = r[1] < palette.houseDensity;
  const houseSide = r[20] < 0.5 ? -1 : 1;
  const hasFence = r[21] < 0.3;
  const fenceSide = r[22] < 0.5 ? -1 : 1;

  return (
    <group>
      {/* Center-line dashes */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0, 0.012, z0 - i * (TILE / 5) - 1]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.14, 1.6]} />
          <meshStandardMaterial color={palette.roadLine} roughness={0.9} />
        </mesh>
      ))}

      {trees}

      {hasHouse ? (
        <House
          x={houseSide * (13.5 + r[19] * 3)}
          z={z0 - 6 - r[18] * 10}
          flip={houseSide < 0}
          glow={windowGlow}
          tone={r[17]}
        />
      ) : null}

      {hasHouse ? (
        /* Mailbox by the road on the house side */
        <group position={[houseSide * 4.7, 0, z0 - 6 - r[18] * 10]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1, 6]} />
            <meshStandardMaterial color="#6b5a48" roughness={1} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[0.22, 0.18, 0.34]} />
            <meshStandardMaterial color="#3b4b5c" roughness={0.8} />
          </mesh>
        </group>
      ) : null}

      {hasFence
        ? [0, 1, 2, 3, 4].map((i) => (
            <group key={i} position={[fenceSide * 6.2, 0, z0 - i * 4.4 - 2]}>
              <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.09, 0.8, 0.09]} />
                <meshStandardMaterial color="#8a7a62" roughness={1} />
              </mesh>
              <mesh position={[0, 0.62, -2.2]}>
                <boxGeometry args={[0.05, 0.07, 4.4]} />
                <meshStandardMaterial color="#8a7a62" roughness={1} />
              </mesh>
            </group>
          ))
        : null}

      {/* Telephone pole every other tile */}
      {index % 2 === 0 ? (
        <group position={[5.6, 0, z0 - 4]}>
          <mesh position={[0, 2.6, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 5.2, 6]} />
            <meshStandardMaterial color="#5c4a38" roughness={1} />
          </mesh>
          <mesh position={[0, 4.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
            <meshStandardMaterial color="#5c4a38" roughness={1} />
          </mesh>
        </group>
      ) : null}

      {/* Dense far treeline wall on both sides */}
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          position={[sign * (30 + r[23] * 6), 3, z0 - TILE / 2]}
          castShadow={false}
        >
          <boxGeometry args={[8, 6 + r[16] * 3, TILE + 2]} />
          <meshStandardMaterial color={palette.treeline} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Mid-distance parallax band: slabs of forest sliding slower than the
 *  roadside, selling depth between the near trees and the far hills. */
function ParallaxBand({
  offsetRef,
  color,
  factor,
  x,
  height,
}: {
  offsetRef: React.MutableRefObject<number>;
  color: string;
  factor: number;
  x: number;
  height: number;
}) {
  const group = useRef<Group>(null);
  const [base, setBase] = useState(0);
  const last = useRef(0);
  const BAND_TILE = 70;

  useFrame(() => {
    const scaled = offsetRef.current * factor;
    if (group.current) group.current.position.z = scaled;
    const b = Math.floor(scaled / BAND_TILE);
    if (b !== last.current) {
      last.current = b;
      setBase(b);
    }
  });

  const indices: number[] = [];
  for (let i = -1; i <= 4; i += 1) indices.push(base + i);

  return (
    <group ref={group}>
      {indices.map((i) => {
        const r = tileRandoms(i * 31 + Math.round(x), 4);
        return (
          <group key={i} position={[0, 0, -i * BAND_TILE]}>
            {[-1, 1].map((sign) => (
              <mesh
                key={sign}
                position={[
                  sign * (x + r[0] * 12),
                  (height + r[3] * 4) / 2,
                  -BAND_TILE / 2,
                ]}
              >
                <boxGeometry args={[24 + r[2] * 18, height + r[3] * 4, BAND_TILE + 8]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * The moving world. The walker stays at the origin; this group slides toward
 * +Z as he advances. Tiles are keyed by ABSOLUTE index derived from total
 * meters walked, so scenery never repeats — this is a road, not a loop.
 */
export function Roadside({ offsetRef, tileOrigin, palette, windowGlow }: WorldProps) {
  const world = useRef<Group>(null);
  const [baseTile, setBaseTile] = useState(0);
  const lastBase = useRef(0);

  useFrame(() => {
    const offset = offsetRef.current;
    if (world.current) world.current.position.z = offset;
    const base = Math.floor(offset / TILE);
    if (base !== lastBase.current) {
      lastBase.current = base;
      setBaseTile(base);
    }
  });

  const indices: number[] = [];
  for (let i = -1; i <= TILES_AHEAD; i += 1) indices.push(baseTile + i);

  return (
    <>
      {/* Static featureless surfaces (no visible texture to betray the treadmill) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -60]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color={palette.ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]} receiveShadow>
        <planeGeometry args={[7, 340]} />
        <meshStandardMaterial color={palette.road} roughness={0.95} />
      </mesh>
      {/* Soft grass shoulders */}
      {[-4.4, 4.4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, -60]} receiveShadow>
          <planeGeometry args={[1.8, 340]} />
          <meshStandardMaterial color={palette.groundEdge} roughness={1} />
        </mesh>
      ))}

      {/* Distant hills — buried spheres so only a soft ridge shows.
          Effectively at infinity, so they stay put. */}
      {[
        { x: -55, z: -150, s: 60, h: 24 },
        { x: 25, z: -170, s: 80, h: 30 },
        { x: 95, z: -150, s: 55, h: 20 },
      ].map((hill, i) => (
        <mesh key={i} position={[hill.x, hill.h - hill.s, hill.z]} scale={[1.6, 1, 0.8]}>
          <sphereGeometry args={[hill.s, 14, 10]} />
          <meshStandardMaterial color={palette.hills} roughness={1} />
        </mesh>
      ))}

      {/* Depth: two forest bands sliding slower than the roadside */}
      <ParallaxBand offsetRef={offsetRef} color={palette.treeline} factor={0.55} x={46} height={9} />
      <ParallaxBand offsetRef={offsetRef} color={palette.hills} factor={0.3} x={72} height={15} />

      <group ref={world}>
        {indices.map((i) => (
          <Tile
            key={tileOrigin + i}
            index={tileOrigin + i}
            localIndex={i}
            palette={palette}
            windowGlow={windowGlow}
          />
        ))}
      </group>
    </>
  );
}
