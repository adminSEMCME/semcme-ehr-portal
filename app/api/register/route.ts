import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Creates a Supabase Auth user and stores the app profile fields.
export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE environment variables are not configured.");
      return NextResponse.json(
        { error: "Server is not configured for registration." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      degree,
      institution_id,
      custom_institution,
      department,
      title,
      profession,
      medical_id,
      pgy_level,
      medical_school_year,
      oversee_role,
      moduleId,
    } = body;

    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: "Missing required registration fields." },
        { status: 400 },
      );
    }

    if (!institution_id && !custom_institution?.trim()) {
      return NextResponse.json(
        { error: "Institution selection or custom institution is required." },
        { status: 400 },
      );
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Use an existing institution or create the custom one entered.
    let resolvedInstitutionId = institution_id;

    if (!resolvedInstitutionId) {
      const { data: newInstitution, error: institutionError } = await admin
        .from("institutions")
        .insert([{ name: custom_institution.trim() }])
        .select()
        .single();

      if (institutionError || !newInstitution) {
        console.error("Failed to create custom institution:", institutionError);
        return NextResponse.json(
          { error: "Unable to save institution." },
          { status: 500 },
        );
      }

      resolvedInstitutionId = newInstitution.id;
    }

    const signUpOptions: any = {
      email,
      password,
      options: {},
    };

    // Preserve the requested module through email confirmation when present.
    if (moduleId) {
      signUpOptions.options.emailRedirectTo = `https://ehr.portal.semcme.org/login?module=${moduleId}`;
    }

    const { data: authData, error: authError } =
      await authClient.auth.signUp(signUpOptions);

    if (authError) {
      console.error("Supabase createUser error:", authError);

      const status =
        authError.status === 400 ? 400 : authError.status === 409 ? 409 : 500;
      const message =
        authError.status === 409
          ? "Email already registered."
          : authError.status === 400
            ? "Invalid signup data."
            : authError.message?.includes("already")
              ? "Email already registered."
              : "Registration failed.";

      return NextResponse.json({ error: message }, { status });
    }

    const user_id = authData?.user?.id;

    if (!user_id) {
      console.error("Supabase returned no user ID during registration.");
      return NextResponse.json(
        { error: "Registration failed." },
        { status: 500 },
      );
    }

    const isInstitutionAdmin = role === "Institution Administrator";
    // Store portal-specific profile details after Auth creates the user.
    const { error: profileError } = await admin.from("profiles").insert({
      id: user_id,
      external_id: user_id,
      role,
      email,
      first_name,
      last_name,
      degree: degree || null,
      institution_id: resolvedInstitutionId,
      department: department || null,
      title: title || null,
      profession: profession || null,
      medical_id: medical_id || null,
      pgy_level: pgy_level || null,
      medical_school_year: medical_school_year || null,
      oversee_role: oversee_role || null,
      is_approved: isInstitutionAdmin ? false : true,
    });

    if (profileError) {
      console.error("Profile insertion failed:", profileError);
      return NextResponse.json(
        { error: "Unable to save profile." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user_id });
  } catch (err: any) {
    console.error("Registration route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
