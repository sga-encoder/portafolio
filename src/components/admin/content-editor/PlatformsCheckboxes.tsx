type Platform = "mobile" | "desktop";

interface Props {
  value: Platform[];
  onChange: (next: Platform[]) => void;
}

const OPTIONS: { id: Platform; label: string }[] = [
  { id: "mobile", label: "Móvil" },
  { id: "desktop", label: "PC" },
];

/** Checkboxes de `platforms` — el schema exige al menos una marcada (044). */
export default function PlatformsCheckboxes({ value, onChange }: Props) {
  function toggle(platform: Platform) {
    const isChecked = value.includes(platform);
    if (isChecked && value.length === 1) return; // al menos una debe quedar marcada
    onChange(isChecked ? value.filter((item) => item !== platform) : [...value, platform]);
  }

  return (
    <div className="flex items-center gap-3 text-ink-muted">
      {OPTIONS.map((option) => (
        <label key={option.id} className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={value.includes(option.id)} onChange={() => toggle(option.id)} />
          {option.label}
        </label>
      ))}
    </div>
  );
}
