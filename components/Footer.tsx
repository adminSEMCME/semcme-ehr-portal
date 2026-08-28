export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-slate-900 text-white">
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 gap-x-12 gap-y-7 px-8 py-7 text-sm md:grid-cols-3 lg:px-12">
        {/* Left column */}
        <div className="min-w-0 space-y-5">
          <section>
            <h3 className="mb-2 font-semibold text-white">Contact Support</h3>
            <div className="space-y-1.5">
              <a
                href="/support/technical"
                className="block font-medium text-blue-400 underline hover:no-underline"
                title="go to technical support form"
              >
                Technical Support Form
              </a>
              <a
                href="/support/program"
                className="block font-medium text-blue-400 underline hover:no-underline"
                title="Go to program support form"
              >
                Program Support Form
              </a>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">Explore</h3>
            <div className="space-y-1.5">
              <a
                href="/demo"
                className="block font-medium text-blue-400 underline hover:no-underline"
                title="View the simulated demo"
              >
                Simulated Demo
              </a>
              <a
                href="/about-authors"
                className="block font-medium text-blue-400 underline hover:no-underline"
                title="Learn more about the authors"
              >
                Meet the Team
              </a>
            </div>
          </section>
        </div>

        {/* Middle column */}
        <div className="min-w-0 space-y-5">
          <section>
            <h3 className="mb-2 font-semibold text-white">For Educators</h3>
            <a
              href="/instructor-guide"
              className="font-medium text-blue-400 underline hover:no-underline"
              title="View educator information and module previews"
            >
              Information &amp; Previews
            </a>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">Organization</h3>
            <p className="leading-relaxed text-slate-200">
              Southeast Michigan Center for Medical Education
              <br />
              EHR Learning Portal
            </p>
            <p className="mt-2 text-slate-200">(866) - 2SEMCME</p>
          </section>
        </div>

        {/* Right column */}
        <div className="min-w-0">
          <h3 className="mb-2 font-semibold text-white">Help</h3>
          <p className="leading-relaxed text-slate-200">
            If you experience issues with modules, completion or certificates,
            please fill out the technical support form.
          </p>
          <p className="mt-2 leading-relaxed text-slate-200">
            If you need help with program issues or have questions, please fill
            out the program support form.
          </p>

          <p className="mt-2 leading-relaxed text-slate-200">
            Learn more about SEMCME and our mission at{" "}
            <a
              href="https://www.semcme.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white underline hover:no-underline"
              title="Visit the SEMCME website"
            >
              semcme.org
            </a>
            .
          </p>
        </div>
      </div>

      <div className="border-t border-slate-700 py-3 text-center text-xs text-slate-300">
        © {new Date().getFullYear()} SEMCME
      </div>
    </footer>
  );
}
