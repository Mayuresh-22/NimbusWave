import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router";
import type { NavbarLink } from "../../contants";
import { NAVBAR_LINKS } from "../../contants";
import type { RootState } from "../../store/store";

export function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [onOnboardPage, setOnOnboardPage] = useState<boolean>(false);
  const isUserLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated,
  );
  const [navbarLinks, setNavbarLinks] = useState<NavbarLink[]>([]);

  useEffect(() => {
    setOnOnboardPage(location.pathname === "/onboard");
    setNavbarLinks(NAVBAR_LINKS[location.pathname] || []);
  }, [location]);

  return (
    <header className="fixed top-0 w-full border-b text-white border-gray-900 bg-gray-900/30 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">NimbusWave</span>
        </Link>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-900"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="hidden md:flex items-center space-x-6">
          {navbarLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="text-sm hover:text-gray-300 transition-colors"
            >
              {link.title}
            </Link>
          ))}
          {!onOnboardPage && !isUserLoggedIn ? (
            <Link
              to="/onboard"
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
          ) : location.pathname !== "/dashboard" ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/deploy"
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Deploy New
            </Link>
          )}
        </nav>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-900 bg-black px-4 py-4">
          <nav className="flex flex-col space-y-4">
            {navbarLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="text-sm hover:text-gray-300 transition-colors"
              >
                {link.title}
              </Link>
            ))}
            {!onOnboardPage && !isUserLoggedIn ? (
              <Link
                to="/onboard"
                className="text-sm hover:text-gray-300 transition-colors"
              >
                Login
              </Link>
            ) : (
              location.pathname !== "/dashboard" && (
                <Link
                  to="/dashboard"
                  className="text-sm hover:text-gray-300 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
