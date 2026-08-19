import { NextResponse } from "next/server";
import { angemeldet } from "@/lib/admin";
import { alsCsv, gaesteListe } from "@/lib/gaeste";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await angemeldet())) {
    return new NextResponse("Nicht angemeldet", { status: 401 });
  }

  const gaeste = await gaesteListe(["angefragt", "bestaetigt"]);
  const datum = new Date().toISOString().slice(0, 10);

  return new NextResponse(alsCsv(gaeste), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wiesnauftakt-gaeste-${datum}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
