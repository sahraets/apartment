import { NextResponse } from "next/server";

import { ServiceError } from "@/server/services/errors";
import { getRooms } from "@/server/services/roomService";

/**
 * Controller: GET /api/rooms
 *
 * Tar imot forespørselen, kaller service-laget, og oversetter resultat eller
 * feil til HTTP. Ingen forretningslogikk og ingen databasekall her.
 */
export async function GET() {
  try {
    const result = await getRooms();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GET /api/rooms feilet:", error);
    return NextResponse.json({ error: "Uventet feil" }, { status: 500 });
  }
}