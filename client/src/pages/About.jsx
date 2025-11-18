import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            About Us
          </h1>

          <p className="text-gray-700 mb-6 text-sm md:text-base">
            Welcome to our news portal — a local-first newsroom focused on
            bringing timely, reliable and relevant updates to our readers in
            Madhya Pradesh and beyond. We cover politics, business, health,
            education, entertainment and community stories with a focus on
            accuracy and context.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Editor Card */}
            <div className="md:col-span-1 flex flex-col items-center text-center">
              <img
                src="/vite.svg"
                alt="Editor"
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-md mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                Asha Verma
              </h2>
              <p className="text-sm text-gray-600">Editor-in-Chief</p>
              <p className="text-sm text-gray-500 mt-3">mpnetwork10news@gmail.com</p>
              <div className="flex gap-3 mt-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                >
                  Twitter
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-[#1877F2] text-white rounded-md text-sm"
                >
                  Facebook
                </a>
              </div>
            </div>

            {/* Mission / Values */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Our mission
              </h3>
              <p className="text-gray-700 mb-4 text-sm md:text-base">
                We aim to be the trusted voice for local communities by
                reporting with integrity, listening to readers, and supporting
                civic conversation. Our editorial standards prioritize
                verification, fairness, and clear sourcing so that you can rely
                on our coverage.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What we publish
              </h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 text-sm md:text-base">
                <li>
                  Local news and events across districts of Madhya Pradesh
                </li>
                <li>Investigative reports and explainers</li>
                <li>Community features and human stories</li>
                <li>Multimedia: photos, videos and on-the-ground reporting</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get in touch
              </h3>
              <p className="text-gray-700 mb-4 text-sm md:text-base">
                Want to send a tip, suggest a story, or ask about corrections?
                Email our editorial desk at{" "}
                <a className="text-blue-600" href="mailto:mpnetwork10news@gmail.com">
                  mpnetwork10news@gmail.com
                </a>
                .
              </p>

              <Link
                to="/news"
                className="inline-block px-4 py-2 bg-[var(--primary)] text-white rounded-md font-medium"
              >
                Back to news
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
