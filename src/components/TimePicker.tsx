import { haptic } from "../lib/capacitor";

type PickerProps = {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
  /** Smaller layout for embedding inside cards. */
  compact?: boolean;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function StepButton(props: { onClick: () => void; icon: string; label: string; small?: boolean }) {
  return (
    <button
      onClick={() => {
        haptic("light");
        props.onClick();
      }}
      class={`rounded-xl bg-surface-3 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text ${
        props.small ? "p-2" : "p-3"
      }`}
      aria-label={props.label}
    >
      <span class={`${props.icon} ${props.small ? "h-4 w-4" : "h-5 w-5"} block`} aria-hidden="true" />
    </button>
  );
}

export function TimePicker(props: PickerProps) {
  const digitClass = () => (props.compact ? "text-4xl" : "text-6xl");

  return (
    <div class={`flex flex-col gap-3 rounded-3xl bg-surface-2 ${props.compact ? "p-4" : "p-6"}`}>
      <div class="flex items-center justify-center gap-4">
        <div class="flex flex-col items-center gap-2">
          <StepButton small={props.compact} icon="i-mdi-chevron-up" label="Increase hour" onClick={() => props.onChange((props.hour + 1) % 24, props.minute)} />
          <div class={`font-bold tabular-nums text-glow ${digitClass()}`}>{pad(props.hour)}</div>
          <StepButton small={props.compact} icon="i-mdi-chevron-down" label="Decrease hour" onClick={() => props.onChange((props.hour + 23) % 24, props.minute)} />
        </div>
        <span class={`pb-2 font-light text-muted ${props.compact ? "text-3xl" : "text-5xl"}`}>:</span>
        <div class="flex flex-col items-center gap-2">
          <StepButton small={props.compact} icon="i-mdi-chevron-up" label="Increase minute" onClick={() => props.onChange(props.hour, (props.minute + 1) % 60)} />
          <div class={`font-bold tabular-nums text-glow ${digitClass()}`}>{pad(props.minute)}</div>
          <StepButton small={props.compact} icon="i-mdi-chevron-down" label="Decrease minute" onClick={() => props.onChange(props.hour, (props.minute + 59) % 60)} />
        </div>
      </div>
      <div class="flex justify-center gap-2">
        <button
          onClick={() => {
            const d = new Date();
            haptic("light");
            props.onChange(d.getHours(), d.getMinutes());
          }}
          class="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1.5 text-xs font-medium text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Set to current time"
        >
          <span class="i-mdi-clock-time-four-outline h-3.5 w-3.5" /> Now
        </button>
        <button
          onClick={() => {
            haptic("light");
            props.onChange(props.hour, (props.minute + 5) % 60);
          }}
          class="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1.5 text-xs font-medium text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Increase minute by 5"
        >
          +5 min
        </button>
      </div>
    </div>
  );
}
