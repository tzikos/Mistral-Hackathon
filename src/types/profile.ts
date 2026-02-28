export interface Expertise {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  focus: string | null;
}

export interface Certification {
  title: string;
  description: string;
}

export interface AboutSection {
  bio: string[];
  skills: string[];
  expertise: Expertise[];
  education: Education[];
  certifications: Certification[];
}

export interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  detailedDescription?: string;
  tags: string[];
  image: string;
  link?: string;
}

export interface PortfolioSection {
  projects: PortfolioItem[];
  workExperience: PortfolioItem[];
  talksAndAwards: PortfolioItem[];
}

export interface Links {
  cv?: string;
  linkedIn?: string;
  instagram?: string;
  github?: string;
  projectsLinkedIn?: string;
}

export interface Profile {
  id: string;
  name: string;
  headline: string;
  badge: string;
  description: string;
  avatar?: string;
  about: AboutSection;
  portfolio: PortfolioSection;
  links: Links;
}
