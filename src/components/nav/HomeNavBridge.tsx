import { useState } from "react";
import AdminDotNav from "../admin/AdminDotNav";
import { useAdminAuth } from "../admin/useAdminAuth";
import ProjectsAllDotNav from "./ProjectsAllDotNav";
import ScrollDotNav from "./ScrollDotNav";

export default function HomeNavBridge() {
  const { status } = useAdminAuth();
  const [showAdminNav, setShowAdminNav] = useState(false);

  if (status !== "signedIn") {
    return (
      <>
        <ScrollDotNav />
        <ProjectsAllDotNav />
      </>
    );
  }

  return (
    <>
      <ScrollDotNav
        toggle={{
          page: "home",
          enabled: showAdminNav,
          onToggle: () => setShowAdminNav((value) => !value),
        }}
      />
      {showAdminNav && <AdminDotNav side="secondary" active="dashboard" switcherProjects={[]} />}
      <ProjectsAllDotNav />
    </>
  );
}
