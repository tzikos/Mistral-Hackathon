
import React from "react";
import { ChevronUp, Github, Linkedin, Mail, MapPin, Instagram } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="py-12 bg-white dark:bg-gray-950 border-t border-border relative">
      {/* Gradient divider at top */}
      <div className="absolute top-0 left-0 right-0 gradient-divider" />
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          <button
            onClick={scrollToTop}
            className="mb-8 p-2 rounded-full bg-secondary scroll-top-animated"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6" />
          </button>

          <div className="text-center mb-8">
            <h3 className="text-xl font-medium mb-2">Dimitris Papantzikos</h3>
            <p className="text-muted-foreground">
              Data - ML/AI - MLOps - BI
            </p>
            <div className="flex items-center justify-center mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Copenhagen, Denmark</span>
            </div>
          </div>

          <div className="flex space-x-6 mb-8">
            <a
              href="mailto:papantzikos12@gmail.com"
              target="_blank" // This opens the link in a new tab
              rel="noopener noreferrer" // This is a security best practice
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              <Mail className="mr-1 h-4 w-4" />
              Email
            </a>
            <a
              href="https://github.com/tzikos"
              target="_blank" // This opens the link in a new tab
              rel="noopener noreferrer" // This is a security best practice
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              <Github className="mr-1 h-4 w-4" />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/dimitris-papantzikos/"
              target="_blank" // This opens the link in a new tab
              rel="noopener noreferrer" // This is a security best practice
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              <Linkedin className="mr-1 h-4 w-4" />
              LinkedIn
            </a>
            <a
              href="tel:+4591628719"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              +45 91 62 87 19
            </a>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Dimitris Papantzikos. All rights reserved.</p>
            <p className="mt-1">
              Mathematics | Data Science | Machine Learning
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
