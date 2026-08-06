import "server-only";
import { getProjectOrNotFound, type ProjectRow } from "../shared";
import { DEFAULT_VOICE_SETTINGS, type StoredVoiceSettings } from "@/lib/pipeline/voice-presets";

export type VoiceOption = {
  id: string;
  name: string;
  isCloned: boolean;
  category: string | null;
  previewUrl: string | null;
};

export type VoiceScreenData = {
  project: ProjectRow;
  hasConfirmedScript: boolean;
  voices: VoiceOption[];
  selectedVoiceId: string | null;
  voiceSettings: StoredVoiceSettings;
  generatedAudioUrl: string | null;
  scenesReady: boolean;
};

export async function getVoiceScreenData(projectId: string): Promise<VoiceScreenData> {
  const { project, workspaceId, supabase } = await getProjectOrNotFound(projectId);

  const [{ data: projectRow }, { data: script }, { data: voices }, { data: scenes }] = await Promise.all([
    supabase.from("projects").select("voice_id, voice_settings_json").eq("id", projectId).single(),
    supabase.from("scripts").select("id").eq("project_id", projectId).eq("is_confirmed", true).maybeSingle(),
    supabase
      .from("voices")
      .select("id, name, is_cloned, category, preview_url")
      .eq("workspace_id", workspaceId)
      .order("name"),
    supabase.from("scenes").select("audio_asset_id").eq("project_id", projectId),
  ]);

  const scenesReady = (scenes ?? []).length > 0 && (scenes ?? []).every((s) => s.audio_asset_id);
  const audioAssetId = scenes?.[0]?.audio_asset_id ?? null;

  let generatedAudioUrl: string | null = null;
  if (scenesReady && audioAssetId) {
    const { data: asset } = await supabase.from("assets").select("storage_path").eq("id", audioAssetId).maybeSingle();
    if (asset) {
      const { data: signed } = await supabase.storage
        .from("project-media")
        .createSignedUrl(asset.storage_path, 3600);
      generatedAudioUrl = signed?.signedUrl ?? null;
    }
  }

  return {
    project,
    hasConfirmedScript: !!script,
    voices: (voices ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      isCloned: v.is_cloned,
      category: v.category,
      previewUrl: v.preview_url,
    })),
    selectedVoiceId: projectRow?.voice_id ?? null,
    voiceSettings: (projectRow?.voice_settings_json as StoredVoiceSettings | null) ?? DEFAULT_VOICE_SETTINGS,
    generatedAudioUrl,
    scenesReady,
  };
}
