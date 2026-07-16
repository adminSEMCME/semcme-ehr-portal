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

type LearningPathKey = "ume" | "gme" | "cme";

const LEARNING_PATHS: Record<
  LearningPathKey,
  { title: string; levels: string[] }
> = {
  ume: {
    title: "UME Learning Path",
    levels: ["novice", "all"],
  },
  gme: {
    title: "GME Learning Path",
    levels: ["intermediate", "all"],
  },
  cme: {
    title: "CME Learning Path",
    levels: ["advanced", "all"],
  },
};

const getSkillLevels = (skillLevel?: string | null): string[] => {
  if (!skillLevel) return [];
  return skillLevel.split(",").map((level) => level.trim().toLowerCase());
};

const getPathKeyFromModuleId = (moduleId: string): LearningPathKey | null => {
  const match = moduleId.match(/^path-(ume|gme|cme)$/);
  return match ? (match[1] as LearningPathKey) : null;
};

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

    const pathKey = getPathKeyFromModuleId(module_id);

    if (!pathKey) {
      // check for existing certificate
      const { data: existingCert } = await admin
        .from("certificates")
        .select("id, cert_url, issued_at")
        .eq("user_id", user_id)
        .eq("module_id", module_id)
        .maybeSingle();

      if (existingCert?.cert_url) {
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          cert_url: existingCert.cert_url,
          issued_at: existingCert.issued_at,
        });
      }
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
    let moduleTitle = "Module";
    let objectiveText = "";
    let completedModuleTitles: string[] = [];

    if (pathKey) {
      const pathConfig = LEARNING_PATHS[pathKey];

      const { data: allModules } = await admin
        .from("modules")
        .select("id, title, skill_level, order_index")
        .order("order_index", { ascending: true });

      const pathModules =
        allModules?.filter((module) => {
          const levels = getSkillLevels(module.skill_level);
          return pathConfig.levels.some((level) => levels.includes(level));
        }) ?? [];

      if (pathModules.length === 0) {
        return NextResponse.json(
          { error: "No modules found for this learning path" },
          { status: 404 },
        );
      }

      const { data: progressRows } = await admin
        .from("module_progress")
        .select("module_id, status")
        .eq("user_id", user_id)
        .in(
          "module_id",
          pathModules.map((module) => module.id),
        );

      const completedIds = new Set(
        progressRows
          ?.filter((row) => row.status === "completed")
          .map((row) => row.module_id) ?? [],
      );

      const isComplete = pathModules.every((module) =>
        completedIds.has(module.id),
      );

      if (!isComplete) {
        return NextResponse.json(
          { error: "Learning path is not complete" },
          { status: 403 },
        );
      }

      moduleTitle = pathConfig.title;
      completedModuleTitles = pathModules.map((module) => module.title);
    } else {
      const { data: progressRow } = await admin
        .from("module_progress")
        .select("status")
        .eq("user_id", user_id)
        .eq("module_id", module_id)
        .maybeSingle();

      if (progressRow?.status !== "completed") {
        return NextResponse.json(
          { error: "Module is not complete" },
          { status: 403 },
        );
      }

      const { data: assessmentRow } = await admin
        .from("post_assessments")
        .select("module_id")
        .eq("user_id", user_id)
        .eq("module_id", module_id)
        .maybeSingle();

      if (!assessmentRow) {
        return NextResponse.json(
          {
            error:
              "Post assessment is required before generating a certificate",
          },
          { status: 403 },
        );
      }

      const { data: moduleDetails } = await admin
        .from("modules")
        .select("title, objective_description")
        .eq("id", module_id)
        .single();

      moduleTitle = moduleDetails?.title ?? "Module";
      objectiveText = moduleDetails?.objective_description ?? "";
    }

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

    let startY =
      completedModuleTitles.length > 0 ? initiativeY - 28 : initiativeY - 20;

    const wrappedTitle = wrapText(moduleTitle, width - 260, timesBold, 18);

    wrappedTitle.forEach((line) => {
      center(line, startY, 18, timesBold, navy);
      startY -= 18;
    });

    if (completedModuleTitles.length > 0) {
      startY -= 10;

      center("Completed Learning Path Modules:", startY, 14, times, navy);
      startY -= 20;

      const columnGap = 28;
      const listWidth = width - 170;
      const columnWidth = (listWidth - columnGap) / 2;
      const leftColumnX = (width - listWidth) / 2;
      const rightColumnX = leftColumnX + columnWidth + columnGap;
      const bulletSize = 10.5;
      const bulletFont = times;
      const bulletDash = "- ";
      const dashWidth = bulletFont.widthOfTextAtSize(bulletDash, bulletSize);
      const itemGap = 5;
      const lineHeight = 13;
      const splitIndex = Math.ceil(completedModuleTitles.length / 2);
      const columns = [
        {
          titles: completedModuleTitles.slice(0, splitIndex),
          x: leftColumnX,
          align: "right",
        },
        {
          titles: completedModuleTitles.slice(splitIndex),
          x: rightColumnX,
          align: "left",
        },
      ];

      columns.forEach((column) => {
        let columnY = startY;

        column.titles.forEach((title: string) => {
          const wrappedLines = wrapText(
            title,
            columnWidth - dashWidth,
            bulletFont,
            bulletSize,
          );

          wrappedLines.forEach((line: string, index: number) => {
            const textToDraw = index === 0 ? bulletDash + line : line;
            const lineWidth = bulletFont.widthOfTextAtSize(
              textToDraw,
              bulletSize,
            );
            const xPosition =
              column.align === "right"
                ? column.x + columnWidth - lineWidth
                : index === 0
                  ? column.x
                  : column.x + dashWidth;

            page.drawText(textToDraw, {
              x: xPosition,
              y: columnY,
              size: bulletSize,
              font: bulletFont,
              color: navy,
            });

            columnY -= lineHeight;
          });

          columnY -= itemGap;
        });
      });
    } else if (objectiveText) {
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

    const filePath = pathKey
      ? `${user_id}/learning-paths/${pathKey}-certificate.pdf`
      : `${user_id}/${module_id}-${certNumber}.pdf`;

    const { error: uploadError } = await admin.storage
      .from("certificates")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Certificate upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload certificate" },
        { status: 500 },
      );
    }

    const { data: urlData } = admin.storage
      .from("certificates")
      .getPublicUrl(filePath);

    if (pathKey) {
      return NextResponse.json({
        success: true,
        cert_url: `${urlData.publicUrl}?v=${encodeURIComponent(issuedAt)}`,
        issued_at: issuedAt,
      });
    }

    const { error: upsertError } = await admin.from("certificates").upsert({
      user_id,
      module_id,
      issued_at: issuedAt,
      cert_number: certNumber,
      cert_url: urlData.publicUrl,
      verified: true,
    });

    if (upsertError) {
      console.error("Certificate record failed:", upsertError);
      return NextResponse.json(
        { error: "Failed to save certificate record" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cert_url: urlData.publicUrl,
      issued_at: issuedAt,
    });
  } catch (err) {
    console.error("Certificate generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 },
    );
  }
}
