
import React, { useEffect, useRef } from "react";
import {
  Database, Code, Activity, LineChart, BookOpen, Award, MessageCircle,
  Cpu, Globe, Heart, Layers, Lock, Mail, Monitor, Palette, PenTool,
  Rocket, Search, Server, Settings, Shield, Star, Terminal, TrendingUp,
  Users, Zap, Brain, Camera, Cloud, Compass, FileText, Lightbulb,
} from "lucide-react";
import { Profile } from "@/types/profile";

const iconMap: Record<string, React.ElementType> = {
  Database, Code, Activity, LineChart, BookOpen, Award, MessageCircle,
  Cpu, Globe, Heart, Layers, Lock, Mail, Monitor, Palette, PenTool,
  Rocket, Search, Server, Settings, Shield, Star, Terminal, TrendingUp,
  Users, Zap, Brain, Camera, Cloud, Compass, FileText, Lightbulb,
};

const colorMap: Record<string, string> = {
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  amber: "text-amber-500",
  red: "text-red-500",
  pink: "text-pink-500",
  indigo: "text-indigo-500",
  teal: "text-teal-500",
  cyan: "text-cyan-500",
  orange: "text-orange-500",
  emerald: "text-emerald-500",
  rose: "text-rose-500",
};

interface AboutProps {
  profile: Profile;
}

const About: React.FC<AboutProps> = ({ profile }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { about } = profile;

  const hasBioOrSkills = about.bio.length > 0 || about.skills.length > 0;
  const hasExpertise = about.expertise.length > 0;
  const hasEducation = about.education.length > 0;
  const hasCertifications = about.certifications.length > 0;
  const hasAnyContent = hasBioOrSkills || hasExpertise || hasEducation || hasCertifications;

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

  if (!hasAnyContent) return null;

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-20 md:py-28 bg-white dark:bg-gray-950"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {(hasBioOrSkills || hasExpertise) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {hasBioOrSkills && (
                <div>
                  <div className="animate-on-scroll opacity-0 transition-opacity duration-700">
                    <span className="badge bg-secondary text-secondary-foreground mb-6">
                      About Me
                    </span>
                    {about.bio.map((paragraph, i) => (
                      <p key={i} className="text-muted-foreground text-lg mb-6">
                        {paragraph}
                      </p>
                    ))}

                    {about.skills.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-8">
                        {about.skills.map((skill) => (
                          <span key={skill} className="badge border-primary/20 bg-primary/5 text-primary shimmer">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasExpertise && (
                <div className="grid grid-cols-2 gap-4">
                  {/* First column of expertise cards */}
                  <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-300 space-y-4">
                    {about.expertise.filter((_, i) => i % 2 === 0).map((exp, i) => {
                      const IconComp = iconMap[exp.icon] || Database;
                      return (
                        <div key={exp.title} className="glass-card p-6 hover-lift gradient-border card-3d group relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg pointer-events-none" />
                          <IconComp
                            className={`relative h-10 w-10 ${colorMap[exp.color] || "text-blue-500"} mb-4 icon-float`}
                            style={i > 0 ? { animationDelay: `${i * 0.5}s` } : undefined}
                          />
                          <h3 className="relative text-xl font-medium mb-2 group-hover:text-white transition-colors duration-300">{exp.title}</h3>
                          <p className="relative text-muted-foreground group-hover:text-white/90 transition-colors duration-300">{exp.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Second column of expertise cards */}
                  <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-500 space-y-4 mt-6">
                    {about.expertise.filter((_, i) => i % 2 === 1).map((exp, i) => {
                      const IconComp = iconMap[exp.icon] || Database;
                      return (
                        <div key={exp.title} className="glass-card p-6 hover-lift gradient-border card-3d group relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg pointer-events-none" />
                          <IconComp
                            className={`relative h-10 w-10 ${colorMap[exp.color] || "text-blue-500"} mb-4 icon-float`}
                            style={{ animationDelay: `${(i + 1) * 0.5 + 0.5}s` }}
                          />
                          <h3 className="relative text-xl font-medium mb-2 group-hover:text-white transition-colors duration-300">{exp.title}</h3>
                          <p className="relative text-muted-foreground group-hover:text-white/90 transition-colors duration-300">{exp.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {(hasEducation || hasCertifications) && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10">
              {hasEducation && (
                <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-200">
                  <div className="glass-card p-8 hover-lift h-full gradient-border glow-effect group relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg pointer-events-none" />
                    <BookOpen className="relative h-10 w-10 text-blue-500 mb-6 icon-float" />
                    <h3 className="relative text-2xl font-medium mb-4 group-hover:text-white transition-colors duration-300">Education</h3>
                    <ul className="relative space-y-4">
                      {about.education.map((edu) => (
                        <li key={edu.degree}>
                          <div className="font-medium group-hover:text-white transition-colors duration-300">{edu.degree}</div>
                          <div className="text-muted-foreground group-hover:text-white/80 transition-colors duration-300">{edu.institution} | {edu.period}</div>
                          {edu.focus && (
                            <div className="text-sm text-muted-foreground group-hover:text-white/70 transition-colors duration-300 mt-1">Focus: {edu.focus}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {hasCertifications && (
                <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-400">
                  <div className="glass-card p-8 hover-lift h-full gradient-border glow-effect group relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg pointer-events-none" />
                    <Award className="relative h-10 w-10 text-amber-500 mb-6 icon-float" style={{ animationDelay: '0.5s' }} />
                    <h3 className="relative text-2xl font-medium mb-4 group-hover:text-white transition-colors duration-300">Achievements & Certifications</h3>
                    <ul className="relative space-y-4">
                      {about.certifications.map((cert) => (
                        <li key={cert.title}>
                          <div className="font-medium group-hover:text-white transition-colors duration-300">{cert.title}</div>
                          <div className="text-muted-foreground group-hover:text-white/80 transition-colors duration-300">{cert.description}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default About;
