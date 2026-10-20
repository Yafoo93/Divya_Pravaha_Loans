import { NextResponse } from "next/server";
import { revokeServerSession } from "@/server/auth/session";

export async function POST() {
  await revokeServerSession();
  return NextResponse.json({ ok: true });
}
