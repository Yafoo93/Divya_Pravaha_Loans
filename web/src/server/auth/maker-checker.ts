import "server-only";

import { requirePermission } from "./session";
import {
  makerCheckerActions,
  MakerCheckerViolation,
  type MakerCheckerAction,
} from "./maker-checker-policy";

/** Authorize a controlled action, then enforce separation of duties. */
export async function requireIndependentChecker(
  action: MakerCheckerAction,
  makerUserId: string,
) {
  if (!makerUserId) {
    throw new MakerCheckerViolation(
      "The pending record has no maker identity.",
    );
  }

  return requirePermission(makerCheckerActions[action], true, makerUserId);
}
