import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "text-xl font-extrabold tracking-tight",
    md: "text-2xl font-extrabold tracking-tight",
    lg: "text-5xl sm:text-6xl font-extrabold tracking-tight",
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
        AskMe
      </span>
      <span className="text-muted-foreground/60">.</span>
      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
        stral
      </span>
    </span>
  );
};

export default Logo;
