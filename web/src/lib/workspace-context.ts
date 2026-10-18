import type { StaffRole } from "./workspace-navigation";

export type PrototypeStaffAccount = {
  id: string;
  name: string;
  initials: string;
  role: StaffRole;
};

export const prototypeManagers: readonly PrototypeStaffAccount[] = [
  {
    id: "manager-abdul",
    name: "Abdul Latif Kassim",
    initials: "AK",
    role: "MANAGER",
  },
  {
    id: "manager-tuahira",
    name: "Tuahira Mahmud",
    initials: "TM",
    role: "MANAGER",
  },
] as const;

export const prototypeWorkspace = {
  branch: { code: "KASOA-MARKET", name: "Kasoa Market" },
  currency: "GHS",
  displayDate: new Date("2026-10-18T12:00:00Z"),
  managers: prototypeManagers,
  unreadNotifications: 3,
} as const;

export function formatAccraHeadingDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Accra",
  })
    .format(date)
    .toUpperCase();
}
