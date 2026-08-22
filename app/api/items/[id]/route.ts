import { NextResponse } from "next/server";

import { ServiceError } from "@/server/services/errors";
import { deleteItem } from "@/server/services/itemService";

/**
 * Controller: DELETE /api/items/<id>
 *
 * `params` er en Promise i denne Next-versjonen og må ventes på.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await deleteItem(id);
    // 204: sletta, ingen kropp å sende tilbake.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("DELETE /api/items/[id] feilet:", error);
    return NextResponse.json({ error: "Uventet feil" }, { status: 500 });
  }
}
