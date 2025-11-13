import { Link } from "react-router-dom";
import logoSrc from "../assets/logo.jpg";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-100 border-t border-gray-800 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div className="flex-1 min-w-0">
          <Link to="/" className="inline-block mb-3 flex items-center">
            <img
              src={logoSrc}
              alt="MP Network10 logo"
              className="w-10 h-10 object-contain mr-3"
            />
            <span className="text-2xl font-bold text-white">
              MP Network 10 News
            </span>
          </Link>
          <p className="text-sm text-gray-300 max-w-md">
            Trusted local news covering stories that matter. Stay informed with
            accurate reporting from our community of reporters.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">News</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/news" className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/news?category=local" className="hover:text-white">
                  Local
                </Link>
              </li>
              <li>
                <Link to="/news?category=business" className="hover:text-white">
                  Business
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-100 mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              {/* Owner link removed as requested */}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-100 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/privacy" className="hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400">
          <div>
            © {new Date().getFullYear()} MP Network 10
            News — All rights
            reserved.
          </div>
          <div className="mt-2 sm:mt-0">Made with ❤️ by ThinkCraftAI</div>
        </div>
      </div>
    </footer>
  );
}
