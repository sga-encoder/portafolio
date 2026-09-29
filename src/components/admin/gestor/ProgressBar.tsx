interface Props {
  percent: number;
  /** `sm` para las tarjetas del listado, `md` para la cabecera del detalle. */
  size?: "sm" | "md";
}

/** Barra de progreso del gestor (087) — coloreada con la terna de marca, como el resto del panel. */
export default function ProgressBar({ percent, size = "sm" }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-surface-muted ${size === "md" ? "h-3" : "h-2"}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${clamped}%`,
          background: "linear-gradient(90deg, var(--color-brand), var(--color-accent))",
        }}
      />
    </div>
  );
}
