import { Link } from "react-router-dom";
import { useSite } from "../contexts/SiteContext.jsx";
import LazyImage from "../components/LazyImage.jsx";
import { Mail, Phone, Youtube, Instagram, Facebook } from "lucide-react";

export default function About() {
  const { site } = useSite();

  // no local subscribe state (subscribe UI removed)

  const info = site || {};
  const editorImage = info?.editorImage || "/vite.svg";
  const editorName = info?.editorName || "Editor Name";
  const editorTitle = info?.editorTitle || "Editor-in-Chief";
  const editorEmail = info?.editorEmail || "";
  const phone = info?.phone || "";
  const youtube = info?.youtube || "";
  const instagram = info?.instagram || "";
  const facebook = info?.facebook || "";
  const mission = info?.mission || "";
  const aboutHtml = info?.aboutHtml || "<p>No about content yet.</p>";

  return (
    <div className="p-6 md:p-12 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 p-6 md:p-10">
            <div className="flex items-center justify-center md:justify-start">
              <LazyImage
                src={editorImage}
                alt="Editor"
                className="w-28 h-28 md:w-36 md:h-36 rounded-full shadow-lg"
                style={{ borderRadius: "9999px" }}
              />
            </div>

            <div className="md:col-span-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {editorName}
              </h1>
              <p className="text-sm text-gray-600 mb-3">{editorTitle}</p>
              {mission ? (
                <p className="text-gray-700 text-sm md:text-base">{mission}</p>
              ) : (
                <p className="text-gray-600">
                  We are a local-first newsroom serving our community.
                </p>
              )}

              {/* action buttons removed per design: no CTAs here */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow p-6 prose max-w-none text-gray-700">
              <h2 className="text-xl font-semibold text-gray-900">About</h2>
              <div dangerouslySetInnerHTML={{ __html: aboutHtml }} />
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Our values
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Accuracy and verification</li>
                <li>Community-focused reporting</li>
                <li>Transparency and corrections</li>
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h4 id="contact" className="text-sm text-gray-500 uppercase mb-2">
                Contact
              </h4>
              <div className="flex flex-col items-center gap-2">
                <div className="text-gray-900 font-semibold">{editorName}</div>
                <div className="text-sm text-gray-600">{editorTitle}</div>
              </div>

              <div className="mt-4 space-y-3">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-3 justify-center text-sm text-gray-700 hover:text-gray-900"
                  >
                    <Phone className="w-4 h-4" /> <span>{phone}</span>
                  </a>
                ) : null}

                {editorEmail ? (
                  <a
                    href={`mailto:${editorEmail}`}
                    className="flex items-center gap-3 justify-center text-sm text-gray-700 hover:text-gray-900"
                  >
                    <Mail className="w-4 h-4" /> <span>{editorEmail}</span>
                  </a>
                ) : null}

                <div className="flex items-center justify-center gap-4 mt-2">
                  {youtube ? (
                    <a
                      href={youtube}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Youtube className="w-6 h-6" />
                    </a>
                  ) : null}
                  {instagram ? (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="text-pink-500 hover:text-pink-600"
                    >
                      <Instagram className="w-6 h-6" />
                    </a>
                  ) : null}
                  {facebook ? (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Facebook className="w-6 h-6" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Subscribe section removed per request */}
          </aside>
        </div>
      </div>
    </div>
  );
}
