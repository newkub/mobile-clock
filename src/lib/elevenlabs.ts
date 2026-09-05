const API_BASE = "https://api.elevenlabs.io/v1";

export async function generateSound(text: string, apiKey: string): Promise<string | null> {
  if (!apiKey || !text.trim()) return null;

  try {
    const voiceId = "onwK4e9ZLuTAKqW03n9c"; // Josh (male, calm)

    const res = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("ElevenLabs TTS error:", e);
    return null;
  }
}
