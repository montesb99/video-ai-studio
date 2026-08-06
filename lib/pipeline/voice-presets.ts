export type VoicePreset = "natural" | "energico" | "narracion";

export type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
};

// docs/03-INTEGRATIONS.md — valores exactos de los 3 presets de síntesis.
export const VOICE_PRESETS: Record<VoicePreset, VoiceSettings> = {
  natural: { stability: 0.5, similarity_boost: 0.75, style: 0.0, speed: 1.0 },
  energico: { stability: 0.35, similarity_boost: 0.75, style: 0.45, speed: 1.08 },
  narracion: { stability: 0.7, similarity_boost: 0.8, style: 0.15, speed: 0.95 },
};

export type StoredVoiceSettings = VoiceSettings & { preset: VoicePreset | "custom" };

export const DEFAULT_VOICE_SETTINGS: StoredVoiceSettings = { preset: "natural", ...VOICE_PRESETS.natural };
