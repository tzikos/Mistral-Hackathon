
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
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
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: "smooth",
      });
      setMobileMenuOpen(false);
    }
  };

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
        <a
          href="#"
          className="text-lg font-medium tracking-tight hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Dimitris Papantzikos
        </a>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#about"
            className="nav-link-animated"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("about");
            }}
          >
            About
          </a>
          <a
            href="#data"
            className="nav-link-animated"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("data");
            }}
          >
            Projects
          </a>
          <a
            href="#experience"
            className="nav-link-animated"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("experience");
            }}
          >
            Experience
          </a>
          <a
            href="#gallery"
            className="nav-link-animated"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("gallery");
            }}
          >
            Gallery
          </a>
          <a
            href="#contact"
            className="nav-link-animated"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contact");
            }}
          >
            Contact
          </a>
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
          <a
            href="#about"
            className="py-2 border-b border-gray-100 dark:border-gray-800"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("about");
            }}
          >
            About
          </a>
          <a
            href="#data"
            className="py-2 border-b border-gray-100 dark:border-gray-800"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("data");
            }}
          >
            Projects
          </a>
          <a
            href="#experience"
            className="py-2 border-b border-gray-100 dark:border-gray-800"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("experience");
            }}
          >
            Experience
          </a>
          <a
            href="#gallery"
            className="py-2 border-b border-gray-100 dark:border-gray-800"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("gallery");
            }}
          >
            Gallery
          </a>
          <a
            href="#contact"
            className="py-2"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contact");
            }}
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
