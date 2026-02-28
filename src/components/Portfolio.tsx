import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart, Code, ExternalLink } from "lucide-react";
import ProjectDetailDialog from "./ProjectDetailDialog";
import { Presentation } from "lucide-react";
import Gallery from "./Gallery"; // Import the new Gallery component

const dataProjects = [
  {
    id: 0,
    title: "EEG Abnormality Detection with Deep Learning",
    description: "Evaluated EEGMamba (state-space) and LaBraM (transformer) architectures for EEG abnormality detection on clinical and portable EEG data using PyTorch Lightning on GCP.",
    detailedDescription: "This project evaluates two state-of-the-art deep learning architectures—EEGMamba (a state-space model) and LaBraM (a transformer)—for EEG abnormality detection on both the clinical TUH EEG Abnormal dataset and BrainCapture's portable EEG recordings. Implemented a unified, scalable training pipeline using PyTorch Lightning deployed on Google Cloud Platform with NVIDIA T4 GPU, tracking experiments via Weights & Biases. Both models were fine-tuned with standardized preprocessing (band-pass/notch filtering, 200 Hz resampling, windowing, normalization). Results showed EEGMamba achieves ~76.5% recall on portable EEG, making it suitable for screening where minimizing false negatives is critical, while LaBraM trains 4x faster but drops to ~33% recall on portable data.",
    tags: ["Deep Learning", "PyTorch Lightning", "GCP", "EEG", "Healthcare", "W&B"],
    image: "/images/eeg-detection.png",
  },
  {
    id: 10,
    title: "VC Network Analysis & Investor Recommendation",
    description: "Analyzed venture capital investor-company networks and built a hybrid recommendation system combining NLP-based thematic matching with network-structural metrics.",
    detailedDescription: "This project analyzes a large venture capital investor–company network to show that funding ecosystems are highly sparse, modular, and dominated by influential hubs, with co-investment communities often cutting across traditional industry labels. Developed a hybrid recommendation system combining NLP-based thematic matching (TF-IDF on company descriptions) with network-structural metrics such as local betweenness, community cohesion, specialization, and leadership roles. The key insight is that effective investor targeting requires balancing thematic fit with strategic network position, enabling startups to identify investors who are not just active, but influential, specialized, and well-embedded in relevant communities.",
    tags: ["Network Analysis", "NLP", "TF-IDF", "Graph Theory", "Recommendation Systems"],
    image: "/images/vc-network.png",
  },
  {
    id: 1,
    title: "Plant Leaf Health Classification",
    description: "MLOps project with model training and deployment on Google Cloud (VertexAI, Cloud Run) using FastAPI, Streamlit, Docker, and GitHub Actions.",
    detailedDescription: "This project leverages deep learning techniques to identify plant diseases from leaf images. I built a complete MLOps pipeline with automated CI/CD using GitHub Actions, containerized the application with Docker, and deployed it on Google Cloud. The system includes a Streamlit frontend for easy interaction and a FastAPI backend for efficient inference.",
    tags: ["Python", "MLOps", "Google Cloud", "Docker", "CI/CD"],
    image: "/images/plants.png",
  },
  {
    id: 2,
    title: "Patient Mortality Classification",
    description: "Deep Learning project using EHRMamba model on Physionet2012 dataset, achieving 85% accuracy with PyTorch and HPC/GPU resources.",
    detailedDescription: "I implemented and fine-tuned an EHRMamba model to predict patient mortality from electronic health records. The project involved processing time-series medical data, implementing custom loss functions, and leveraging DTU's high-performance computing cluster to efficiently train deep neural networks with large datasets.",
    tags: ["Deep Learning", "PyTorch", "Healthcare", "HPC"],
    image: "/images/patient.png",
  },
  {
    id: 3,
    title: "Copenhagen Apartments Price Prediction",
    description: "Built a neural network model using PyTorch to predict rental prices with a Mean Absolute Error of 2000 DKK.",
    detailedDescription: "This regression project focused on predicting apartment rental prices in Copenhagen using features like location, size, and amenities. I engineered custom features, performed data cleaning and normalization, and developed a neural network architecture optimized for pricing predictions with strong real-world performance.",
    tags: ["Neural Networks", "PyTorch", "Regression", "Real Estate"],
    image: "/images/cph.png",
  },
  {
    id: 4,
    title: "Optimization for Data Science - Graphical LASSO Regression",
    description: "Academic project focused on implementing and experimenting with Graphical LASSO regression for data science optimization tasks.",
    detailedDescription: "This academic project involved implementing and experimenting with Graphical LASSO regression techniques for data science optimization. I used Python with NumPy, Pandas, Matplotlib, and CVXPY in a Conda environment to ensure reproducible experimentation and analysis. The project focused on understanding sparse inverse covariance estimation and its applications in high-dimensional data analysis.",
    tags: ["Python", "Optimization", "CVXPY", "Academic", "Statistics"],
    image: "/images/graphical-lasso.png",
  },
  {
    id: 5,
    title: "High-Performance Computing for Thermal Simulation",
    description: "HPC course project focused on optimizing heat diffusion simulations using parallel computing and GPU acceleration.",
    detailedDescription: "This HPC course project focused on optimizing heat diffusion simulations through advanced parallel computing techniques. I implemented multi-core CPU parallelization using multiprocessing, developed CUDA GPU kernels with Numba, and applied CuPy optimizations. The project utilized DTU's HPC cluster with job scheduling (LSF), performance profiling (Nsys, line_profiler), and comprehensive speedup analysis to achieve significant performance improvements.",
    tags: ["HPC", "CUDA", "Python", "Parallel Computing", "GPU"],
    image: "/images/hpc-thermal.png",
  },
  {
    id: 6,
    title: "LinkedIn Student Job Scraper & Discord Bot",
    description: "Automated web scraping system that monitors LinkedIn for new student jobs in Copenhagen with Discord bot integration.",
    detailedDescription: "I built an automated web scraping system that continuously monitors LinkedIn for new student job postings in Copenhagen. The system includes a Discord bot that posts real-time job alerts with interactive description buttons, making it easy for students to stay updated on opportunities. Built with Python, Discord.py, and BeautifulSoup, the system is designed for AWS Lambda deployment to ensure reliable, serverless operation.",
    tags: ["Web Scraping", "Discord Bot", "Python", "AWS Lambda", "Automation"],
    image: "/images/linkedin-scraper.png",
  },
  {
    id: 7,
    title: "Copenhagen Apartment Finder & Analytics Platform",
    description: "End-to-end web scraping and data analytics platform for Copenhagen rental market with automated insights.",
    detailedDescription: "I developed a comprehensive end-to-end web scraping and data analytics platform specifically for the Copenhagen rental market. The system features an automated data pipeline with a Streamlit dashboard for visualization, statistical analysis capabilities, and automated GitHub updates for continuous data integration. Built with Python, BeautifulSoup, Streamlit, Pandas, and multiprocessing for efficient data processing and real-time market insights.",
    tags: ["Web Scraping", "Streamlit", "Data Analytics", "Real Estate", "Automation"],
    image: "/images/apartment-finder.png",
  },
  {
    id: 8,
    title: "GradeAid - AI Learning Material Creator",
    description: "AI-assisted learning material creator designed specifically for neurodivergent learners with comprehensive database design.",
    detailedDescription: "GradeAid is an innovative AI-assisted platform designed to create personalized learning materials for neurodivergent learners. I was responsible for the complete database design, implementation of AI services using Langchain and OpenAI, building the frontend interface, and comprehensive testing. The system uses PostgreSQL for robust data management and Streamlit for rapid proof-of-concept development, ensuring accessibility and effectiveness for diverse learning needs.",
    tags: ["AI", "Education", "PostgreSQL", "Langchain", "OpenAI", "Accessibility"],
    image: "/images/gradeaid.png",
  },
];

