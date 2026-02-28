"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM } from "@pixiv/three-vrm";

// ---------------------------------------------------------------------------
// Inner component that lives inside the R3F Canvas
// ---------------------------------------------------------------------------
function AvatarModel({
  url,
  analyserRef,
}: {
  url: string;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}) {
  const vrmRef = useRef<VRM | null>(null);
  const { scene, camera } = useThree();
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) return;

        // Clean up previous model
        if (vrmRef.current) {
          scene.remove(vrmRef.current.scene);
        }

        vrm.scene.rotation.y = Math.PI;
        scene.add(vrm.scene);
        vrmRef.current = vrm;

        // Position camera to frame the head/upper body
        camera.position.set(0, 1.4, 1.0);
        (camera as THREE.PerspectiveCamera).lookAt(0, 1.3, 0);
      },
      undefined,
      (error) => console.error("VRM load error:", error)
    );

    return () => {
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [url, scene, camera]);

  useFrame(() => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    const delta = clockRef.current.getDelta();
    vrm.update(delta);

    // Lip-sync: read audio analyser data to drive mouth blend shape
    const analyser = analyserRef.current;
    if (analyser && vrm.expressionManager) {
      const dataArray = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Map RMS (0-1) to mouth open value with some amplification
      const mouthOpen = Math.min(1, rms * 4);

      vrm.expressionManager.setValue("aa", mouthOpen);
      vrm.expressionManager.update();
    }

    // Idle blink animation
    if (vrm.expressionManager) {
      const t = clockRef.current.elapsedTime;
      const blinkCycle = t % 4;
      const blink = blinkCycle > 3.8 ? 1 : 0;
      vrm.expressionManager.setValue("blink", blink);
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Exported wrapper component
// ---------------------------------------------------------------------------
export default function AvatarCanvas({
  analyserRef,
}: {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}) {
  const [vrmUrl, setVrmUrl] = useState("/avatar.vrm");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/avatar.vrm", { method: "HEAD" })
      .then((res) => {
        if (!res.ok) setLoadError(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-muted)",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
        <p>Place an <code>avatar.vrm</code> file in <code>frontend/public/</code></p>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 1.4, 1.0], fov: 35, near: 0.1, far: 100 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
      <AvatarModel url={vrmUrl} analyserRef={analyserRef} />
      <OrbitControls
        target={[0, 1.3, 0]}
        enablePan={false}
        minDistance={0.5}
        maxDistance={3}
      />
    </Canvas>
  );
}
