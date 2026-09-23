import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BookMarked,
  BookOpen,
  Calendar,
  CheckSquare,
  Clapperboard,
  Dices,
  Flame,
  Gem,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Repeat,
  Settings,
  Shield,
  Shirt,
  SlidersHorizontal,
  StickyNote,
  Theater,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { HouseTab } from "@/lib/house";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

export type HouseNavItem = {
  hash: HouseTab;
  label: string;
  icon: LucideIcon;
};

export const HOUSE_NAV: HouseNavItem[] = [
  { hash: "you", label: "You", icon: UserRound },
  { hash: "partner", label: "Partner", icon: Users },
  { hash: "options", label: "Options", icon: SlidersHorizontal },
  { hash: "app", label: "App", icon: Settings },
  { hash: "calendar", label: "Calendar", icon: Calendar },
  { hash: "archive", label: "Archived", icon: Archive },
  { hash: "location", label: "Location", icon: MapPin },
  { hash: "permissions", label: "Permissions", icon: Shield },
];

export const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home, primary: true },
  { to: "/tasks", label: "Tasks", icon: CheckSquare, primary: true },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/training", label: "Training", icon: GraduationCap, primary: true },
  { to: "/punishments", label: "Punishments", icon: Flame },
  { to: "/rewards", label: "Rewards", icon: Gem },
  { to: "/games", label: "Games", icon: Dices, primary: true },
  { to: "/talk", label: "Talk", icon: MessageCircle, primary: true },
  { to: "/roleplay", label: "Roleplay", icon: Theater },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/scenes", label: "Scenes", icon: Clapperboard },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/playbook", label: "Playbook", icon: BookMarked },
  { to: "/catalog", label: "Catalogue", icon: Shirt },
  { to: "/wishlist", label: "Wish List", icon: Heart },
];

export const PRIMARY_NAV = NAV.filter((item) => item.primary);
export const MORE_NAV = NAV.filter((item) => !item.primary);
export const DEFAULT_QUICK_NAV = ["/", "/tasks", "/games", "/talk"];

export function navFor(paths: string[] | undefined | null) {
  const wanted = (paths?.length ? paths : DEFAULT_QUICK_NAV).slice(0, 4);
  const found = wanted
    .map((to) => NAV.find((item) => item.to === to))
    .filter((item): item is NavItem => Boolean(item));
  return found.length ? found : PRIMARY_NAV.slice(0, 4);
}
