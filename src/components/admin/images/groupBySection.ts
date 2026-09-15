// Agrupa claves del manifest (`header/persona01`, `projects/blog-semillero/cover`, …) o public_ids
// de otros proyectos (`blog-semillero/hero`, …) por sección, para las 3 pestañas de la feature 045.
// Ver .claude/spec/features/045-imagenes-multiproyecto-estadisticas/plan.md.

const SECTION_LABELS: Record<string, string> = {
  header: "Header",
  skills: "Habilidades",
  about: "Sobre mí",
  projects: "Proyectos",
};

export function sectionLabel(segment: string): string {
  return SECTION_LABELS[segment] ?? segment;
}

export function groupEntriesBySection<T>(
  entries: [string, T][],
  { thirdSegmentAsSubgroup = true }: { thirdSegmentAsSubgroup?: boolean } = {},
): Map<string, [string, T][]> {
  const groups = new Map<string, [string, T][]>();
  for (const entry of entries) {
    const [key] = entry;
    const [section, sub] = key.split("/");
    const label =
      thirdSegmentAsSubgroup && section === "projects" && sub
        ? `${sectionLabel(section)} / ${sub}`
        : sectionLabel(section ?? "raíz");
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }
  return groups;
}

export function groupResourcesBySubfolder<T extends { public_id: string }>(
  resources: T[],
  rootFolder: string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  const prefix = `${rootFolder}/`;
  for (const resource of resources) {
    const rest = resource.public_id.startsWith(prefix)
      ? resource.public_id.slice(prefix.length)
      : resource.public_id;
    const parts = rest.split("/");
    const label = parts.length > 1 ? parts[0] : "Sin sección";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(resource);
  }
  return groups;
}

// Proyectos que suben variantes de tamaño con prefijo en el propio public_id
// (`small_foo`, `medium_foo`, …) en vez de usar folders — visto en las
// imágenes reales de Blog Semillero, sueltas en la raíz de la cuenta (sin
// ningún folder, por eso no aparecen vía groupResourcesBySubfolder).
const SIZE_VARIANT_LABELS: [prefix: string, label: string][] = [
  ["thumbnail_", "Thumbnail"],
  ["small_", "Small"],
  ["medium_", "Medium"],
  ["large_", "Large"],
];

export function groupResourcesBySizeVariant<T extends { public_id: string }>(
  resources: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const resource of resources) {
    const match = SIZE_VARIANT_LABELS.find(([prefix]) => resource.public_id.startsWith(prefix));
    const label = match ? match[1] : "Original";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(resource);
  }
  return groups;
}
