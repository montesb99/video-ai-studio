"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VOICE_PRESETS, type VoicePreset, type StoredVoiceSettings } from "@/lib/pipeline/voice-presets";

const PRESETS: VoicePreset[] = ["natural", "energico", "narracion"];

const SLIDERS: Array<{ key: keyof typeof VOICE_PRESETS.natural; min: number; max: number; step: number }> = [
  { key: "stability", min: 0, max: 1, step: 0.05 },
  { key: "similarity_boost", min: 0, max: 1, step: 0.05 },
  { key: "style", min: 0, max: 1, step: 0.05 },
  { key: "speed", min: 0.7, max: 1.2, step: 0.01 },
];

export function PresetPicker({
  settings,
  disabled,
  onChange,
}: {
  settings: StoredVoiceSettings;
  disabled: boolean;
  onChange: (settings: StoredVoiceSettings) => void;
}) {
  const t = useTranslations("voice.presets");
  const [advancedOpen, setAdvancedOpen] = useState(settings.preset === "custom");

  function selectPreset(preset: VoicePreset) {
    onChange({ preset, ...VOICE_PRESETS[preset] });
  }

  function updateSlider(key: keyof typeof VOICE_PRESETS.natural, value: number) {
    onChange({ ...settings, preset: "custom", [key]: value });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            aria-pressed={settings.preset === preset}
            onClick={() => selectPreset(preset)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              settings.preset === preset
                ? "border-[rgba(124,92,255,.5)] bg-[rgba(124,92,255,.1)] text-foreground"
                : "border-white/6 text-white/68 hover:bg-white/[0.02]"
            }`}
          >
            {t(preset)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        aria-expanded={advancedOpen}
        aria-controls="voice-advanced-panel"
        className="mt-3 text-xs text-white/44 underline decoration-dotted underline-offset-2 hover:text-white/68"
      >
        {t("advancedToggle")}
      </button>

      {advancedOpen && (
        <div id="voice-advanced-panel" className="mt-3 space-y-3 rounded-xl border border-white/6 bg-surface-panel p-3">
          {SLIDERS.map(({ key, min, max, step }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs text-white/44">
                <span>{t(`fields.${key}`)}</span>
                <span>{settings[key].toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={settings[key]}
                disabled={disabled}
                onChange={(e) => updateSlider(key, Number(e.target.value))}
                className="w-full accent-brand-accent"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
