"use client";

import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import MicButton from "./components/MicButton";

const AvatarCanvas = dynamic(() => import("./components/AvatarCanvas"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "var(--text-muted)",
      }}
    >
      Loading avatar...
    </div>
  ),
});

type Phase = "idle" | "listening" | "thinking" | "speaking";

export default function Home() {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Web Avatar</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Powered by Mistral AI + ElevenLabs
          </p>
        </div>
      </header>

      {/* Avatar viewport */}
      <div style={{ flex: 1, position: "relative" }}>
        <AvatarCanvas analyserRef={analyserRef} />

        {/* Status badge */}
        {phase !== "idle" && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "6px 16px",
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 13,
              color: "var(--text-muted)",
              backdropFilter: "blur(8px)",
            }}
          >
            {phase === "listening" && "Listening..."}
            {phase === "thinking" && "Processing..."}
            {phase === "speaking" && "Speaking..."}
          </div>
        )}
      </div>

      {/* Transcript & Reply panel */}
      <div
        style={{
          padding: "12px 24px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          minHeight: 80,
          maxHeight: 140,
          overflow: "auto",
        }}
      >
        {transcript && (
          <p style={{ fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "var(--text-muted)" }}>You: </span>
            {transcript}
          </p>
        )}
        {reply && (
          <p style={{ fontSize: 13 }}>
            <span style={{ color: "var(--accent)" }}>Avatar: </span>
            {reply}
          </p>
        )}
        {!transcript && !reply && (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Click the button below and speak to start a conversation.
          </p>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          padding: "16px 24px 24px",
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid var(--border)",
        }}
      >
        <MicButton
          onPhaseChange={setPhase}
          onTranscript={setTranscript}
          onReply={setReply}
          analyserRef={analyserRef}
        />
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
