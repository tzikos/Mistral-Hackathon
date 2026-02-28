"use client";

import React, { useRef, useState, useCallback } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type Phase = "idle" | "listening" | "thinking" | "speaking";

interface MicButtonProps {
  onPhaseChange: (phase: Phase) => void;
  onTranscript: (text: string) => void;
  onReply: (text: string) => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

/**
 * Persistent audio pipeline objects.
 * createMediaElementSource can only be called once per HTMLAudioElement,
 * so we create the full chain once and reuse it across plays.
 */
interface AudioPipeline {
  ctx: AudioContext;
  audio: HTMLAudioElement;
  analyser: AnalyserNode;
}

export default function MicButton({
  onPhaseChange,
  onTranscript,
  onReply,
  analyserRef,
}: MicButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pipelineRef = useRef<AudioPipeline | null>(null);

  const updatePhase = useCallback(
    (p: Phase) => {
      setPhase(p);
      onPhaseChange(p);
    },
    [onPhaseChange]
  );

  const getPipeline = useCallback((): AudioPipeline => {
    if (pipelineRef.current) return pipelineRef.current;

    const ctx = new AudioContext();
    const audio = new Audio();
    audio.crossOrigin = "anonymous";

    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    const pipeline: AudioPipeline = { ctx, audio, analyser };
    pipelineRef.current = pipeline;
    return pipeline;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendToBackend(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      updatePhase("listening");
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }, [updatePhase]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      updatePhase("thinking");
    }
  }, [updatePhase]);

  const sendToBackend = useCallback(
    async (blob: Blob) => {
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        const res = await fetch(`${BACKEND}/api/talk`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error("Backend error:", errBody);
          updatePhase("idle");
          return;
        }

        const data = await res.json();
        onTranscript(data.transcript ?? "");
        onReply(data.replyText ?? "");

        if (data.audioUrl) {
          updatePhase("speaking");
          await playAudio(`${BACKEND}${data.audioUrl}`);
        }

        updatePhase("idle");
      } catch (err) {
        console.error("Network error:", err);
        updatePhase("idle");
      }
    },
    [onTranscript, onReply, updatePhase]
  );

  const playAudio = useCallback(
    async (url: string) => {
      const { ctx, audio, analyser } = getPipeline();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      analyserRef.current = analyser;

      return new Promise<void>((resolve) => {
        audio.src = url;

        audio.onended = () => {
          analyserRef.current = null;
          resolve();
        };
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          analyserRef.current = null;
          resolve();
        };

        audio.play().catch((e) => {
          console.error("Audio play() failed:", e);
          analyserRef.current = null;
          resolve();
        });
      });
    },
    [analyserRef, getPipeline]
  );

  const handleClick = () => {
    if (phase === "idle") startRecording();
    else if (phase === "listening") stopRecording();
  };

  const label: Record<Phase, string> = {
    idle: "Hold to Talk",
    listening: "Listening... (click to stop)",
    thinking: "Thinking...",
    speaking: "Speaking...",
  };

  const colors: Record<Phase, string> = {
    idle: "var(--accent)",
    listening: "var(--danger)",
    thinking: "var(--text-muted)",
    speaking: "var(--success)",
  };

  return (
    <button
      onClick={handleClick}
      disabled={phase === "thinking" || phase === "speaking"}
      style={{
        padding: "14px 32px",
        fontSize: 16,
        fontWeight: 600,
        border: "2px solid",
        borderColor: colors[phase],
        borderRadius: 12,
        background:
          phase === "listening" ? "rgba(231, 76, 60, 0.15)" : "var(--surface)",
        color: colors[phase],
        cursor:
          phase === "thinking" || phase === "speaking"
            ? "not-allowed"
            : "pointer",
        transition: "all 0.2s ease",
        boxShadow:
          phase === "listening" ? "0 0 20px rgba(231, 76, 60, 0.3)" : "none",
      }}
    >
      {phase === "listening" && (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--danger)",
            marginRight: 8,
            animation: "pulse 1s infinite",
          }}
        />
      )}
      {label[phase]}
    </button>
  );
}
