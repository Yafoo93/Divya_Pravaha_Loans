import type { PrototypeStaff } from "./prototype-staff";

export type PrototypeBranch = {
  id: string;
  code: string;
  name: string;
  state: "ACTIVE" | "INACTIVE";
  assignedStaffIds: readonly string[];
};

export const prototypeBranches: readonly PrototypeBranch[] = [
  {
    id: "BR-KASOA-MARKET",
    code: "KASOA-MARKET",
    name: "Kasoa Market",
    state: "ACTIVE",
    assignedStaffIds: [
      "STF-0001",
      "STF-0002",
      "STF-0003",
      "STF-0004",
      "STF-0005",
      "STF-0006",
      "STF-0008",
    ],
  },
] as const;

export function staffAssignedToBranch(
  branch: PrototypeBranch,
  staff: readonly PrototypeStaff[],
) {
  return staff.filter((record) => branch.assignedStaffIds.includes(record.id));
}

export function staffAvailableForBranch(
  branch: PrototypeBranch,
  staff: readonly PrototypeStaff[],
) {
  return staff.filter(
    (record) =>
      record.role !== "INVESTOR_PORTAL_USER" &&
      !branch.assignedStaffIds.includes(record.id),
  );
}
