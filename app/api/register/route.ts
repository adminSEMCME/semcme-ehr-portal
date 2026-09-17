import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { notifyInstitutionAdminRegistration } from "@/lib/institutionAdminNotification";
import {
  hasAtLeastTwoWords,
  normalizeInstitutionName,
} from "@/lib/institutionName";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIN_PASSWORD_LENGTH = 8;

// Creates a Supabase Auth user and stores the app profile fields.
export async function POST(req: Request) {
  let admin: SupabaseClient | null = null;
  let createdInstitutionId: string | null = null;
  let createdAuthUserId: string | null = null;

  const cleanUpPartialRegistration = async () => {
    if (!admin) return;

    if (createdAuthUserId) {
      const { error } = await admin.auth.admin.deleteUser(createdAuthUserId);
      if (error) console.error("Failed to clean up Auth user:", error);
    }

    if (createdInstitutionId) {
      const { error } = await admin
        .from("institutions")
        .delete()
        .eq("id", createdInstitutionId);
      if (error) console.error("Failed to clean up institution:", error);
    }
  };

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
      moduleId,
    } = body;

    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: "Missing required registration fields." },
        { status: 400 },
      );
    }

    if (
      typeof password !== "string" ||
      password.length < MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    const normalizedCustomInstitution = normalizeInstitutionName(
      typeof custom_institution === "string" ? custom_institution : "",
    );

    if (!institution_id) {
      if (!normalizedCustomInstitution) {
        return NextResponse.json(
          { error: "Institution selection or custom institution is required." },
          { status: 400 },
        );
      }

      if (!hasAtLeastTwoWords(normalizedCustomInstitution)) {
        return NextResponse.json(
          {
            error:
              "Please enter the full institution name using at least two words.",
          },
          { status: 400 },
        );
      }
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Use an existing institution or create the custom one entered.
    let resolvedInstitutionId = institution_id;

    if (!resolvedInstitutionId) {
      // Reuse a matching custom institution, including one left behind by an
      // older interrupted registration, rather than creating a duplicate.
      const { data: existingInstitution, error: lookupError } = await admin
        .from("institutions")
        .select("id")
        .eq("name", normalizedCustomInstitution)
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        console.error("Failed to look up custom institution:", lookupError);
        return NextResponse.json(
          { error: "Unable to save institution." },
          { status: 500 },
        );
      }

      if (existingInstitution) {
        resolvedInstitutionId = existingInstitution.id;
      }
    }

    if (!resolvedInstitutionId) {
      const { data: newInstitution, error: institutionError } = await admin
        .from("institutions")
        .insert([{ name: normalizedCustomInstitution }])
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
      createdInstitutionId = newInstitution.id;
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
      await cleanUpPartialRegistration();

      const isWeakPassword = authError.code === "weak_password";
      const status =
        isWeakPassword || authError.status === 400
          ? 400
          : authError.status === 409
            ? 409
            : 500;
      const message =
        isWeakPassword
          ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
          : authError.status === 409
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
      await cleanUpPartialRegistration();
      return NextResponse.json(
        { error: "Registration failed." },
        { status: 500 },
      );
    }

    // With email enumeration protection enabled, Supabase can return an
    // existing user with no identities instead of an explicit duplicate-email
    // error. Do not write a profile for—or later delete—that existing user.
    if ((authData.user?.identities?.length ?? 0) === 0) {
      await cleanUpPartialRegistration();
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 },
      );
    }

    createdAuthUserId = user_id;

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
      is_approved: isInstitutionAdmin ? false : true,
    });

    if (profileError) {
      console.error("Profile insertion failed:", profileError);
      await cleanUpPartialRegistration();
      return NextResponse.json(
        { error: "Unable to save profile." },
        { status: 500 },
      );
    }

    if (isInstitutionAdmin) {
      // Keep notification work isolated from registration cleanup on failure.
      try {
        const { data: institution } = await admin
          .from("institutions")
          .select("name")
          .eq("id", resolvedInstitutionId)
          .maybeSingle();

        await notifyInstitutionAdminRegistration({
          userId: user_id,
          firstName: first_name,
          lastName: last_name,
          email,
          institution: institution?.name || normalizedCustomInstitution || "See admin dashboard",
        });
      } catch (error) {
        console.error("IA notification could not be prepared; request remains pending:", user_id, error);
      }
    }

    return NextResponse.json({ success: true, user_id });
  } catch (err: any) {
    console.error("Registration route error:", err);
    await cleanUpPartialRegistration();
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
