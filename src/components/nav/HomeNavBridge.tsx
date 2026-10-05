import { useState } from "react";
import AdminDotNav from "../admin/AdminDotNav";
import { useAdminAuth } from "../admin/useAdminAuth";
import ProjectsAllDotNav from "./ProjectsAllDotNav";
import ScrollDotNav from "./ScrollDotNav";
import type { Lang } from "../../i18n/config";

export default function HomeNavBridge({ lang }: { lang: Lang }) {
  const { status } = useAdminAuth();
  const [showAdminNav, setShowAdminNav] = useState(false);

  if (status !== "signedIn") {
    return (
      <>
        <ScrollDotNav lang={lang} />
        <ProjectsAllDotNav lang={lang} />
      </>
    );
  }

  return (
    <>
      <ScrollDotNav
        lang={lang}
        toggle={{
          page: "home",
          enabled: showAdminNav,
          onToggle: () => setShowAdminNav((value) => !value),
        }}
      />
      {showAdminNav && <AdminDotNav side="secondary" active="dashboard" switcherProjects={[]} />}
      <ProjectsAllDotNav lang={lang} />
    </>
  );
}
