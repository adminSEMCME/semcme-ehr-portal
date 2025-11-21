import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";

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

    // ✅ Auth check
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = userData.user;
    const userId = user.id;

    // ✅ Parse request body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      module_id,
      status = "in_progress",
      progress_percent = 0,
      date_completed,
    } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    // ✅ Prevent regressions (don’t overwrite completed modules)
    const { data: existingProgress } = await supabase
      .from("module_progress")
      .select("status, progress_percent")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    if (existingProgress?.status === "completed") {
      // Don’t reissue or overwrite certificates for already completed modules
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

    // 🧾 Generate and upload certificate only when completed
    if (status === "completed") {
      const certNumber = `CERT-${uuidv4().split("-")[0].toUpperCase()}`;
      const issuedAt = new Date().toISOString();

      // Fetch module info (title shown on certificate)
      const { data: moduleData } = await supabase
        .from("modules")
        .select("title")
        .eq("id", module_id)
        .single();
      const moduleTitle = moduleData?.title || `Module ${module_id}`;

      // --- Generate PDF with pdf-lib ---
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();

      const drawCentered = (
        text: string,
        y: number,
        size = 16,
        useBold = false,
        color = rgb(0, 0, 0)
      ) => {
        const f = useBold ? fontBold : font;
        const textWidth = f.widthOfTextAtSize(text, size);
        const x = (width - textWidth) / 2;
        page.drawText(text, { x, y, size, font: f, color });
      };

      // Header line
      page.drawRectangle({
        x: 50,
        y: height - 120,
        width: width - 100,
        height: 1.5,
        color: rgb(0.2, 0.4, 0.8),
      });

      drawCentered(
        "Certificate of Completion",
        height - 160,
        28,
        true,
        rgb(0.1, 0.2, 0.5)
      );
      drawCentered("This certifies that", height - 210, 14);

      const fullName = `${user.user_metadata?.first_name ?? "Participant"} ${
        user.user_metadata?.last_name ?? ""
      }`.trim();

      drawCentered(fullName, height - 240, 22, true);
      drawCentered("has successfully completed", height - 275, 14);
      drawCentered(moduleTitle, height - 305, 18, true);

      drawCentered(
        `Issued on ${new Date(issuedAt).toLocaleDateString()}`,
        height - 350,
        12
      );
      drawCentered(`Certificate ID: ${certNumber}`, height - 370, 12);

      // Footer line
      page.drawRectangle({
        x: 50,
        y: 100,
        width: width - 100,
        height: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      drawCentered(
        "Southeast Michigan Center for Medical Education",
        80,
        10,
        false,
        rgb(0.3, 0.3, 0.3)
      );

      const pdfBytes = await pdfDoc.save();

      // --- Upload to Supabase Storage ---
      const filePath = `${userId}/${module_id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath);

      const certUrl = publicUrlData.publicUrl;

      // Record in certificates table
      await supabase.from("certificates").upsert({
        user_id: userId,
        module_id,
        issued_at: issuedAt,
        cert_number: certNumber,
        cert_url: certUrl,
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
