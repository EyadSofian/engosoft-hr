import {
  ClipboardCheck, GraduationCap, LayoutDashboard, Network, Settings,
  Target, UserPlus, Users, Wallet, type LucideIcon,
} from 'lucide-react';

/**
 * Explicit icon map. A `import * as Icons from 'lucide-react'` here would defeat
 * tree-shaking and drag the entire icon set (~800 kB) into the bundle.
 */
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  UserPlus,
  Users,
  Network,
  ClipboardCheck,
  Target,
  GraduationCap,
  Wallet,
  Settings,
};

export function NavIcon({ name, size = 17 }: { name: string; size?: number }) {
  const C = ICONS[name] ?? LayoutDashboard;
  return <C size={size} />;
}
