type InputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  type?: "text" | "number" | "time" | "date";
  class?: string;
  "aria-label"?: string;
};

export function Input(props: InputProps) {
  return (
    <div class={`w-full ${props.class ?? ""}`}>
      {props.label && <label class="mb-1.5 block text-sm text-text-secondary">{props.label}</label>}
      <input
        type={props.type ?? "text"}
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        placeholder={props.placeholder}
        aria-label={props["aria-label"]}
        class="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
