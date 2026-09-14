import AdminGate from "./AdminGate";

interface Props {
  projects: { slug: string; title: string }[];
}

export default function ContentList({ projects }: Props) {
  return (
    <AdminGate active="contenido">
      <h1 className="mb-6 text-2xl font-display font-bold">Contenido</h1>
      <ul className="space-y-2">
        {projects.map((project) => (
          <li key={project.slug}>
            <a
              href={`/admin/contenido/${project.slug}`}
              className="block rounded-xl bg-surface-muted p-4 hover:bg-surface-muted/70"
            >
              <span className="font-medium">{project.title}</span>
              <span className="ml-2 text-sm text-ink-muted">{project.slug}</span>
            </a>
          </li>
        ))}
      </ul>
    </AdminGate>
  );
}
