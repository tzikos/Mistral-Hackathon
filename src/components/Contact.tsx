import React, { useEffect, useRef } from "react";
import { MapPin, Linkedin, Github, Instagram } from "lucide-react";
import { Profile } from "@/types/profile";

interface ContactProps {
  profile: Profile;
}

const Contact: React.FC<ContactProps> = ({ profile }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const hasAnySocialLink = profile.links.linkedIn || profile.links.github || profile.links.instagram;

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
            <div className="glass-card p-8 flex flex-col gradient-border glow-effect">
              <h3 className="text-2xl font-medium mb-6">Contact Information</h3>

              <div className="space-y-6 flex-grow">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium mb-1">Name</h4>
                    <p className="text-muted-foreground">
                      {profile.name}
                    </p>
                  </div>
                </div>

                {profile.links.linkedIn && (
                  <div className="flex items-start">
                    <Linkedin className="h-5 w-5 mr-3 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">LinkedIn</h4>
                      <a
                        href={profile.links.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}

                {profile.links.github && (
                  <div className="flex items-start">
                    <Github className="h-5 w-5 mr-3 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">GitHub</h4>
                      <a
                        href={profile.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {hasAnySocialLink && (
                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-medium mb-4">Connect with me</h4>
                  <div className="flex space-x-4">
                    {profile.links.linkedIn && (
                      <a
                        href={profile.links.linkedIn}
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
                        href={profile.links.instagram}
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
                        href={profile.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                        aria-label="GitHub"
                      >
                        <Github size={20} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
