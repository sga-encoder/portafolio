import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import AdminGate from "./AdminGate";

interface Submission {
  id: string;
  firstName: string;
  lastName?: string;
  contactLink?: string;
  message?: string;
  createdAt: Timestamp | null;
}

interface ProjectLikes {
  slug: string;
  count: number;
  submissions: Submission[] | null;
}

interface Props {
  slugs: string[];
}

// Ver DashboardPanel.tsx: separado de LikesPanel para que el fetch solo
// corra una vez que AdminGate confirmó sesión, no al montar la página.
function LikesContent({ slugs }: Props) {
  const [projects, setProjects] = useState<ProjectLikes[]>(slugs.map((slug) => ({ slug, count: 0, submissions: null })));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      slugs.map(async (slug) => {
        const snap = await getDoc(doc(db, "projectLikes", slug));
        return { slug, count: (snap.data()?.count as number | undefined) ?? 0, submissions: null };
      }),
    ).then((results) => {
      if (!cancelled) setProjects(results);
    });
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  async function toggleExpand(slug: string) {
    if (expanded === slug) {
      setExpanded(null);
      return;
    }
    setExpanded(slug);
    setError(null);
    const project = projects.find((item) => item.slug === slug);
    if (project?.submissions) return;

    try {
      const submissionsQuery = query(
        collection(db, "projectLikes", slug, "submissions"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(submissionsQuery);
      const submissions: Submission[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Submission, "id">),
      }));
      setProjects((prev) => prev.map((item) => (item.slug === slug ? { ...item, submissions } : item)));
    } catch {
      setError("No se pudieron cargar los mensajes (¿sesión admin válida?).");
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-display font-bold">Likes</h1>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <ul className="space-y-3">
        {projects.map((project) => (
          <li key={project.slug} className="rounded-2xl bg-surface-muted p-4">
            <button
              type="button"
              onClick={() => toggleExpand(project.slug)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="font-medium">{project.slug}</span>
              <span className="text-ink-muted">{project.count} ❤</span>
            </button>
            {expanded === project.slug && (
              <ul className="mt-3 space-y-2 border-t border-ink-muted/20 pt-3">
                {project.submissions == null && <li className="text-sm text-ink-muted">Cargando…</li>}
                {project.submissions?.length === 0 && <li className="text-sm text-ink-muted">Sin mensajes.</li>}
                {project.submissions?.map((submission) => (
                  <li key={submission.id} className="text-sm">
                    <span className="font-medium">
                      {submission.firstName} {submission.lastName ?? ""}
                    </span>
                    {submission.contactLink && (
                      <>
                        {" — "}
                        <a href={submission.contactLink} className="underline" target="_blank" rel="noreferrer">
                          {submission.contactLink}
                        </a>
                      </>
                    )}
                    {submission.message && <p className="text-ink-muted">{submission.message}</p>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function LikesPanel({ slugs }: Props) {
  return (
    <AdminGate active="likes">
      <LikesContent slugs={slugs} />
    </AdminGate>
  );
}
