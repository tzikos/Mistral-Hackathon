import React, { useState } from "react";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

interface AvatarFallbackProps {
  src?: string | null;
  name: string;
  alt?: string;
  /** Tailwind text-size class for the initials, e.g. "text-xs", "text-lg", "text-4xl" */
  textClassName?: string;
  imgClassName?: string;
}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({
  src,
  name,
  alt,
  textClassName = "text-lg",
  imgClassName = "w-full h-full object-cover",
}) => {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        className={imgClassName}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/20 text-white font-semibold select-none ${textClassName}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default AvatarFallback;
