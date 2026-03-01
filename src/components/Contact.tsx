import React, { useEffect, useRef } from "react";
import { MapPin, Linkedin, Github, Instagram, FileDown, Search } from "lucide-react";
import { Profile } from "@/types/profile";
import { useNavigate } from "react-router-dom";
import { externalUrl } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

interface ContactProps {
  profile: Profile;
}

const Contact: React.FC<ContactProps> = ({ profile }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100");
            entry.target.classList.remove("opacity-0");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));

    return () => {
      elements?.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const cvVisible = profile.links.cv && profile.links.cvVisible !== false;
  const hasAnySocialLink = profile.links.linkedIn || profile.links.github || profile.links.instagram || cvVisible;

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-20 md:py-28 bg-secondary/50"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="animate-on-scroll opacity-0 transition-opacity duration-700">
              <span className="badge bg-secondary text-secondary-foreground mb-4">
                Get in Touch
              </span>
              <h2 className="section-heading">Let's work together</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Whether you want to discuss potential collaborations or just connect, I'd love to hear from you.
              </p>
            </div>
          </div>

          <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-300">
            <div className="glass-card p-8 flex flex-col gradient-border glow-effect group relative overflow-hidden">
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg pointer-events-none" />
              <h3 className="relative text-2xl font-medium mb-6 group-hover:text-white transition-colors duration-300">Contact Information</h3>

              <div className="relative space-y-6 flex-grow">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1 group-hover:text-white transition-colors duration-300">Name</h4>
                    <p className="text-muted-foreground group-hover:text-white/80 transition-colors duration-300">
                      {profile.name}
                    </p>
                  </div>
                </div>

                {profile.links.linkedIn && (
                  <div className="flex items-start">
                    <Linkedin className="h-5 w-5 mr-3 text-primary mt-1 shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1 group-hover:text-white transition-colors duration-300">LinkedIn</h4>
                      <a
                        href={externalUrl(profile.links.linkedIn!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground group-hover:text-white/80 hover:underline transition-colors duration-300"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}

                {profile.links.github && (
                  <div className="flex items-start">
                    <Github className="h-5 w-5 mr-3 text-primary mt-1 shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1 group-hover:text-white transition-colors duration-300">GitHub</h4>
                      <a
                        href={externalUrl(profile.links.github!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground group-hover:text-white/80 hover:underline transition-colors duration-300"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}

                {cvVisible && (
                  <div className="flex items-start">
                    <FileDown className="h-5 w-5 mr-3 text-primary mt-1 shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1 group-hover:text-white transition-colors duration-300">CV / Resume</h4>
                      <a
                        href={apiUrl(`/profile/${profile.id}/cv/download`)}
                        className="text-muted-foreground group-hover:text-white/80 hover:underline transition-colors duration-300"
                      >
                        Download CV
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {hasAnySocialLink && (
                <div className="relative mt-8 pt-8 border-t border-white/10">
                  <h4 className="font-medium mb-4 group-hover:text-white transition-colors duration-300">Connect with me</h4>
                  <div className="flex space-x-4">
                    {profile.links.linkedIn && (
                      <a
                        href={externalUrl(profile.links.linkedIn!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={20} />
                      </a>
                    )}
                    {profile.links.instagram && (
                      <a
                        href={externalUrl(profile.links.instagram!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                        aria-label="Instagram"
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                    {profile.links.github && (
                      <a
                        href={externalUrl(profile.links.github!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                        aria-label="GitHub"
                      >
                        <Github size={20} />
                      </a>
                    )}
                    {cvVisible && (
                      <a
                        href={apiUrl(`/profile/${profile.id}/cv/download`)}
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                        aria-label="Download CV"
                      >
                        <FileDown size={20} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => navigate("/search")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-primary/20 hover:bg-secondary transition-all duration-300 text-sm font-medium"
                >
                  <Search size={16} />
                  Search Other Professionals
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
