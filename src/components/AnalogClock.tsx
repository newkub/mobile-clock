import { createSignal, onMount, onCleanup, For } from "solid-js";

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const HOUR_LABELS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * Animated analog clock face.
 * The second hand is driven by requestAnimationFrame so it sweeps smoothly
 * instead of ticking once per second.
 */
export function AnalogClock(props: { size?: number }) {
  const size = props.size ?? 280;
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    let raf = 0;
    const loop = () => {
      setNow(new Date());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    onCleanup(() => cancelAnimationFrame(raf));
  });

  const secondsDeg = () => {
    const d = now();
    return ((d.getSeconds() + d.getMilliseconds() / 1000) / 60) * 360;
  };
  const minutesDeg = () => {
    const d = now();
    return ((d.getMinutes() + d.getSeconds() / 60) / 60) * 360;
  };
  const hoursDeg = () => {
    const d = now();
    return (((d.getHours() % 12) + d.getMinutes() / 60) / 12) * 360;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Analog clock, ${now().toLocaleTimeString()}`}
      class="drop-shadow-[0_0_30px_rgba(99,102,241,0.25)]"
    >
      {/* face */}
      <circle cx="100" cy="100" r="96" class="fill-[hsl(var(--color-surface))]" />
      <circle
        cx="100"
        cy="100"
        r="96"
        fill="none"
        class="stroke-[hsl(var(--color-border))]"
        stroke-width="1.5"
      />
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        class="stroke-[hsl(var(--color-surface-3))]"
        stroke-width="1"
      />

      {/* tick marks */}
      <For each={TICKS}>
        {(i) => {
          const major = i % 5 === 0;
          const angle = (i / 60) * 360;
          return (
            <line
              x1="100"
              y1={major ? "8" : "12"}
              x2="100"
              y2={major ? "18" : "16"}
              transform={`rotate(${angle} 100 100)`}
              class={major ? "stroke-[hsl(var(--color-text))]" : "stroke-[hsl(var(--color-muted))]"}
              stroke-width={major ? 2.4 : 1}
              stroke-linecap="round"
              opacity={major ? 0.9 : 0.45}
            />
          );
        }}
      </For>

      {/* hour numerals */}
      <For each={HOUR_LABELS}>
        {(n, idx) => {
          const angle = (idx() / 12) * Math.PI * 2;
          const r = 74;
          const x = 100 + Math.sin(angle) * r;
          const y = 100 - Math.cos(angle) * r;
          return (
            <text
              x={x}
              y={y}
              text-anchor="middle"
              dominant-baseline="central"
              class="fill-[hsl(var(--color-text-secondary))]"
              font-size="13"
              font-weight="600"
            >
              {n}
            </text>
          );
        }}
      </For>

      {/* hour hand */}
      <line
        x1="100"
        y1="106"
        x2="100"
        y2="58"
        transform={`rotate(${hoursDeg()} 100 100)`}
        class="stroke-[hsl(var(--color-text))]"
        stroke-width="5"
        stroke-linecap="round"
      />
      {/* minute hand */}
      <line
        x1="100"
        y1="108"
        x2="100"
        y2="36"
        transform={`rotate(${minutesDeg()} 100 100)`}
        class="stroke-[hsl(var(--color-text))]"
        stroke-width="3.2"
        stroke-linecap="round"
        opacity="0.85"
      />
      {/* second hand — smooth sweep via rAF */}
      <line
        x1="100"
        y1="112"
        x2="100"
        y2="26"
        transform={`rotate(${secondsDeg()} 100 100)`}
        class="stroke-[hsl(var(--color-primary))]"
        stroke-width="1.6"
        stroke-linecap="round"
      />

      {/* center cap */}
      <circle cx="100" cy="100" r="4.5" class="fill-[hsl(var(--color-primary))]" />
      <circle cx="100" cy="100" r="2" class="fill-[hsl(var(--color-surface))]" />
    </svg>
  );
}
