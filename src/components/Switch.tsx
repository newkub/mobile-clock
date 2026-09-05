type SwitchProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  "aria-label"?: string;
};

export function Switch(props: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={props.checked}
      aria-label={props["aria-label"]}
      onClick={() => props.onChange(!props.checked)}
      class={`relative h-8 w-14 rounded-full transition-colors duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        props.checked ? "bg-primary" : "bg-surface-3"
      }`}
    >
      <span
        class={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform duration-200 ${
          props.checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}
