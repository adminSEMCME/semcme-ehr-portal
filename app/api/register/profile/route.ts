import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      user_id,
      external_id,
      email,
      first_name,
      last_name,
      degree,
      institution,
      department,
      title,
      phone,
      profession,
      medical_id,
      pgy_level,
      medical_school_year,
    } = body;

    if (!user_id || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await admin.from("profiles").upsert({
      id: user_id,
      external_id: external_id ?? user_id,
      email,
      first_name,
      last_name,
      degree,
      institution,
      department,
      title,
      phone,
      profession,
      medical_id,
      pgy_level,
      medical_school_year,
    });

    if (error) {
      console.error("SUPABASE PROFILE ERROR:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Profile creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}
