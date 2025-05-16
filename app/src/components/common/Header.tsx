import { Cloudy, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router";
import type { NavbarLink } from "../../contants";
import { NAVBAR_LINKS } from "../../contants";
import supabase from "../../services/supabase";
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
        <div className="flex justify-between w-full items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">NimbusWave</span>
          </Link>

          <div className="flex flex-row items-center space-x-4">
            {isUserLoggedIn && (
              <div
                onClick={async () => {
                  await supabase.signOut();
                  window.location.href = "/";
                }}
                className="mr-4 px-2 py-2 text-sm font-medium text-white border hover:text-red-600 hover:border-red-600 hover:cursor-pointer rounded-lg"
              >
                <LogOut size={16} />
              </div>
            )}
            <div
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden rounded-lg hover:bg-gray-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </div>
          </div>
        </div>

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
              className="px-4 py-2 text-center text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/deploy"
              className="px-4 py-2 w-36 text-center text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span>Deploy New</span>
              <Cloudy
                size={16}
                className="inline-block ml-1"
                color="black"
                strokeWidth={2}
              />
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
            ) : location.pathname !== "/dashboard" ? (
              <Link
                to="/dashboard"
                className="text-sm hover:text-gray-300 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/deploy"
                className="max-w-36 px-4 py-2 gap-x-5 text-sm font-medium text-center bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span>Deploy New</span>
                <Cloudy
                  size={16}
                  className="inline-block ml-1"
                  color="black"
                  strokeWidth={2}
                />
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
