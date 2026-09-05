import { type JSX } from "solid-js";

type ProgressProps = {
  size?: number;
  stroke?: number;
  progress: number; // 0-1
  color?: string;
  children?: JSX.Element;
  "aria-label"?: string;
};

export function CircleProgress(props: ProgressProps) {
  const size = props.size ?? 240;
  const stroke = props.stroke ?? 12;
  const color = props.color ?? "#6366f1";
  const progress = Math.max(0, Math.min(1, props.progress));
  const percent = Math.round(progress * 100);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;

  return (
    <div
      class="relative inline-flex items-center justify-center"
      style={{ width: `${size}px`, height: `${size}px` }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={props["aria-label"] ?? "Progress"}
    >
      <svg width={size} height={size} class="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          stroke-width={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          stroke-width={stroke}
          stroke-linecap="round"
          fill="none"
          style={{
            "stroke-dasharray": `${dash} ${c}`,
            transition: "stroke-dasharray 0.2s linear",
          }}
        />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">{props.children}</div>
    </div>
  );
}
