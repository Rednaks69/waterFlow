// Components & Hooks
export {
  WaterCausticsProvider,
  CausticsInteractionPlane,
  useWaterCaustics,
} from "./lib/provider";

// Shaders
export {
  // Simulation shaders (internal use, but exposed for advanced customization)
  vertexShader,
  dropFragmentShader,
  updateFragmentShader,
  normalFragmentShader,
  // Projected caustics
  projectedCausticsVertexShader,
  projectedCausticsFragmentShader,
  projectedTileCausticsFragmentShader,
  // Water surface (CustomShaderMaterial)
  waterSurfaceVertexShader,
  // Pool caustics
  poolCausticsVertexShader,
  poolCausticsFragmentShader,
  // Bubble
  bubbleVertexShader,
  bubbleFragmentShader,
} from "./lib/shaders";

// Types
export type { WaterCausticsUniforms, WaterCausticsContextValue } from "./lib/provider";
