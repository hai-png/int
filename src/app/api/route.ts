import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "3D Experience Builder",
    version: "1.0.0",
  });
}