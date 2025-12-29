import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";

function getBaseUrl() {
  // Works on Vercel + local dev.
  // On Vercel: VERCEL_URL = "your-project.vercel.app"
  // Locally: fallback to http://localhost:3000
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  // If you ever add a custom domain and want exact control, you can set BASE_URL in env.
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) return baseUrl;

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

    // ✅ Parse request body
    const body = (await request.json().catch(() => ({}))) as any;
    const {
      module_id,
      status = "in_progress",
      progress_percent = 0,
      date_completed,
    } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    // ✅ Prevent regressions / re-issuing
    const { data: existingProgress } = await supabase
      .from("module_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    if (existingProgress?.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Module already completed",
      });
    }

    // ✅ Upsert module progress
    const payload: any = {
      user_id: userId,
      module_id,
      status,
      progress_percent,
      last_accessed: new Date().toISOString(),
    };

    if (status === "in_progress" && !date_completed) {
      payload.date_started = payload.date_started || new Date().toISOString();
    }

    if (status === "completed") {
      payload.date_completed = date_completed || new Date().toISOString();
      payload.progress_percent = 100;
    }

    const { data, error } = await supabase
      .from("module_progress")
      .upsert(payload, { onConflict: "user_id,module_id" })
      .select();

    if (error) throw error;

    // NOTE: Certificate email delivery will be enabled once
    // sending domain DNS records are configured.

    // 🎓 Generate and upload certificate only when completed
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

      // User name from profiles (source of truth)
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
      const page = pdfDoc.addPage([612, 792]); // 8.5x11
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

      // ✅ Fetch logos over HTTP (prevents Vercel bundling huge /public folders)
      const baseUrl = getBaseUrl();

      const semcmeLogoBytes = await fetchPngBytes(
        `${baseUrl}/cert-assets/semcme-logo.png`
      );
      const valueLogoBytes = await fetchPngBytes(
        `${baseUrl}/cert-assets/valuePartnershipsLogo.png`
      );
      const bcbsLogoBytes = await fetchPngBytes(
        `${baseUrl}/cert-assets/blueCrossLogo.png`
      );

      // Top SEMCME logo
      if (semcmeLogoBytes) {
        const img = await pdfDoc.embedPng(semcmeLogoBytes);
        const d = img.scale(0.22);
        page.drawImage(img, {
          x: 70,
          y: height - 105,
          width: d.width,
          height: d.height,
        });
      }

      // Top header text (matches your sample)
      page.drawText("Southeast Michigan", {
        x: 185,
        y: height - 70,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText("Center for Medical Education", {
        x: 185,
        y: height - 92,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });

      // Title (bold italic + underline)
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

      // Body text (exact style/structure you showed)
      center(
        "Southeast Michigan Center for Medical Education",
        height - 270,
        20,
        italic
      );
      center("certifies that", height - 300, 18, font);

      // Name (blue italic + underline)
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
        18,
        font
      );

      center(
        "Michigan Electronic Health Record & Health Information Exchange Initiative:",
        height - 495,
        16,
        italic
      );

      center(moduleTitle, height - 535, 24, boldItalic);

      // Bottom logos (left + right)
      if (valueLogoBytes) {
        const img = await pdfDoc.embedPng(valueLogoBytes);
        const d = img.scale(0.22);
        page.drawImage(img, {
          x: 55,
          y: 45,
          width: d.width,
          height: d.height,
        });
      }

      if (bcbsLogoBytes) {
        const img = await pdfDoc.embedPng(bcbsLogoBytes);
        const d = img.scale(0.22);
        page.drawImage(img, {
          x: width - d.width - 55,
          y: 45,
          width: d.width,
          height: d.height,
        });
      }

      // Small footer metadata (you can remove if you want)
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

      // Upload to Storage
      const filePath = `${userId}/${module_id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Public URL
      const { data: urlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath);

      // Save DB record
      await supabase.from("certificates").upsert({
        user_id: userId,
        module_id,
        issued_at: issuedAt,
        cert_number: certNumber,
        cert_url: urlData.publicUrl,
        verified: true,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error updating module progress:", err);
    return NextResponse.json(
      { error: "Failed to update module progress", details: String(err) },
      { status: 500 }
    );
  }
}
