import "server-only";

import { redirect } from "next/navigation";
import { requireServerSession } from "./session";

export type AuthorizedBranch = {
  id: string;
  code: string;
  name: string;
};

/** The only branches that operational queries may expose for this staff session. */
export type BranchScope = {
  userId: string;
  branches: readonly AuthorizedBranch[];
  branchIds: readonly string[];
};

type ActiveSession = NonNullable<
  Awaited<ReturnType<typeof requireServerSession>>
>;

export class BranchScopeError extends Error {
  constructor(message = "This record is outside your assigned branch scope.") {
    super(message);
    this.name = "BranchScopeError";
  }
}

export async function requireBranchScope(
  currentSession?: ActiveSession,
): Promise<BranchScope> {
  const session = currentSession ?? (await requireServerSession());
  const branches = [...session.user.branches].sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  if (branches.length === 0) redirect("/workspace/denied");

  return {
    userId: session.user.id,
    branches,
    branchIds: branches.map(({ id }) => id),
  };
}

/** Prisma `where` fragment for models with a direct `branchId` field. */
export function branchScopeWhere(scope: BranchScope) {
  if (scope.branchIds.length === 0) throw new BranchScopeError();
  return { branchId: { in: [...scope.branchIds] } };
}

/** Combine caller filters with branch scope using AND so caller filters cannot widen access. */
export function andBranchScope<T extends object>(scope: BranchScope, where: T) {
  return { AND: [where, branchScopeWhere(scope)] };
}

/** Prisma `where` fragments for operational models scoped through relations. */
export const relatedBranchScopeWhere = {
  groupMembership(scope: BranchScope) {
    const branch = { in: [...scope.branchIds] };
    return {
      AND: [
        { group: { branchId: branch } },
        { borrower: { branchId: branch } },
      ],
    };
  },
  arrear(scope: BranchScope) {
    return { loan: { branchId: { in: [...scope.branchIds] } } };
  },
  journalLine(scope: BranchScope) {
    return { journal: { branchId: { in: [...scope.branchIds] } } };
  },
};

/** Check explicitly selected or referenced branch IDs before reads or writes. */
export function assertBranchAccess(branchId: string, scope: BranchScope): void {
  if (!scope.branchIds.includes(branchId)) throw new BranchScopeError();
}

/** Validate that an incoming set of related operational records shares the target branch. */
export function assertSameBranch(
  targetBranchId: string,
  relatedBranchIds: readonly string[],
  scope: BranchScope,
): void {
  assertBranchAccess(targetBranchId, scope);
  if (relatedBranchIds.some((branchId) => branchId !== targetBranchId)) {
    throw new BranchScopeError(
      "Related records must belong to the same branch.",
    );
  }
}

/** A display label for screens that summarize all branches assigned to the user. */
export function branchScopeLabel(scope: BranchScope): AuthorizedBranch {
  if (scope.branches.length === 1) return scope.branches[0];
  return {
    id: "assigned-branches",
    code: "ASSIGNED",
    name: "All assigned branches",
  };
}
