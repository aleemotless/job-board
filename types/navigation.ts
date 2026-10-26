// Keys for the icons the sidebar renders (mapped to lucide icons in SidebarNav).
export type NavIcon = "dashboard" | "jobs" | "applications" | "candidates";

export type NavItem = {
    href: string;
    label: string;
    icon?: NavIcon;
    // Only active on an exact match (for index routes like "/" or "/admin").
    exact?: boolean;
};
