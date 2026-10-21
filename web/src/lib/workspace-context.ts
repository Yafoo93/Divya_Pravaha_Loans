import type { StaffRole } from "./workspace-navigation";
export { formatAccraHeadingDate } from "./formatters";

export type PrototypeStaffAccount = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: StaffRole;
};

export const prototypeManagers: readonly PrototypeStaffAccount[] = [
  {
    id: "manager-abdul",
    name: "Abdul Latif Kassim",
    initials: "AK",
    email: "abdul.kassim@divyapravaha.example",
    role: "MANAGER",
  },
  {
    id: "manager-tuahira",
    name: "Tuahira Mahmud",
    initials: "TM",
    email: "tuahira.mahmud@divyapravaha.example",
    role: "MANAGER",
  },
] as const;

export const prototypeLoginAccounts: readonly PrototypeStaffAccount[] = [
  ...prototypeManagers,
  {
    id: "system-admin-kwesi",
    name: "Kwesi Aidoo",
    initials: "KA",
    email: "kwesi.aidoo@divyapravaha.example",
    role: "SYSTEM_ADMIN",
  },
] as const;

export const prototypeWorkspace = {
  branch: { code: "KASOA-MARKET", name: "Kasoa Market" },
  currency: "GHS",
  displayDate: new Date("2026-10-18T12:00:00Z"),
  managers: prototypeManagers,
  unreadNotifications: 3,
} as const;