const workExperience = [
  {
    id: 3,
    title: "Teaching Assistant - 02476 Machine Learning Operations",
    description: "Teaching assistant at DTU for the MLOps course, supporting students in understanding and applying course material through in-person and online assistance.",
    detailedDescription: "Grateful to be a teaching assistant in one of the best DTU courses, 02476 Machine Learning Operations by Nicki Skafte Detlefsen. My role was to support students in understanding and applying the course material, covering topics like Docker, CI/CD, cloud deployment, experiment tracking, and model optimization. I provided assistance through in-person sessions and online support.",
    tags: ["Copenhagen", "01/2026", "MLOps", "Teaching", "Docker", "CI/CD"],
    image: "/images/dtu.png",
    link: "https://skaftenicki.github.io/dtu_mlops/",
  },
  {
    id: 4,
    title: "Student Worker (AI/ML) in Modelling & Optimisation at Vattenfall",
    description: "Automating documentation processes using LLMs, creating internal chatbots for non-technical stakeholders, and approaching computationally heavy physics-related optimisation problems with supervised learning.",
    detailedDescription: "At Vattenfall, I focus on leveraging AI/ML technologies to solve complex energy sector challenges. My main responsibilities include automating the documentation process of various internal tools using Large Language Models, developing an internal chatbot to help non-technical stakeholders access documentation more efficiently, and applying supervised learning techniques to tackle computationally intensive physics-related optimization problems in the energy domain.",
    tags: ["Copenhagen", "08/2025-Present", "LLMs", "Azure AI", "Physics ML"],
    image: "/images/vattenfall.png",
  },
  {
    id: 5,
    title: "AI Software Developer at Schellinger Capital",
    description: "Developing an automated investor matching algorithm for startups using advanced machine learning techniques.",
    detailedDescription: "At Schellinger Capital, I'm developing sophisticated algorithms to automatically match startups with potential investors. This involves building machine learning models that analyze startup profiles, investor preferences, and market trends to create optimal matches. The system helps streamline the investment process by identifying the most promising connections between entrepreneurs and investors.",
    tags: ["Copenhagen", "07/2025-Present", "ML Algorithms", "Fintech", "Startups"],
    image: "/images/schellinger.png",
  },
  {
    id: 6,
    title: "Data & Research Analyst at Recognyte",
    description: "End-to-end reporting, automations with Python web scraping, NLP processing, and machine learning model development (AVM).",
    detailedDescription: "At Recognyte, I lead end-to-end data analytics projects from data collection to actionable insights. My work includes building automated valuation models (AVMs), creating ETL pipelines for financial data processing, and developing interactive dashboards for decision-makers. I've also implemented NLP solutions to extract insights from unstructured text data.",
    tags: ["Remote", "09/2023-Present", "SQL", "Python", "ML"],
    image: "/images/recognyte.png",
  },
  {
    id: 7,
    title: "Data Analyst at Data to Action",
    description: "Data gathering (SQL, web scraping), manipulation, visualization (Tableau), and forecasting (scikit-learn).",
    detailedDescription: "At Data to Action, I specialized in transforming raw data into business insights through advanced analytics and visualization. I created demand forecasting models for retail clients, built automated data reporting systems, and developed web scraping solutions for market intelligence gathering.",
    tags: ["Athens", "11/2022-08/2023", "BI", "Forecasting"],
    image: "images/action.jpg",
  },
];

