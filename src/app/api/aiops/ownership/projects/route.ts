import { NextResponse } from "next/server";
import { createProjectOwnershipRepository } from "@/backend/infrastructure/bootstrap";
import { listProjectOwnership } from "@/backend/interface/http/ownership-handlers";

export const dynamic = "force-dynamic";

const ownershipRepository = createProjectOwnershipRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId")?.trim() || undefined;
  const projectId = searchParams.get("projectId")?.trim() || undefined;

  const result = await listProjectOwnership(ownershipRepository, {
    companyId,
    projectId,
  });

  return NextResponse.json(result, { status: 200 });
}
