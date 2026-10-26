import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import type { NavItem } from "@/types";
import { NavLink } from "./nav-link.client";

type NavLinksProps = { items: NavItem[] };

// Server Component: the menu structure renders on the server; each NavLink is a small client island.
export function NavLinks({ items }: NavLinksProps) {
    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex-wrap justify-start gap-2">
                {items.map((item) => (
                    <NavigationMenuItem key={item.href}>
                        <NavLink item={item} />
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    );
}
