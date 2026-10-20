import type { StaffRole } from "./workspace-navigation";

export type StaffActivationState = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type PrototypeStaff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  branch: string;
  state: StaffActivationState;
  lastActive: string;
};

export const prototypeStaff: readonly PrototypeStaff[] = [
  {
    id: "STF-0001",
    name: "Abdul Latif Kassim",
    email: "abdul.kassim@divyapravaha.example",
    role: "MANAGER",
    branch: "Kasoa Market",
    state: "ACTIVE",
    lastActive: "2026-10-18T14:42:00Z",
  },
  {
    id: "STF-0002",
    name: "Tuahira Mahmud",
    email: "tuahira.mahmud@divyapravaha.example",
    role: "MANAGER",
    branch: "Kasoa Market",
    state: "ACTIVE",
    lastActive: "2026-10-18T13:18:00Z",
  },
  {
    id: "STF-0003",
    name: "Kwesi Aidoo",
    email: "kwesi.aidoo@divyapravaha.example",
    role: "SYSTEM_ADMIN",
    branch: "Kasoa Market",
    state: "ACTIVE",
    lastActive: "2026-10-18T09:05:00Z",
  },
  {
    id: "STF-0004",
    name: "Ama Mensah",
    email: "ama.mensah@divyapravaha.example",
    role: "LOAN_OFFICER",
    branch: "Kasoa Market",
    state: "ACTIVE",
    lastActive: "2026-10-18T14:10:00Z",
  },
  {
    id: "STF-0005",
    name: "Kofi Asante",
    email: "kofi.asante@divyapravaha.example",
    role: "FIELD_COLLECTOR",
    branch: "Kasoa Market",
    state: "ACTIVE",
    lastActive: "2026-10-18T14:40:00Z",
  },
  {
    id: "STF-0006",
    name: "Esi Quartey",
    email: "esi.quartey@divyapravaha.example",
    role: "CASHIER_ACCOUNTANT",
    branch: "Kasoa Market",
    state: "ACTIVE",
    lastActive: "2026-10-18T14:30:00Z",
  },
  {
    id: "STF-0007",
    name: "Adjoa Nyarko",
    email: "adjoa.nyarko@divyapravaha.example",
    role: "AUDITOR",
    branch: "All assigned branches",
    state: "INACTIVE",
    lastActive: "2026-10-12T16:20:00Z",
  },
  {
    id: "STF-0008",
    name: "Nii Laryea",
    email: "nii.laryea@divyapravaha.example",
    role: "INVESTOR_PORTFOLIO_OFFICER",
    branch: "Kasoa Market",
    state: "SUSPENDED",
    lastActive: "2026-09-30T11:15:00Z",
  },
  {
    id: "USR-0009",
    name: "Kobina Mensimah",
    email: "kobina.mensimah@investor.divyapravaha.example",
    role: "INVESTOR_PORTAL_USER",
    branch: "Investor portal — own records only",
    state: "SUSPENDED",
    lastActive: "2026-09-29T10:00:00Z",
  },
] as const;

export function filterPrototypeStaff(
  records: readonly PrototypeStaff[],
  query: string,
  role: string,
  state: string,
) {
  const normalized = query.trim().toLowerCase();
  return records.filter((record) => {
    const matchesQuery = `${record.id} ${record.name} ${record.email}`
      .toLowerCase()
      .includes(normalized);
    return (
      matchesQuery &&
      (role === "ALL" || record.role === role) &&
      (state === "ALL" || record.state === state)
    );
  });
}
