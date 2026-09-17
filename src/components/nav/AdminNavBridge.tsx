import { createContext, useContext } from "react";
import AdminDotNav, { type AdminSection } from "../admin/AdminDotNav";
import { useAdminAuth } from "../admin/useAdminAuth";
import type { ProjectCardData } from "../../lib/admin/projectCards";
import ScrollDotNav from "./ScrollDotNav";

interface Props {
  active: AdminSection;
  switcherProjects: ProjectCardData[];
  currentSlug?: string;
  showHomeNav: boolean;
  onToggleHomeNav: () => void;
}

export const AdminNavStateContext = createContext({ showHomeNav: false });

export function useAdminNavState() {
  return useContext(AdminNavStateContext);
}

export default function AdminNavBridge({ active, switcherProjects, currentSlug, showHomeNav, onToggleHomeNav }: Props) {
  const { status } = useAdminAuth();

  if (status !== "signedIn") {
    return null;
  }

  return (
    <>
      {showHomeNav && <ScrollDotNav side="left" />}
      <AdminDotNav
        side={showHomeNav ? "secondary" : "left"}
        active={active}
        switcherProjects={switcherProjects}
        currentSlug={currentSlug}
        toggle={{
          page: "admin",
          enabled: showHomeNav,
          onToggle: onToggleHomeNav,
        }}
      />
    </>
  );
}
