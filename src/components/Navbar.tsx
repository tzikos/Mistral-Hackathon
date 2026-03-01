
import React, { useState, useEffect } from "react";
import { Menu, X, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import GlobalMenu from "@/components/GlobalMenu";
import { Profile } from "@/types/profile";

interface NavbarProps {
  profileName: string;
  profileId?: string;
  profile?: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ profileName, profileId, profile }) => {
  const { isAuthenticated, profileId: authProfileId } = useAuth();
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
        <Logo size="sm" />

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
              className="hover:opacity-75 transition-opacity"
            >
              <span className="text-base font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  FindMe
                </span>
                <span className="text-muted-foreground/60">.</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  stral
                </span>
              </span>
            </button>
          )}
          {isAuthenticated && authProfileId && profileId !== authProfileId && (
            <button
              onClick={() => navigate(`/${authProfileId}`)}
              className="nav-link-animated inline-flex items-center gap-1.5"
            >
              <UserCircle size={16} />
              My Profile
            </button>
          )}
          <GlobalMenu
            showEditProfile={isAuthenticated && !!profileId && authProfileId === profileId}
            editProfilePath={profileId ? `/${profileId}/edit` : undefined}
          />
        </nav>

        {/* Mobile right: GlobalMenu + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <GlobalMenu
            showEditProfile={isAuthenticated && !!profileId && authProfileId === profileId}
            editProfilePath={profileId ? `/${profileId}/edit` : undefined}
          />
          <button
            className="focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
              className="py-2 text-left border-t border-gray-100 dark:border-gray-800"
              onClick={() => {
                navigate("/search");
                setMobileMenuOpen(false);
              }}
            >
              <span className="text-lg font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  FindMe
                </span>
                <span className="text-muted-foreground/60">.</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  stral
                </span>
              </span>
            </button>
          )}
          {isAuthenticated && authProfileId && profileId !== authProfileId && (
            <button
              className="py-2 text-left inline-flex items-center gap-2 border-t border-gray-100 dark:border-gray-800"
              onClick={() => {
                navigate(`/${authProfileId}`);
                setMobileMenuOpen(false);
              }}
            >
              <UserCircle size={18} />
              My Profile
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
