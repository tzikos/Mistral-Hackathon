import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart, Code, ExternalLink } from "lucide-react";
import { externalUrl } from "@/lib/utils";
import ProjectDetailDialog from "./ProjectDetailDialog";
import { Presentation } from "lucide-react";
import { Profile, PortfolioItem } from "@/types/profile";

interface ProjectCardProps {
  project: PortfolioItem;
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hasDetails = !!project.detailedDescription;

  return (
    <>
      <div
        className={`glass-card overflow-hidden group hover-lift glow-effect ${hasDetails ? 'cursor-pointer' : ''} ${className}`}
        onClick={() => hasDetails && setShowDetails(true)}
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        onKeyDown={(e) => hasDetails && e.key === 'Enter' && setShowDetails(true)}
      >
        {project.image && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={project.image}
              alt={project.title}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 image-fade-in ${imageLoaded ? 'loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        )}
        <div className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 pointer-events-none" />
          <h3 className="relative text-xl font-medium mb-2 group-hover:text-white transition-colors duration-300">{project.title}</h3>
          <p className="relative text-muted-foreground mb-4 group-hover:text-white/90 transition-colors duration-300">{project.description}</p>
          <div className="relative flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag, i) => (
              <span key={i} className="badge text-xs bg-secondary text-secondary-foreground shimmer">
                {tag}
              </span>
            ))}
          </div>
          <div className="relative flex items-center gap-3">
            {hasDetails && (
              <span className="inline-flex items-center text-sm font-medium text-primary group-hover:text-white transition-colors duration-300">
                View Details <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
            {project.link && (
              <a
                href={externalUrl(project.link)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-sm font-medium text-primary group-hover:text-white transition-colors duration-300 hover:underline"
              >
                Visit <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {hasDetails && (
        <ProjectDetailDialog
          project={project}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}
    </>
  );
};

interface PortfolioProps {
  profile: Profile;
}

const Portfolio: React.FC<PortfolioProps> = ({ profile }) => {
  const dataSectionRef = useRef<HTMLDivElement>(null);
  const workSectionRef = useRef<HTMLDivElement>(null);
  const { portfolio, links } = profile;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll(".animate-on-scroll");
            elements.forEach((el, i) => {
              setTimeout(() => {
                el.classList.add("opacity-100");
                el.classList.remove("opacity-0");
              }, i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (dataSectionRef.current) observer.observe(dataSectionRef.current);
    if (workSectionRef.current) observer.observe(workSectionRef.current);

    return () => {
      if (dataSectionRef.current) observer.unobserve(dataSectionRef.current);
      if (workSectionRef.current) observer.unobserve(workSectionRef.current);
    };
  }, []);

  const hasProjects = portfolio.projects.length > 0;
  const hasWorkExperience = portfolio.workExperience.length > 0;
  const hasTalks = portfolio.talksAndAwards.length > 0;

  return (
    <>
      {hasProjects && <section
        id="data"
        ref={dataSectionRef}
        className="py-20 md:py-28 bg-secondary/50"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div className="max-w-2xl">
                <span className="badge bg-secondary text-secondary-foreground mb-4">
                  Projects
                </span>
                <h2 className="section-heading flex items-center">
                  <BarChart className="mr-2 h-8 w-8" /> Projects
                </h2>
              </div>
              {links.projectsLinkedIn && (
                <a
                  href={externalUrl(links.projectsLinkedIn!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
                >
                  View All Projects <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.projects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-on-scroll opacity-0 transition-opacity duration-700"
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>

            {links.projectsLinkedIn && (
              <div className="mt-10 flex justify-center md:hidden">
                <a
                  href={externalUrl(links.projectsLinkedIn!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
                >
                  View All Projects <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>}

      {hasWorkExperience && <section
        id="experience"
        ref={workSectionRef}
        className="py-20 md:py-28 bg-white dark:bg-gray-950"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div className="max-w-2xl">
                <span className="badge bg-secondary text-secondary-foreground mb-4">
                  Experience
                </span>
                <h2 className="section-heading flex items-center">
                  <Code className="mr-2 h-8 w-8" /> Work Experience
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.workExperience.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-on-scroll opacity-0 transition-opacity duration-700"
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>}

      {hasTalks && <section
        id="talks"
        className="py-20 md:py-28 bg-white dark:bg-gray-950"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div className="max-w-2xl">
                <span className="badge bg-secondary text-secondary-foreground mb-4">
                  Talks & Awards
                </span>
                <h2 className="section-heading flex items-center">
                  <Presentation className="mr-2 h-8 w-8" /> Talks & Awards
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.talksAndAwards.map((talk, index) => (
                <div
                  key={talk.id}
                  className="animate-on-scroll opacity-0 transition-opacity duration-700"
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <ProjectCard project={talk} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}

    </>
  );
};

export default Portfolio;
