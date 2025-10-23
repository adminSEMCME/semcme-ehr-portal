export default function ChooseRegistrationType() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-xl text-center">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-4">
          Are you taking this course for CME credit?
        </h1>
        <p className="text-gray-600 mb-8">
          Choose the option that applies to you. We'll tailor your registration
          form accordingly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/register/cme"
            className="block w-full py-3 rounded-xl bg-semcmeBlue text-white font-semibold hover:bg-[#034f8c] transition"
          >
            Yes — CME Credit
          </a>

          <a
            href="/register/non-cme"
            className="block w-full py-3 rounded-xl border-2 border-semcmeBlue text-semcmeBlue font-semibold hover:bg-semcmeBlue hover:text-white transition"
          >
            No — Non-CME Credit
          </a>
        </div>

        <p className="text-gray-600 mt-6 text-sm">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-semcmeBlue font-semibold hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
