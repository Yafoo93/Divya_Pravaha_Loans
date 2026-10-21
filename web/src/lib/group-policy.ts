export type GroupReadinessMember = {
  hasConsented: boolean;
  verified: boolean;
};

export function isGroupActivationReady(
  members: readonly GroupReadinessMember[],
  hasSignedAgreement: boolean,
) {
  return (
    members.length >= 5 &&
    members.every((member) => member.hasConsented && member.verified) &&
    hasSignedAgreement
  );
}

export function captureGroupSnapshot(memberIds: readonly string[]) {
  return [...new Set(memberIds)];
}
