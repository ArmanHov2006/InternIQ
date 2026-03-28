import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderPremiumPdfTemplate } from "@/lib/pdf/templates/premium-template";
import { renderResumePdfTemplate } from "@/lib/pdf/templates/resume-template";
import { validateExportPayload } from "@/lib/pdf/export-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      const isMissingSession = userError.message.toLowerCase().includes("auth session missing");
      return NextResponse.json(
        { error: userError.message },
        { status: isMissingSession ? 401 : 500 }
      );
    }
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as unknown;
    const validation = validateExportPayload(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const startedAt = Date.now();
    const pdfBytes =
      validation.payload.feature === "resume-tailor"
        ? await renderResumePdfTemplate(validation.payload.document)
        : await renderPremiumPdfTemplate(validation.payload.document, {
            includeMetadata: validation.payload.includeMetadata,
          });
    const durationMs = Date.now() - startedAt;

    const safeFilename = validation.payload.filename
      .replace(/[^\w.\- ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 100);

    console.info("pdf_export_success", {
      userId: user.id,
      feature: validation.payload.feature,
      template: validation.payload.template,
      durationMs,
      bytes: pdfBytes.byteLength,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename || "interniq-export"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("pdf_export_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF export.",
      },
      { status: 500 }
    );
  }
}
