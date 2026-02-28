
import React, { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { ChatbotContainer } from "./chatbot";

const Hero = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial scroll offset on page load
    const initialScroll = () => {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        if (window.scrollY === 0) { // Only scroll if we're at the very top
          window.scrollTo({
            top: 75,
            behavior: "smooth",
          });
        }
      }, 100);
    };

    // Run initial scroll
    initialScroll();

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

  const scrollToAbout = () => {
    console.log('Arrow clicked - attempting to scroll to about section');
    const aboutSection = document.getElementById("about");
    console.log('About section found:', aboutSection);

    if (aboutSection) {
      console.log('Scrolling to about section at offset:', aboutSection.offsetTop - 80);
      window.scrollTo({
        top: aboutSection.offsetTop - 80,
        behavior: "smooth",
      });
    } else {
      // Fallback: scroll down by viewport height
      console.log('About section not found, scrolling by viewport height');
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center relative overflow-hidden"
      style={{ paddingTop: '60px', minHeight: '110vh' }}
    >
      {/* Animated Floating Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="floating-orb floating-orb-1"
          style={{ top: '-15%', left: '-10%' }}
        />
        <div
          className="floating-orb floating-orb-2"
          style={{ top: '50%', right: '-15%' }}
        />
        <div
          className="floating-orb floating-orb-3"
          style={{ top: '10%', right: '10%' }}
        />
        <div
          className="floating-orb"
          style={{
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            top: '75%',
            left: '5%',
            animation: 'float-orb-2 22s ease-in-out infinite reverse',
            filter: 'blur(60px)',
            opacity: 0.4
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-10 md:py-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-on-scroll opacity-0 transition-opacity duration-1000 delay-300">
            <span className="badge bg-secondary text-secondary-foreground mb-4 animate-slide-down shimmer">
              Data - ML/AI - MLOps - BI
            </span>
          </div>

          <h1 className="animate-on-scroll opacity-0 transition-opacity duration-1000 text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6">
            <span className="block mb-2 gradient-text">Dimitris Papantzikos</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-muted-foreground">
              Translating data into actionable insights
            </span>
          </h1>

          <p className="animate-on-scroll opacity-0 transition-opacity duration-1000 delay-500 text-lg md:text-xl text-muted-foreground mt-6 mb-10 max-w-2xl mx-auto">
            I specialize in Data Science, combining latest technologies with an analytical mindset to transform complex datasets into meaningful business solutions.
          </p>

          {/* CV Chatbot Component */}
          <div className="animate-on-scroll opacity-0 transition-opacity duration-1000 delay-600 max-w-2xl mx-auto mb-8">
            <ChatbotContainer className="w-full gradient-border" maxHeight="400px" />
          </div>

          <div className="animate-on-scroll opacity-0 transition-opacity duration-1000 delay-700 flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <button
              onClick={() => scrollToAbout()}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-md btn-glow transition-colors duration-300"
            >
              Explore My Work
            </button>
            <a
              href="#contact"
              className="px-8 py-3 border border-primary/20 rounded-md hover:bg-secondary transition-all duration-300 glow-effect"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>

      {/* Gradient fade transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />

      <div className="absolute left-0 right-0 bottom-0 pb-4 flex justify-center z-10">
        <button
          onClick={scrollToAbout}
          className="rounded-full bg-secondary p-2 hover:bg-secondary/80 transition-all duration-300 cursor-pointer scroll-top-animated"
          aria-label="Scroll down"
          style={{ animation: 'scroll-indicator 2s ease-in-out infinite' }}
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
};

export default Hero;

