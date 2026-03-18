// app/api/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

function wrapText(text: string, maxWidth: number, font: any, fontSize: number) {
  const cleanedText = text.replace(/\n/g, " ");
  const words = cleanedText.split(" ");
  
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
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
    const { module_id } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    // ✅ Get user from session
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = user.id;

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // check for existing certificate
    const { data: existingCert } = await admin
      .from("certificates")
      .select("id")
      .eq("user_id", user_id)
      .eq("module_id", module_id)
      .maybeSingle();

    if (existingCert) {
      return NextResponse.json({ success: true, alreadyExists: true });
    }

    const issuedAt = new Date().toISOString();
    const certNumber = `CERT-${uuidv4().split("-")[0].toUpperCase()}`;

    const completedDate = new Date(issuedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    /* -------------------------------
       Fetch Data
    -------------------------------- */
    const { data: moduleDetails } = await admin
      .from("modules")
      .select("title, objective_description")
      .eq("id", module_id)
      .single();

    const moduleTitle = moduleDetails?.title ?? "Module";
    const objectiveText = moduleDetails?.objective_description ?? "";

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", user_id)
      .maybeSingle();

    const fullName =
      profile?.first_name || profile?.last_name
        ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
        : "Participant";

    /* -------------------------------
       Create PDF
    -------------------------------- */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([792, 612]);

    const { width, height } = page.getSize();

    /* ---------- Fonts ---------- */

    const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helveticaBoldOblique = await pdfDoc.embedFont(
      StandardFonts.HelveticaBoldOblique,
    );
    const helveticaOblique = await pdfDoc.embedFont(
      StandardFonts.HelveticaOblique,
    );

    /* ---------- Colors ---------- */

    const black = rgb(0, 0, 0);
    const navy = rgb(0.08, 0.16, 0.38);
    const lightBlue = rgb(0.26, 0.63, 0.93);
    const blue = rgb(0.12, 0.3, 0.78);

    const center = (
      text: string,
      y: number,
      size: number,
      font: any,
      color = navy,
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      const x = (width - textWidth) / 2;
      page.drawText(text, { x, y, size, font, color });
      return { x, textWidth };
    };

    /* ---------- Border ---------- */

    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderColor: blue,
      borderWidth: 3,
    });

    /* ---------- Top Logo ---------- */

    const baseUrl = getBaseUrlFromRequest(request);
    const logoBytes = await fetchPngBytes(
      `${baseUrl}/cert-assets/semcmeLogo.png`,
    );

    if (logoBytes) {
      const img = await pdfDoc.embedPng(logoBytes);
      const scaled = img.scale(0.28);
      page.drawImage(img, {
        x: (width - scaled.width) / 2,
        y: height - 95,
        width: scaled.width,
        height: scaled.height,
      });
    }

    /* -------------------------------
       TEXT SECTION
    -------------------------------- */

    const titleY = height - 150;

    const certTitle = center(
      "Certificate of Completion",
      titleY,
      28,
      helveticaBoldOblique,
      black,
    );

    page.drawRectangle({
      x: certTitle.x,
      y: titleY - 4,
      width: certTitle.textWidth,
      height: 1,
      color: black,
    });

    center(
      "Southeast Michigan Center for Medical Education",
      titleY - 45,
      18,
      times,
      navy,
    );

    center("certifies that", titleY - 65, 16, times, navy);

    const nameY = titleY - 100;

    const nameLine = center(fullName, nameY, 28, helveticaOblique, lightBlue);

    page.drawRectangle({
      x: nameLine.x,
      y: nameY - 4,
      width: nameLine.textWidth,
      height: 1,
      color: lightBlue,
    });

    const activityLineY = nameY - 35;

    center(
      "has completed the following educational activity",
      activityLineY,
      16,
      times,
      navy,
    );

    const initiativeY = activityLineY - 27;

    center(
      "Michigan Electronic Health Record & Health Information Exchange Initiative:",
      initiativeY,
      14,
      times,
      navy,
    );

    let startY = initiativeY - 20;

    const wrappedTitle = wrapText(moduleTitle, width - 260, timesBold, 18);

    wrappedTitle.forEach((line) => {
      center(line, startY, 18, timesBold, navy);
      startY -= 18;
    });

    if (objectiveText) {
      startY -= 17;

      // Learning Objectives title
      center("Learning Objectives:", startY, 14, times, navy);
      startY -= 20;

      const columnWidth = width - 360;
      const columnX = (width - columnWidth) / 2;

      const bulletSize = 13;
      const bulletFont = times;

      const bulletDash = "- ";
      const dashWidth = bulletFont.widthOfTextAtSize(bulletDash, bulletSize);

      const objectives = objectiveText
        .split(/\r?\n/)
        .map((o: string) => o.trim())
        .filter(Boolean);

      objectives.forEach((obj: string) => {
        // Wrap WITHOUT dash
        const wrappedLines = wrapText(
          obj,
          columnWidth - dashWidth,
          bulletFont,
          bulletSize,
        );

        wrappedLines.forEach((line: string, index: number) => {
          const textToDraw = index === 0 ? bulletDash + line : line;
          const xPosition = index === 0 ? columnX : columnX + dashWidth;

          page.drawText(textToDraw, {
            x: xPosition,
            y: startY,
            size: bulletSize,
            font: bulletFont,
            color: navy,
          });

          startY -= 19;
        });

        startY -= 6;
      });
    }

    /* -------------------------------
       Bottom Section (unchanged)
    -------------------------------- */

    const borderPadding = 18;
    const bottomY = borderPadding + 6;

    const valueBytes = await fetchPngBytes(
      `${baseUrl}/cert-assets/valuePartnershipsLogo.png`,
    );
    if (valueBytes) {
      const img = await pdfDoc.embedPng(valueBytes);
      const scaled = img.scale(0.5);
      page.drawImage(img, {
        x: borderPadding + 6,
        y: bottomY,
        width: scaled.width,
        height: scaled.height,
      });
    }

    const bcbsBytes = await fetchPngBytes(
      `${baseUrl}/cert-assets/blueCrossLogo.png`,
    );
    if (bcbsBytes) {
      const img = await pdfDoc.embedPng(bcbsBytes);
      const scaled = img.scale(0.65);
      page.drawImage(img, {
        x: width - borderPadding - scaled.width - 6,
        y: bottomY - 6,
        width: scaled.width,
        height: scaled.height,
      });
    }

    const labelWidth = times.widthOfTextAtSize("Date Completed:", 12);
    const valueWidth = times.widthOfTextAtSize(completedDate, 14);

    page.drawText("Date Completed:", {
      x: (width - labelWidth) / 2,
      y: bottomY + 22,
      size: 12,
      font: times,
      color: navy,
    });

    page.drawText(completedDate, {
      x: (width - valueWidth) / 2,
      y: bottomY + 8,
      size: 14,
      font: times,
      color: navy,
    });

    const pdfBytes = await pdfDoc.save();

    const filePath = `${user_id}/${module_id}-${certNumber}.pdf`;

    await admin.storage.from("certificates").upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    const { data: urlData } = admin.storage
      .from("certificates")
      .getPublicUrl(filePath);

    await admin.from("certificates").upsert({
      user_id,
      module_id,
      issued_at: issuedAt,
      cert_number: certNumber,
      cert_url: urlData.publicUrl,
      verified: true,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Certificate generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 },
    );
  }
}
