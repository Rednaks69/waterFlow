import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useMemo, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import {
  WaterCausticsProvider,
  CausticsInteractionPlane,
  useWaterCaustics,
  projectedCausticsVertexShader,
  projectedCausticsFragmentShader,
  poolCausticsVertexShader,
  poolCausticsFragmentShader,
} from "r3f-water-caustics";

import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { waterSurfaceVertexShader } from "r3f-water-caustics";

const POOL_SIZE = 10;
const WALL_HEIGHT = 5;
const WATER_Y = 4; // water surface sits at y=4, pool floor at y=0

// ─── Pool box (walls + floor) with tile shader ───────────────────────────────
function Pool() {
  const { uniforms } = useWaterCaustics();

  const [colorTex, normalTex, roughnessTex] = useLoader(THREE.TextureLoader, [
    "/tiles_color.jpg",
    "/tiles_normal.jpg",
    "/tiles_roughness.jpg",
  ]);

  useMemo(() => {
    [colorTex, normalTex, roughnessTex].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
  }, [colorTex, normalTex, roughnessTex]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          ...uniforms,
          tileColor: { value: colorTex },
          tileNormal: { value: normalTex },
          tileRoughness: { value: roughnessTex },
          tileRepeat: { value: new THREE.Vector2(3, 3) },
          wallHeight: { value: WALL_HEIGHT },
        },
        vertexShader: poolCausticsVertexShader,
        fragmentShader: poolCausticsFragmentShader,
      }),
    [uniforms, colorTex, normalTex, roughnessTex],
  );

  useEffect(() => () => material.dispose(), [material]);

  // boxGeometry center = position, so shift up by half wall height
  // so the bottom of the box sits at y=0 (pool floor)
  return (
    <mesh position={[0, WALL_HEIGHT / 2, 0]}>
      <boxGeometry args={[POOL_SIZE, WALL_HEIGHT, POOL_SIZE]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ─── Water surface (transparent, ripples on click/hover) ──────────────────────
function WaterSurface() {
  const { uniforms, addDrop } = useWaterCaustics();
  const lastDrop = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null);

  const waterPos = uniforms.waterPosition.value;
  const waterSize = uniforms.waterSize.value;

  const toSim = useCallback(
    (wx: number, wz: number) => ({
      x: ((wx - waterPos.x) / waterSize) * 2,
      y: ((wz - waterPos.z) / waterSize) * 2,
    }),
    [waterPos, waterSize],
  );

  const material = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: THREE.MeshPhysicalMaterial,
        vertexShader: waterSurfaceVertexShader,
        uniforms: {
          ...uniforms,
          heightScale: { value: 2.0 },
        },
        transmission: 1,
        ior: 1.33,
        thickness: 0.5,
        roughness: 0.05,
        metalness: 0,
        color: new THREE.Color("#88ccee"),
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER_Y, 0]}
      onPointerMove={(e) => {
        const now = performance.now();
        if (now - lastDrop.current < 50) return;
        lastDrop.current = now;
        const { x, y } = toSim((e as any).point.x, (e as any).point.z);
        addDrop(x, y, 0.02, 0.15);
      }}
      onPointerDown={(e) => {
        const { x, y } = toSim((e as any).point.x, (e as any).point.z);
        addDrop(x, y, 0.05, 0.5);
      }}>
      <planeGeometry args={[POOL_SIZE, POOL_SIZE, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ─── Sphere sitting on pool floor with projected caustics ────────────────────
function CausticsSphere() {
  const { uniforms } = useWaterCaustics();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          ...uniforms,
          baseColor: { value: new THREE.Color("#ff6b6b") },
        },
        vertexShader: projectedCausticsVertexShader,
        fragmentShader: projectedCausticsFragmentShader,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    // radius=0.8 → sits on pool floor (y=0) with bottom at y=0
    <mesh position={[0, 0.8, 0]}>
      <sphereGeometry args={[0.8, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [8, 8, 14], fov: 45 }}
        gl={{ antialias: true }}>
        <Environment preset="dawn" />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 5]} intensity={1.5} />

        <WaterCausticsProvider
          position={[0, 0, 0]}
          size={POOL_SIZE}
          enableAutoDrops={false}
          chromaticAberration={0.008}
          waterSurfaceY={WATER_Y}
          depthColor="#99bfdf"
          lightDir={[0.667, 0.667, -0.333]}>
          {/* Invisible interaction plane at water surface level */}
          {/* <CausticsInteractionPlane /> */}

          {/* Pool walls + floor */}
          <Pool />

          {/* Transparent water surface at top of pool */}
          <WaterSurface />

          {/* Sphere on pool floor receiving caustics */}
          <CausticsSphere />
        </WaterCausticsProvider>

        <OrbitControls
          target={[0, 2, 0]}
          minDistance={4}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
