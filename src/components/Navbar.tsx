
import React, { useState, useEffect } from "react";
import { Menu, X, LogOut, Pencil, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { Profile } from "@/types/profile";

interface NavbarProps {
  profileName: string;
  profileId?: string;
  profile?: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ profileName, profileId, profile }) => {
  const { isAuthenticated, profileId: authProfileId, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({ top: section.offsetTop - 80, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const hasAbout = !profile || (
    profile.about.bio.length > 0 ||
    profile.about.skills.length > 0 ||
    profile.about.expertise.length > 0 ||
    profile.about.education.length > 0 ||
    profile.about.certifications.length > 0
  );
  const hasProjects = !profile || profile.portfolio.projects.length > 0;
  const hasExperience = !profile || profile.portfolio.workExperience.length > 0;

  const navLinks = [
    ...(hasAbout ? [{ label: "About", action: () => scrollToSection("about") }] : []),
    ...(hasProjects ? [{ label: "Projects", action: () => scrollToSection("data") }] : []),
    ...(hasExperience ? [{ label: "Experience", action: () => scrollToSection("experience") }] : []),
    { label: "Contact", action: () => scrollToSection("contact") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/search")}
          className="hover:opacity-80 transition-opacity"
          aria-label="Go to search"
        >
          <Logo size="sm" />
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className="nav-link-animated"
              onClick={(e) => {
                e.preventDefault();
                link.action();
              }}
            >
              {link.label}
            </a>
          ))}
          {isAuthenticated && (
            <button
              onClick={() => navigate("/search")}
              className="nav-link-animated inline-flex items-center gap-1.5"
            >
              <Search size={16} />
              Search
            </button>
          )}
          {isAuthenticated && profileId && authProfileId === profileId && (
            <button
              onClick={() => navigate(`/${profileId}/edit`)}
              className="nav-link-animated inline-flex items-center gap-1.5"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="nav-link-animated inline-flex items-center gap-1.5"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 bg-white dark:bg-gray-900 z-40 flex flex-col pt-24 px-6 md:hidden transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col space-y-8 text-lg">
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href="#"
              className={cn(
                "py-2",
                i < navLinks.length - 1 && "border-b border-gray-100 dark:border-gray-800"
              )}
              onClick={(e) => {
                e.preventDefault();
                link.action();
              }}
            >
              {link.label}
            </a>
          ))}
          {isAuthenticated && (
            <button
              className="py-2 text-left inline-flex items-center gap-2 border-t border-gray-100 dark:border-gray-800"
              onClick={() => {
                navigate("/search");
                setMobileMenuOpen(false);
              }}
            >
              <Search size={18} />
              Search
            </button>
          )}
          {isAuthenticated && profileId && authProfileId === profileId && (
            <button
              className="py-2 text-left inline-flex items-center gap-2 border-t border-gray-100 dark:border-gray-800"
              onClick={() => {
                navigate(`/${profileId}/edit`);
                setMobileMenuOpen(false);
              }}
            >
              <Pencil size={18} />
              Edit Profile
            </button>
          )}
          {isAuthenticated && (
            <button
              className="py-2 text-left inline-flex items-center gap-2 border-t border-gray-100 dark:border-gray-800"
              onClick={() => {
                logout();
                navigate("/");
                setMobileMenuOpen(false);
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
