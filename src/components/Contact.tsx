import React, { useEffect, useRef, useState } from "react";
import { Mail, MapPin, Phone, Send, Linkedin, Github, Instagram } from "lucide-react";
import { toast } from 'sonner';

const Contact = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: wire up to backend API
      console.log('Contact form submitted:', formData);
      toast.success('Thank you for your message! I will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-20 md:py-28 bg-secondary/50"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="animate-on-scroll opacity-0 transition-opacity duration-700">
              <span className="badge bg-secondary text-secondary-foreground mb-4">
                Get in Touch
              </span>
              <h2 className="section-heading">Let's work together</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Whether you need help with data analysis, photography services, or just want to chat about potential collaborations, I'd love to hear from you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-300">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus-visible:outline-none input-gradient-focus"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus-visible:outline-none input-gradient-focus"
                      placeholder="Your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus-visible:outline-none input-gradient-focus"
                    placeholder="What's this about?"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus-visible:outline-none input-gradient-focus resize-none"
                    placeholder="Your message..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md flex items-center justify-center btn-glow transition-colors duration-300"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="animate-on-scroll opacity-0 transition-opacity duration-700 delay-500">
              <div className="glass-card p-8 h-full flex flex-col gradient-border glow-effect">
                <h3 className="text-2xl font-medium mb-6">Contact Information</h3>

                <div className="space-y-6 flex-grow">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Location</h4>
                      <p className="text-muted-foreground">
                        Copenhagen, Denmark
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Email</h4>
                      <a
                        href="mailto:papantzikos12@gmail.com"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        papantzikos12@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Phone</h4>
                      <a
                        href="tel:+4591628719"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        +45 91 62 87 19
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-medium mb-4">Connect with me</h4>
                  <div className="flex space-x-4">
                    <a
                      href="https://www.linkedin.com/in/dimitris-papantzikos/"
                      target="_blank" // This opens the link in a new tab
                      rel="noopener noreferrer" // This is a security best practice
                      className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={20} />
                    </a>
                    <a
                      href="https://www.instagram.com/dpadventures"
                      target="_blank" // This opens the link in a new tab
                      rel="noopener noreferrer" // This is a security best practice
                      className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                      aria-label="Instagram"
                    >
                      <Instagram size={20} />
                    </a>
                    <a
                      href="https://github.com/tzikos"
                      target="_blank" // This opens the link in a new tab
                      rel="noopener noreferrer" // This is a security best practice
                      className="h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 social-icon-glow transition-all duration-300"
                      aria-label="GitHub"
                    >
                      <Github size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
