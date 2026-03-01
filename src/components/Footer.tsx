
import React from "react";
import { ChevronUp, Github, Linkedin, Instagram, FileDown } from "lucide-react";
import { Profile } from "@/types/profile";
import { externalUrl } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

interface FooterProps {
  profile: Profile;
}

const Footer: React.FC<FooterProps> = ({ profile }) => {
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
            <h3 className="text-xl font-medium mb-2">{profile.name}</h3>
            <p className="text-muted-foreground">{profile.headline}</p>
          </div>

          {(profile.links.linkedIn || profile.links.github || profile.links.instagram || (profile.links.cv && profile.links.cvVisible !== false)) && (
            <div className="flex space-x-6 mb-8">
              {profile.links.linkedIn && (
                <a
                  href={externalUrl(profile.links.linkedIn!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                >
                  <Linkedin className="mr-1 h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {profile.links.github && (
                <a
                  href={externalUrl(profile.links.github!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                >
                  <Github className="mr-1 h-4 w-4" />
                  GitHub
                </a>
              )}
              {profile.links.instagram && (
                <a
                  href={externalUrl(profile.links.instagram!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                >
                  <Instagram className="mr-1 h-4 w-4" />
                  Instagram
                </a>
              )}
              {profile.links.cv && profile.links.cvVisible !== false && (
                <a
                  href={apiUrl(`/profile/${profile.id}/cv/download`)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                >
                  <FileDown className="mr-1 h-4 w-4" />
                  CV
                </a>
              )}
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
            {profile.about.skills.length > 0 && (
              <p className="mt-1">{profile.about.skills.slice(0, 4).join(" | ")}</p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