const talks = [
  {
    id: 0,
    title: "🏆 1st Place - Valhacks Hackathon",
    description: "Won 1st place (4500 DKK) building a Spotify recommendation system evaluated on NDCG@5, performance (33x faster), and explainability.",
    detailedDescription: "Secured 1st place in the Valhacks hackathon at Skylab in November 2025, winning a prize of 4500 DKK. The challenge was to implement a recommendation system for Spotify songs, evaluated on three metrics: NDCG@5 score (we achieved 0.3401), Performance (33x faster with caching, 3x without), and Explainability. Our solution comprised thorough feature engineering including manual data augmentation, careful preprocessing, latent representations using a VAE, efficient data storage in FAISS vector stores, and a fast searching algorithm with custom matching score combining cosine similarity and popularity.",
    tags: ["Award", "Hackathon", "Recommendation Systems", "FAISS", "Nov 2025"],
    image: "/images/valhacks.png",
    link: "https://www.linkedin.com/feed/update/urn:li:activity:7403755889716953089",
  },
  {
    id: 8,
    title: "Athens Tableau User Group",
    description: "Delivered an educational presentation for the Tableau user community, sharing data visualization best practices.",
    detailedDescription: "I presented advanced visualization techniques and best practices to the Athens Tableau user community, demonstrating how to effectively communicate complex data insights. The presentation covered creating interactive dashboards, optimizing for performance, and design principles for clear data storytelling.",
    tags: ["Talk", "Teaching", "03/2024", "Volunteering"],
    image: "images/tableau.jpeg",
  },
];

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    detailedDescription?: string;
    tags: string[];
    image: string;
  };
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
        <div className="aspect-video relative overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 image-fade-in ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
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

const Portfolio = () => {
  const dataSectionRef = useRef<HTMLDivElement>(null);
  const workSectionRef = useRef<HTMLDivElement>(null);

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
              <a
                href="https://www.linkedin.com/in/dimitris-papantzikos/details/projects/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
              >
                View All Projects <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-on-scroll opacity-0 transition-opacity duration-700"
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center md:hidden">
              <a
                href="https://www.linkedin.com/in/dimitris-papantzikos/details/projects/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
              >
                View All Projects <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
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
              <a
                href="/CV_Dimitris_Papantzikos.pdf"
                className="hidden md:inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
                download="CV_Dimitris_Papantzikos.pdf"
              >
                Download CV <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workExperience.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-on-scroll opacity-0 transition-opacity duration-700"
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center md:hidden">
              <a
                href="/CV_Dimitris_Papantzikos.pdf"
                className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border hover:bg-secondary transition-colors"
                download="CV_Dimitris_Papantzikos.pdf"
              >
                Download CV <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
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
              {talks.map((talk, index) => (
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

      {/* Add the Gallery section here */}
      <Gallery />
    </>
  );
};

export default Portfolio;