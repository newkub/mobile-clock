import { createSignal, createMemo, Show } from "solid-js";
import { appStore, updateAlarm, type Alarm } from "../../../store/app";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { generateSound } from "../../../lib/elevenlabs";
import { playAlarmPreview, stopAudio } from "../../../lib/audio";
import { haptic } from "../../../lib/capacitor";
import { showStatus } from "../../../lib/status";

export function AiSoundEditor(props: { alarm: Alarm }) {
  const [text, setText] = createSignal(props.alarm.aiText ?? "Time to wake up, it's a beautiful day!");
  const [loading, setLoading] = createSignal(false);
  const [audio, setAudio] = createSignal<HTMLAudioElement | null>(null);
  const preview = createMemo(() => appStore.alarms.find((a) => a.id === props.alarm.id)?.soundUrl);

  async function generate() {
    if (!appStore.elevenLabsKey) {
      haptic("warning");
      showStatus("Set your ElevenLabs API key in Settings first.", "warning");
      return;
    }
    haptic("light");
    setLoading(true);
    const url = await generateSound(text(), appStore.elevenLabsKey);
    if (url) {
      updateAlarm(props.alarm.id, { soundUrl: url, aiText: text() });
      stopAudio(audio());
      setAudio(null);
      haptic("success");
      showStatus("AI sound generated", "success");
    } else {
      haptic("error");
      showStatus("Failed to generate sound. Check API key.", "error");
    }
    setLoading(false);
  }

  function play() {
    const url = preview();
    if (url) {
      stopAudio(audio());
      setAudio(playAlarmPreview(url));
    }
  }

  function stop() {
    stopAudio(audio());
    setAudio(null);
  }

  return (
    <div class="rounded-2xl border border-border bg-surface-3/50 p-4">
      <label class="mb-2 flex items-center gap-2 text-sm text-accent">
        <span class="i-mdi-sparkles h-4 w-4" /> AI voice prompt
      </label>
      <Input value={text()} onChange={setText} placeholder="What should the AI say?" />
      <div class="mt-3 flex gap-2">
        <Button onClick={generate} class="flex-1" disabled={loading()} aria-label="Generate AI sound">
          <span class="i-mdi-wand mr-2 h-4 w-4" />
          {loading() ? "Generating..." : "Generate"}
        </Button>
        <Show when={preview()}>
          <Button onClick={audio() ? stop : play} variant="secondary" class="flex-1" aria-label={audio() ? "Stop preview" : "Play preview"}>
            {audio() ? (
              <>
                <span class="i-mdi-pause mr-2 h-4 w-4" /> Stop
              </>
            ) : (
              <>
                <span class="i-mdi-play mr-2 h-4 w-4" /> Preview
              </>
            )}
          </Button>
        </Show>
      </div>
      <Show when={preview()}>
        <p class="mt-2 text-xs text-success">AI sound ready ✦</p>
      </Show>
    </div>
  );
}
