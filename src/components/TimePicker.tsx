type PickerProps = {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function TimePicker(props: PickerProps) {
  return (
    <div class="flex items-center justify-center gap-4 rounded-3xl bg-surface-2 p-6">
      <div class="flex flex-col items-center gap-2">
        <button
          onClick={() => props.onChange((props.hour + 1) % 24, props.minute)}
          class="rounded-xl bg-surface-3 p-3 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Increase hour"
        >
          ▲
        </button>
        <div class="text-6xl font-bold tabular-nums text-glow">{pad(props.hour)}</div>
        <button
          onClick={() => props.onChange((props.hour + 23) % 24, props.minute)}
          class="rounded-xl bg-surface-3 p-3 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Decrease hour"
        >
          ▼
        </button>
      </div>
      <span class="pb-2 text-5xl font-light text-muted">:</span>
      <div class="flex flex-col items-center gap-2">
        <button
          onClick={() => props.onChange(props.hour, (props.minute + 1) % 60)}
          class="rounded-xl bg-surface-3 p-3 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Increase minute"
        >
          ▲
        </button>
        <div class="text-6xl font-bold tabular-nums text-glow">{pad(props.minute)}</div>
        <button
          onClick={() => props.onChange(props.hour, (props.minute + 59) % 60)}
          class="rounded-xl bg-surface-3 p-3 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Decrease minute"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
