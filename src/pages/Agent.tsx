import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const Agent = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl md:text-4xl font-semibold mb-4 gradient-text">
        AI Agent
      </h1>
      <p className="text-muted-foreground mb-8">Coming soon.</p>
      <button
        onClick={() => navigate(`/${profileId}`)}
        className="inline-flex items-center gap-2 px-6 py-3 border border-primary/20 rounded-md hover:bg-secondary transition-all duration-300"
      >
        <ArrowLeft size={18} />
        Back to Profile
      </button>
    </div>
  );
};

export default Agent;
