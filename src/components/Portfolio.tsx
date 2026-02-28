import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart, Code, ExternalLink } from "lucide-react";
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

  return (
    <>
      <div
        className={`glass-card overflow-hidden group hover-lift glow-effect cursor-pointer ${className}`}
        onClick={() => setShowDetails(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowDetails(true)}
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
        <div className="p-6">
          <h3 className="text-xl font-medium mb-2">{project.title}</h3>
          <p className="text-muted-foreground mb-4">{project.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag, i) => (
              <span key={i} className="badge text-xs bg-secondary text-secondary-foreground shimmer">
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
            View Details <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      <ProjectDetailDialog
        project={project}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
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

  return (
    <>
      <section
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
                  <BarChart className="mr-2 h-8 w-8" /> Data Science Portfolio
                </h2>
                <p className="text-muted-foreground text-lg">
                  A selection of my data science and machine learning projects, showcasing my technical skills and analytical approaches.
                </p>
              </div>
              {links.projectsLinkedIn && (
                <a
                  href={links.projectsLinkedIn}
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
                  href={links.projectsLinkedIn}
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
      </section>

      <section
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
                  <Code className="mr-2 h-8 w-8" /> Professional Journey
                </h2>
                <p className="text-muted-foreground text-lg">
                  My work experience and contributions in data analysis, research, and community involvement.
                </p>
              </div>
              {links.cv && (
                <a
                  href={links.cv}
                  className="hidden md:inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
                  download
                >
                  Download CV <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              )}
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

            {links.cv && (
              <div className="mt-10 flex justify-center md:hidden">
                <a
                  href={links.cv}
                  className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
                  download
                >
                  Download CV <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
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
                <p className="text-muted-foreground text-lg">
                  Engaging with the community through talks and celebrating achievements.
                </p>
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
      </section>

    </>
  );
};

export default Portfolio;
