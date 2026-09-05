import { type JSX } from "solid-js";

type BtnProps = {
  children?: JSX.Element;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  class?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  "aria-label"?: string;
};

export function Button(props: BtnProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  const base =
    "inline-flex items-center justify-center font-semibold rounded-2xl transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40 disabled:active:scale-100";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-glow",
    secondary: "bg-surface-2 text-text hover:bg-surface-3 border border-border",
    ghost: "text-text-secondary hover:text-text hover:bg-surface-2/50",
    danger: "bg-danger/20 text-danger hover:bg-danger/30",
  };
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg rounded-3xl",
  };

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      class={`${base} ${variants[variant]} ${sizes[size]} ${props.class ?? ""}`}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </button>
  );
}
