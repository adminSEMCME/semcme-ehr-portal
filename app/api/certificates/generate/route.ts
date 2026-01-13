// app/api/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

/* -------------------------------
   Helpers
-------------------------------- */
function getBaseUrlFromRequest(req: Request) {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https") ? "https" : "http");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    process.env.VERCEL_URL ||
    "";

  if (host.startsWith("http")) return host;
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

async function fetchPngBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}

/* -------------------------------
   Route
-------------------------------- */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { module_id, user_id } = body;

    if (!module_id || !user_id) {
      return NextResponse.json(
        { error: "Missing module_id or user_id" },
        { status: 400 }
      );
    }

    const userId = user_id;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }

    // 🔐 SERVICE ROLE CLIENT (no cookies, no auth session)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const issuedAt = new Date().toISOString();
    const certNumber = `CERT-${uuidv4().split("-")[0].toUpperCase()}`;

    /* -------------------------------
       Fetch module title
    -------------------------------- */
    const { data: moduleRow } = await admin
      .from("modules")
      .select("title")
      .eq("id", module_id)
      .single();

    const moduleTitle = moduleRow?.title ?? "Module";

    /* -------------------------------
       Resolve participant name
    -------------------------------- */
    let fullName = "Participant";

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.first_name || profile?.last_name) {
      fullName = `${profile?.first_name ?? ""} ${
        profile?.last_name ?? ""
      }`.trim();
    }

    /* -------------------------------
       PDF CREATION
    -------------------------------- */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const boldItalic = await pdfDoc.embedFont(
      StandardFonts.HelveticaBoldOblique
    );

    const { width, height } = page.getSize();

    const navy = rgb(0.08, 0.16, 0.38);
    const blue = rgb(0.12, 0.3, 0.78);
    const lightBlue = rgb(0.26, 0.63, 0.93);

    const center = (
      text: string,
      y: number,
      size: number,
      f = font,
      color = navy
    ) => {
      const w = f.widthOfTextAtSize(text, size);
      const x = (width - w) / 2;
      page.drawText(text, { x, y, size, font: f, color });
      return { x, w };
    };

    // Borders
    const b1 = 18;
    const b2 = 24;
    const b3 = 30;

    [b1, b2, b3].forEach((b, i) => {
      page.drawRectangle({
        x: b,
        y: b,
        width: width - b * 2,
        height: height - b * 2,
        borderColor: blue,
        borderWidth: i === 0 ? 2 : 1,
      });
    });

    /* -------------------------------
       Logos
    -------------------------------- */
    const baseUrl = getBaseUrlFromRequest(request);

    const semcmeLogo = await fetchPngBytes(
      `${baseUrl}/cert-assets/semcmeLogo.png`
    );

    if (semcmeLogo) {
      const img = await pdfDoc.embedPng(semcmeLogo);
      const d = img.scale(0.4);
      page.drawImage(img, {
        x: (width - d.width) / 2,
        y: height - 150,
        width: d.width,
        height: d.height,
      });
    }

    /* -------------------------------
       Text
    -------------------------------- */
    center("Certificate of Completion", height - 230, 28, boldItalic);
    center(
      "Southeast Michigan Center for Medical Education",
      height - 300,
      18,
      italic
    );
    center("certifies that", height - 330, 16);

    const nameY = height - 385;
    const nameLine = center(fullName, nameY, 30, italic, lightBlue);
    page.drawRectangle({
      x: nameLine.x,
      y: nameY - 6,
      width: nameLine.w,
      height: 2,
      color: lightBlue,
    });

    center(moduleTitle, height - 520, 22, boldItalic);

    const pdfBytes = await pdfDoc.save();

    /* -------------------------------
       Upload + DB record
    -------------------------------- */
    const filePath = `${userId}/${module_id}.pdf`;

    await admin.storage.from("certificates").upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    const { data: urlData } = admin.storage
      .from("certificates")
      .getPublicUrl(filePath);

    await admin.from("certificates").upsert({
      user_id: userId,
      module_id,
      issued_at: issuedAt,
      cert_number: certNumber,
      cert_url: urlData.publicUrl,
      verified: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Certificate generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate certificate", details: String(err) },
      { status: 500 }
    );
  }
}
