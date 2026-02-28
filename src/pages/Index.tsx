
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Portfolio from "@/components/Portfolio";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { Profile } from "@/types/profile";

const Index = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;
    fetch(`/api/profile/${profileId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [profileId]);

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
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-2">Failed to load profile</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profileName={profile.name} profileId={profileId} />
      <main className="flex-grow">
        <Hero profile={profile} />
        <About profile={profile} />
        <Portfolio profile={profile} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
