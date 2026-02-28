
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Portfolio from "@/components/Portfolio";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    // Handle image loading effect
    const images = document.querySelectorAll('.image-fade-in');
    images.forEach((image) => {
      if ((image as HTMLImageElement).complete) {
        image.classList.add('loaded');
      } else {
        image.addEventListener('load', () => {
          image.classList.add('loaded');
        });
      }
    });
    
    // Initialize scroll animations
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll:not(.opacity-100)');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        if (isVisible) {
          el.classList.add('opacity-100');
          el.classList.remove('opacity-0');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <About />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
