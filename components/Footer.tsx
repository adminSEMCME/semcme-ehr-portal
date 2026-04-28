import { Link } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        {/* Contact Support */}
        <div>
          <h3 className="text-white font-semibold">Contact Support</h3>

          <p className="mb-1">
            <a
              href="/support/technical"
              className="text-blue-500 underline hover:no-underline font-medium"
              title="go to technical support form"
            >
              Technical Support Form
            </a>
          </p>

          <p className="mb-4">
            <a
              href="/support/program"
              className="text-blue-500 underline hover:no-underline font-medium"
              title="Go to program support form"
            >
              Program Support Form
            </a>
          </p>

          <h3 className="text-white font-semibold">Simulated Demo</h3>
          <p>
            <a
              href="/demo"
              className="text-blue-500 underline hover:no-underline font-medium"
              title="View the simulated demo"
            >
              View Demo
            </a>
          </p>

          <h3 className="text-white font-semibold mt-4">About The Authors</h3>
          <p>
            <a
              href="/about-authors"
              className="text-blue-500 underline hover:no-underline font-medium"
              title="Learn more about the authors"
            >
              Meet the Team
            </a>
          </p>
        </div>

        {/* Organization */}
        <div>
          <h3 className="text-white font-semibold mb-3">Organization</h3>
          <p>Southeast Michigan Center for Medical Education</p>
          <p>EHR Learning Portal</p>

          <p className="font-normal mt-4">Phone</p>
          <p>(866) - 2SEMCME</p>
        </div>

        {/* Help */}
        <div>
          <h3 className="text-white font-semibold mb-3">Help</h3>
          <p>
            If you experience issues with module completion or certificates,
            please contact technical support.
          </p>

          <h3 className="text-white font-semibold mb-3 mt-3">Learn More</h3>
          <p>
            Want to learn more about SEMCME and our mission? Visit{" "}
            <a
              href="https://www.semcme.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              semcme.org
            </a>{" "}
            for more information about us.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-700 text-center text-xs py-4">
        © {new Date().getFullYear()} SEMCME
      </div>
    </footer>
  );
}
