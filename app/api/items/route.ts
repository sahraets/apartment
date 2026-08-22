import { NextResponse, type NextRequest } from "next/server";

import { ServiceError } from "@/server/services/errors";
import { createItem, listItems } from "@/server/services/itemService";

/**
 * Controller: GET /api/items[?roomId=stue]
 *
 * Uten `roomId` returneres alle ting i leiligheten.
 */
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");

  try {
    const items = await listItems(roomId);
    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GET /api/items feilet:", error);
    return NextResponse.json({ error: "Uventet feil" }, { status: 500 });
  }
}

/**
 * Controller: POST /api/items
 *
 * Tar imot JSON-body, kaller service-laget (som validerer og lagrer), og
 * oversetter resultat eller feil til HTTP. Ingen forretningslogikk og ingen
 * databasekall her.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON i forespørselen" }, { status: 400 });
  }

  try {
    const item = await createItem(payload);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST /api/items feilet:", error);
    return NextResponse.json({ error: "Uventet feil" }, { status: 500 });
  }
}
