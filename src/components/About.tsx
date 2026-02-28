
import React, { useEffect, useRef } from "react";
import { Database, Code, Activity, LineChart, BookOpen, Award } from "lucide-react";
import { MessageCircle } from "lucide-react"; // Adjust the import based on your icon library

const About = () => {
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

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-20 md:py-28 bg-white dark:bg-gray-950"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="animate-on-scroll opacity-0 transition-opacity duration-700">
                <span className="badge bg-secondary text-secondary-foreground mb-6">
                  About Me
                </span>
                <h2 className="section-heading">
                  Life Enthusiast
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  I'm a Data guy with a mathematical background, currently pursuing an M.Sc. in Mathematical Modelling and Computation at DTU in Copenhagen, Denmark, with a focus on Machine Learning and AI. My professional journey mostly combines data visualizations and effective storytelling to deliver actionable insights, but also ad-hoc solutions to engineering problems.
                </p>
                <p className="text-muted-foreground text-lg mb-8">
                  Usually you'll find me engaged in sports like calisthenics, weightlifting, running, kickboxing, judo or exploring the outdoors through hiking and camping. Photography is another passion that helps me capture and share the world from a different perspective and I invite you to take a look at my Instagram
                  <a
                    href="https://www.instagram.com/dpadventures"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <b> portfolio</b>
                  </a>.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">Python</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">SQL</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">Tableau</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">Machine Learning</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">Google Cloud</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">Docker</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">R</span>
                  <span className="badge border-primary/20 bg-primary/5 text-primary shimmer">Git/GitHub</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-300 space-y-4">
                <div className="glass-card p-6 hover-lift gradient-border card-3d">
                  <Database className="h-10 w-10 text-blue-500 mb-4 icon-float" />
                  <h3 className="text-xl font-medium mb-2">Data Engineering</h3>
                  <p className="text-muted-foreground">
                    Building automated pipelines and preprocessing workflows for complex datasets.
                  </p>
                </div>

                <div className="glass-card p-6 hover-lift gradient-border card-3d">
                  <LineChart className="h-10 w-10 text-green-500 mb-4 icon-float" style={{ animationDelay: '0.5s' }} />
                  <h3 className="text-xl font-medium mb-2">Data Visualization</h3>
                  <p className="text-muted-foreground">
                    Creating insightful reports and interactive dashboards with Tableau.
                  </p>
                </div>
              </div>

              <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-500 space-y-4 mt-6">
                <div className="glass-card p-6 hover-lift gradient-border card-3d">
                  <Code className="h-10 w-10 text-purple-500 mb-4 icon-float" style={{ animationDelay: '1s' }} />
                  <h3 className="text-xl font-medium mb-2">Machine Learning</h3>
                  <p className="text-muted-foreground">
                    Developing predictive models and algorithms for business insights.
                  </p>
                </div>

                <div className="glass-card p-6 hover-lift gradient-border card-3d">
                  <MessageCircle className="h-10 w-10 text-amber-500 mb-4 icon-float" style={{ animationDelay: '1.5s' }} />
                  <h3 className="text-xl font-medium mb-2">Communication</h3>
                  <p className="text-muted-foreground">
                    Specializing in effective communication to convey complex data insights to non-tech-savvy stakeholders, ensuring clarity and understanding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-200">
              <div className="glass-card p-8 hover-lift h-full gradient-border glow-effect">
                <BookOpen className="h-10 w-10 text-blue-500 mb-6 icon-float" />
                <h3 className="text-2xl font-medium mb-4">Education</h3>
                <ul className="space-y-4">
                  <li>
                    <div className="font-medium">M.Sc. Mathematical Modelling and Computation</div>
                    <div className="text-muted-foreground">DTU (Copenhagen) | 2024-2026</div>
                  </li>
                  <li>
                    <div className="font-medium">B.Sc. Mathematics</div>
                    <div className="text-muted-foreground">Aristotle University of Thessaloniki | 2016-2021</div>
                    <div className="text-sm text-muted-foreground mt-1">Focus: Data Analysis</div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-400">
              <div className="glass-card p-8 hover-lift h-full gradient-border glow-effect">
                <Award className="h-10 w-10 text-amber-500 mb-6 icon-float" style={{ animationDelay: '0.5s' }} />
                <h3 className="text-2xl font-medium mb-4">Achievements & Certifications</h3>
                <ul className="space-y-4">
                  <li>
                    <div className="font-medium">Tableau Certified Data Analyst</div>
                    <div className="text-muted-foreground">Professional certification</div>
                  </li>
                  <li>
                    <div className="font-medium">Top 4% in Data Art & Storytelling</div>
                    <div className="text-muted-foreground">Data2Speak Competition | 05/2024</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
