import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { readFile } from "fs/promises";

async function readPublicFile(relPath: string): Promise<Uint8Array | null> {
  try {
    const abs = path.join(process.cwd(), "public", relPath);
    const buf = await readFile(abs);
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          },
        },
      }
    );

    // 🔐 Auth check
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = userData.user.id;

    // Parse body
    const body = (await request.json().catch(() => ({}))) as any;
    const { module_id, status = "in_progress", progress_percent = 0 } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    // Prevent re-issuing
    const { data: existing } = await supabase
      .from("module_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    if (existing?.status === "completed") {
      return NextResponse.json({ success: true });
    }

    // Upsert progress
    await supabase.from("module_progress").upsert(
      {
        user_id: userId,
        module_id,
        status,
        progress_percent: status === "completed" ? 100 : progress_percent,
        date_completed:
          status === "completed" ? new Date().toISOString() : null,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );

    // 🎓 Generate certificate
    if (status === "completed") {
      const issuedAt = new Date().toISOString();
      const certNumber = `CERT-${uuidv4().split("-")[0].toUpperCase()}`;

      // Module title
      const { data: moduleData } = await supabase
        .from("modules")
        .select("title")
        .eq("id", module_id)
        .single();

      const moduleTitle = moduleData?.title ?? "Module";

      // User name (from profiles)
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();

      const fullName =
        profile && (profile.first_name || profile.last_name)
          ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
          : "Participant";

      // Create PDF (Letter size)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const boldItalic = await pdfDoc.embedFont(
        StandardFonts.HelveticaBoldOblique
      );

      const { width, height } = page.getSize();

      const navy = rgb(0.08, 0.16, 0.38);
      const borderBlue = rgb(0.12, 0.3, 0.78);
      const nameBlue = rgb(0.26, 0.63, 0.93);

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

      // Double border
      page.drawRectangle({
        x: 18,
        y: 18,
        width: width - 36,
        height: height - 36,
        borderColor: borderBlue,
        borderWidth: 2,
      });
      page.drawRectangle({
        x: 28,
        y: 28,
        width: width - 56,
        height: height - 56,
        borderColor: borderBlue,
        borderWidth: 1,
      });

      // Logos
      const semcmeLogo = await readPublicFile("cert-assets/semcme-logo.png");
      const valueLogo = await readPublicFile(
        "cert-assets/valuePartnershipsLogo.png"
      );
      const bcbsLogo = await readPublicFile("cert-assets/blueCrossLogo.png");

      if (semcmeLogo) {
        const img = await pdfDoc.embedPng(semcmeLogo);
        const d = img.scale(0.22);
        page.drawImage(img, {
          x: 70,
          y: height - 105,
          width: d.width,
          height: d.height,
        });
      }

      page.drawText("Southeast Michigan", {
        x: 185,
        y: height - 70,
        size: 18,
        font,
      });
      page.drawText("Center for Medical Education", {
        x: 185,
        y: height - 92,
        size: 18,
        font,
      });

      // Title
      const t = center(
        "Certificate of Completion",
        height - 190,
        30,
        boldItalic
      );
      page.drawRectangle({
        x: t.x,
        y: height - 194,
        width: t.w,
        height: 2,
        color: borderBlue,
      });

      center(
        "Southeast Michigan Center for Medical Education",
        height - 270,
        20,
        italic
      );
      center("certifies that", height - 300, 18);

      const n = center(fullName, height - 365, 34, italic, nameBlue);
      page.drawRectangle({
        x: n.x,
        y: height - 372,
        width: n.w,
        height: 2,
        color: nameBlue,
      });

      center(
        "has completed the following educational activity",
        height - 420,
        18
      );

      center(
        "Michigan Electronic Health Record & Health Information Exchange Initiative:",
        height - 495,
        16,
        italic
      );

      center(moduleTitle, height - 535, 24, boldItalic);

      // Bottom logos
      if (valueLogo) {
        const img = await pdfDoc.embedPng(valueLogo);
        const d = img.scale(0.22);
        page.drawImage(img, { x: 55, y: 45, width: d.width, height: d.height });
      }

      if (bcbsLogo) {
        const img = await pdfDoc.embedPng(bcbsLogo);
        const d = img.scale(0.22);
        page.drawImage(img, {
          x: width - d.width - 55,
          y: 45,
          width: d.width,
          height: d.height,
        });
      }

      // Footer meta
      center(
        `Issued on ${new Date(
          issuedAt
        ).toLocaleDateString()} • Certificate ID: ${certNumber}`,
        30,
        10,
        font,
        rgb(0.25, 0.25, 0.25)
      );

      const pdfBytes = await pdfDoc.save();

      // Upload
      const filePath = `${userId}/${module_id}.pdf`;
      await supabase.storage.from("certificates").upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

      const { data: urlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath);

      await supabase.from("certificates").upsert({
        user_id: userId,
        module_id,
        issued_at: issuedAt,
        cert_number: certNumber,
        cert_url: urlData.publicUrl,
        verified: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
