

https://github.com/user-attachments/assets/f89580fc-a6a2-432a-98ee-a6fbec355082


# Project Summary: waterFlow

## Goal
**waterFlow** is an interactive 3D water visualization app built with React Three Fiber (R3F) and Three.js. It renders a reflective, rippling water pool — complete with caustics light patterns on surfaces beneath the water — powered by a GPU wave-simulation library. The scene responds to pointer input (drops and ripples) and supports orbital camera navigation.

## Where It Lives
- GitHub: https://github.com/Rednaks69/waterFlow
- Local copy: `/c/Users/Mega Pc/Downloads/waterFlow-repo`

## Origin / Relationship to r3f-water-caustics
waterFlow is a consumer application that uses the **r3f-water-caustics** library (a React Three Fiber plugin for interactive water caustics). The library is installed as a local dependency (`file:../../r3f-water-caustics-lib`) inside the repo, and waterFlow wires it into a full 3D scene.

## Tech Stack
- **Build tool**: Vite 8 (`vite.config.ts` with `@vitejs/plugin-react`)
- **UI / 3D**: React 19, React Three Fiber 9.6.1, @react-three/drei 10.7.7
- **3D engine**: Three.js 0.184.0
- **Water surface material**: `three-custom-shader-material` 6.4.0 (use with `MeshPhysicalMaterial` for transmission, ior, thickness, roughness)
- **TypeScript**: ~6.0.2
- **Linting / formatting**: ESLint 10 + typescript-eslint
- **Environment**: HDR `Environment preset="dawn"`, `ambientLight`, `directionalLight`, `OrbitControls`

## Architecture
The app is structured as one `App` component (`src/App.tsx`) that composes three scene pieces inside a single `WaterCausticsProvider`:

1. **Pool** — an invisible box with `poolCausticsVertexShader` + `poolCausticsFragmentShader` applying PBR tile textures (color/normal/roughness) to the walls and floor, with `tileRepeat`, `wallHeight`, and shared water uniforms.
2. **WaterSurface** — a transparent, rippling plane at `y=4` using `waterSurfaceVertexShader` + a `CustomShaderMaterial` wrapping `MeshPhysicalMaterial` (transmission 1, ior 1.33, thickness 0.5, rough 0.05, color `#88ccee`, opacity 0.75). Pointer move/down emits drops via `addDrop`.
3. **CausticsSphere** — a sphere on the pool floor receiving projected caustics via `projectedCausticsVertexShader` + `projectedCausticsFragmentShader` (with a `baseColor` uniform).

All three share a single `WaterCausticsProvider` that runs a GPU wave equation (ping-pong render target + spring-damper), a Sobel normal pass, and broadcasts `uniforms` via React context so the meshes update automatically each frame without subscribing to `useFrame` individually.

## How the Scene Works
- **Water surface placement**: pool size 10, wall height 5, water sits at `y=4`, floor at `y=0`.
- **Interaction**:
  - `onPointerMove` → gentle ripple (`addDrop(x, y, 0.02, 0.15)`) with 50 ms debounce.
  - `onPointerDown` → stronger ripple (`addDrop(x, y, 0.05, 0.5)`).
  - `toSim()` maps world `(wx, wz)` onto the simulation grid (normalized to [-1, 1]).
- **Camera**: `OrbitControls` with `target={[0,2,0]}`, `minDistance=4`, `maxDistance=30`, `maxPolarAngle=π/2` (top-down pool view).
- **Provider props**: `position={[0,0,0]}`, `size={10}`, `enableAutoDrops={false}`, `chromaticAberration={0.008}`, `waterSurfaceY={4}`, `depthColor="#99bfdf"`, `lightDir={[0.667,0.667,-0.333]}`.

## Assets / Resources
- `public/water-caustics.gif` — demo/gif of the water caustics effect
- `public/tiles_color.jpg`, `public/tiles_normal.jpg`, `public/tiles_roughness.jpg` — PBR tile textures used by the pool shader
- `public/favicon.svg`, `public/icons.svg`, `public/skymap.jpg` — app assets
- `index.html` sets the page title to `my-caustics-test` (the repo's page title; the project is named waterFlow)

## API Dependencies
`r3f-water-caustics` (local) exports, used in waterFlow's `App.tsx`:
- `WaterCausticsProvider` — wraps the scene and provides shared `uniforms` + `addDrop`
- `useWaterCaustics()` — returns `{ uniforms, addDrop }`
- `projectedCausticsVertexShader` / `projectedCausticsFragmentShader` — generic mesh caustics
- `poolCausticsVertexShader` / `poolCausticsFragmentShader` — tile caustics with refraction for walls/floor
- `waterSurfaceVertexShader` — displaces the water surface mesh

## Design Themes
1. **Composable water scene** — pool, surface, and caustics sphere are separate components sharing one GPU simulation context.
2. **Reflective + transparent water** — the surface uses physically-based transmission (ior 1.33, thickness, transmission 1) rather than a flat shader.
3. **Interactive ripples** — pointer move and click both generate drops; debouncing keeps the simulation responsive.
4. **Tile-based PBR pool** — walls and floor use normal/roughness/color maps plus the water's caustic lighting for a realistic underwater look.
5. **One-context-per-scene** — `WaterCausticsProvider` centralizes the simulation so adding new caustics-lit meshes only requires spreading `uniforms` into a `ShaderMaterial`.

## Out of Scope / Notes
- The project page title (`index.html`) still says `my-caustics-test` — renaming it to `waterFlow` is a follow-up you may want to apply.
- The library (`r3f-water-caustics`) is bundled locally via `file:`; it is not published as a separate npm dependency.
- No build/scripts were run so far; `npm run dev` (Vite) is the way to preview the scene.
- The repo's root `README.md` currently only contains a link to a hosted demo video — consider expanding it with project description, controls, and credits.
