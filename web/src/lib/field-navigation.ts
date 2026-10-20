export const fieldNavigation = [
  { label: "Assignments", href: "/field/assignments", shortLabel: "AS" },
  { label: "Receipts", href: "/field/receipts", shortLabel: "RC" },
  { label: "Handover", href: "/field/handover", shortLabel: "HO" },
  { label: "Account", href: "/field/account", shortLabel: "ME" },
] as const;

export function isFieldNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
