import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // User-scoped client (keeps your existing auth/session behavior)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) =>
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            ),
        },
      }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = userData.user;
    const userId = user.id;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }

    // Admin client ONLY for reading profiles/modules reliably (no metadata name)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    const { data: existingProgress } = await supabase
      .from("module_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    // admin client already exists below — reuse it here
    const { data: existingCert } = await admin
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    if (existingProgress?.status === "completed" && existingCert) {
      return NextResponse.json({
        success: true,
        message: "Module already completed",
      });
    }

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

    // Only generate cert on completion
    if (status !== "completed") {
      return NextResponse.json({ success: true, data });
    }

    const issuedAt = new Date().toISOString();
    const certNumber = `CERT-${uuidv4().split("-")[0].toUpperCase()}`;

    // Module title (admin read)
    const { data: moduleRow } = await admin
      .from("modules")
      .select("title")
      .eq("id", module_id)
      .single();

    const moduleTitle = moduleRow?.title ?? "Module";

    // ✅ Name comes ONLY from public.profiles (admin read; try id, then email)
    let fullName = "Participant";

    const { data: profileById } = await admin
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileById?.first_name || profileById?.last_name) {
      fullName = `${profileById?.first_name ?? ""} ${
        profileById?.last_name ?? ""
      }`.trim();
    } else if (user.email) {
      const { data: profileByEmail } = await admin
        .from("profiles")
        .select("first_name,last_name")
        .eq("email", user.email)
        .maybeSingle();

      if (profileByEmail?.first_name || profileByEmail?.last_name) {
        fullName = `${profileByEmail?.first_name ?? ""} ${
          profileByEmail?.last_name ?? ""
        }`.trim();
      }
    }

    if (!fullName) fullName = "Participant";

    /* =========================
       PDF CREATION
    ========================= */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter

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

    /* =========================
       3 TIGHT BLUE BORDERS
    ========================= */
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

    /* =========================
       LOGOS
    ========================= */
    const baseUrl = getBaseUrlFromRequest(request);

    // Top logo: add cache-bust retry to avoid any weird caching/edge misses
    let semcmeLogo = await fetchPngBytes(
      `${baseUrl}/cert-assets/semcmeLogo.png`
    );
    if (!semcmeLogo) {
      semcmeLogo = await fetchPngBytes(
        `${baseUrl}/cert-assets/semcmeLogo.png?v=${Date.now()}`
      );
    }

    const valueLogo = await fetchPngBytes(
      `${baseUrl}/cert-assets/valuePartnershipsLogo.png?v=${Date.now()}`
    );
    const bcbsLogo = await fetchPngBytes(
      `${baseUrl}/cert-assets/blueCrossLogo.png?v=${Date.now()}`
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

    /* =========================
       TEXT LAYOUT (CLOSE TO REF)
    ========================= */
    const titleY = height - 230;
    const title = center("Certificate of Completion", titleY, 28, boldItalic);
    page.drawRectangle({
      x: title.x,
      y: titleY - 4,
      width: title.w,
      height: 2,
      color: blue,
    });

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

    center(
      "has completed the following educational activity",
      height - 430,
      16
    );

    center(
      "Michigan Electronic Health Record & Health Information Exchange Initiative:",
      height - 485,
      14,
      italic
    );

    center(moduleTitle, height - 520, 22, boldItalic);

    /* =========================
       BOTTOM LOGOS (BIGGER)
    ========================= */
    const bottomY = 85;

    if (valueLogo) {
      const img = await pdfDoc.embedPng(valueLogo);
      const d = img.scale(0.38); // bigger
      page.drawImage(img, {
        x: b3 + 10,
        y: bottomY,
        width: d.width,
        height: d.height,
      });
    }

    if (bcbsLogo) {
      const img = await pdfDoc.embedPng(bcbsLogo);
      const d = img.scale(0.38); // bigger
      page.drawImage(img, {
        x: width - b3 - d.width - 10,
        y: bottomY,
        width: d.width,
        height: d.height,
      });
    }

    center(
      `Issued on ${new Date(
        issuedAt
      ).toLocaleDateString()} • Certificate ID: ${certNumber}`,
      48,
      10,
      font,
      rgb(0.25, 0.25, 0.25)
    );

    const pdfBytes = await pdfDoc.save();

    /* =========================
       UPLOAD + DB RECORD
    ========================= */
    const filePath = `${userId}/${module_id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

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

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error updating module progress:", err);
    return NextResponse.json(
      { error: "Failed to update module progress", details: String(err) },
      { status: 500 }
    );
  }
}
