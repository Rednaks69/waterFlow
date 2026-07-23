# r3f-water-caustics

Interactive water caustics effect for **React Three Fiber** — GPU-based fluid simulation with chromatic aberration, mouse interaction, and a clean **Provider + Hook** API.

> Based on [diver-jay/r3f-drei-water-caustics-effect](https://github.com/diver-jay/r3f-drei-water-caustics-effect) (MIT License).

---

## Installation

```bash
npm install r3f-water-caustics
# peer deps (if not already installed)
npm install three @react-three/fiber react
```

---

## Quick Start

```tsx
import { Canvas } from "@react-three/fiber";
import {
  WaterCausticsProvider,
  CausticsInteractionPlane,
  useWaterCaustics,
  projectedCausticsVertexShader,
  projectedCausticsFragmentShader,
} from "r3f-water-caustics";
import { useMemo } from "react";
import * as THREE from "three";

// A mesh that receives caustics
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
    [uniforms]
  );

  return (
    <mesh position={[-2, 1, 0]}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [3, 2, 6] }}>
      <ambientLight intensity={0.5} />
      <WaterCausticsProvider position={[0, 0, 0]} size={10} enableAutoDrops>
        <CausticsInteractionPlane />
        <CausticsSphere />
      </WaterCausticsProvider>
    </Canvas>
  );
}
```

---

## API

### `<WaterCausticsProvider>`

Manages the GPU water simulation and provides shared uniforms to child components via context.

| Prop                  | Type              | Default              | Description                              |
| --------------------- | ----------------- | -------------------- | ---------------------------------------- |
| `position`            | `[x, y, z]`       | `[0, 0, 0]`          | World-space origin of the water plane    |
| `size`                | `number`          | `10`                 | Width/depth of the simulated water area  |
| `enableAutoDrops`     | `boolean`         | `true`               | Randomly drops ripples over time         |
| `chromaticAberration` | `number`          | `0.005`              | RGB split intensity on caustic edges     |
| `waterSurfaceY`       | `number`          | `5`                  | Y position of the water surface          |
| `depthColor`          | `string`          | `"#66e5ff"`          | Tint applied to underwater surfaces      |
| `depthDistance`       | `number`          | `5`                  | Falloff distance for depth coloring      |
| `lightDir`            | `[x, y, z]`       | `[0.667, 0.667, -0.333]` | Direction of caustic light           |

### `useWaterCaustics()`

Hook to access the shared simulation context. Must be called inside `<WaterCausticsProvider>`.

```ts
const { uniforms, addDrop } = useWaterCaustics();
```

| Field      | Type                                          | Description                                  |
| ---------- | --------------------------------------------- | -------------------------------------------- |
| `uniforms` | `WaterCausticsUniforms`                       | Shared `{ value }` objects, auto-updated     |
| `addDrop`  | `(x, y, radius?, strength?) => void`          | Programmatically add a ripple (-1 to 1 coords) |

### `<CausticsInteractionPlane>`

An invisible plane that converts pointer events into ripples.

| Prop                    | Type      | Default | Description            |
| ----------------------- | --------- | ------- | ---------------------- |
| `enableMouseInteraction` | `boolean` | `true`  | Enable/disable pointer |

---

## Shaders

All GLSL shaders are exported so you can use them in your own `THREE.ShaderMaterial`:

```ts
import {
  projectedCausticsVertexShader,    // World XZ → water UV
  projectedCausticsFragmentShader,  // Generic mesh caustics (uses baseColor uniform)
  projectedTileCausticsFragmentShader, // PBR tile caustics with refraction
  waterSurfaceVertexShader,         // For CustomShaderMaterial (CSM) — displaces vertices
  poolCausticsVertexShader,         // Passes world normal for pool walls
  poolCausticsFragmentShader,       // Pool interior with underwater blend
  bubbleVertexShader,               // Fresnel bubble rim
  bubbleFragmentShader,             // Iridescent transparency
} from "r3f-water-caustics";
```

### Tile surface example

```tsx
import { projectedCausticsVertexShader, projectedTileCausticsFragmentShader } from "r3f-water-caustics";

function CausticsTile() {
  const { uniforms } = useWaterCaustics();
  const [colorTex, normalTex, roughnessTex] = useLoader(THREE.TextureLoader, [
    "/tiles_color.jpg",
    "/tiles_normal.jpg",
    "/tiles_roughness.jpg",
  ]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          ...uniforms,
          tileColor: { value: colorTex },
          tileNormal: { value: normalTex },
          tileRoughness: { value: roughnessTex },
          tileRepeat: { value: new THREE.Vector2(4, 4) },
        },
        vertexShader: projectedCausticsVertexShader,
        fragmentShader: projectedTileCausticsFragmentShader,
        side: THREE.DoubleSide,
      }),
    [uniforms, colorTex, normalTex, roughnessTex]
  );

  return (
    <mesh rotation={[-Math.PI * 0.5, 0, 0]} scale={10}>
      <planeGeometry />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
```

---

## How it Works

1. **GPU simulation** — A ping-pong render target runs a spring-damper wave equation each frame using custom GLSL fragment shaders.
2. **Normal map** — A Sobel filter pass converts the height field into a gradient/normal texture.
3. **Shared uniforms** — `WaterCausticsProvider` creates `{ value }` uniform objects once and mutates them each frame. Child `ShaderMaterial`s spread these references and update automatically without their own `useFrame`.
4. **World-space projection** — The vertex shader passes `vWorldPosition`, and the fragment shader projects the XZ coordinates onto the water texture, so any arbitrarily-shaped mesh receives correct caustics.

---

## License

MIT — see [LICENSE](./LICENSE).
