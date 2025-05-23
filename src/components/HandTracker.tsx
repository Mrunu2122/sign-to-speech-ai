"use client";
import { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { drawHand } from "../utils/drawHand";

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const prevGestureRef = useRef<string | null>(null); // Store last detected gesture

  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          console.log("📷 Camera is now streaming!");

          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      } catch (error) {
        console.error("🚨 Camera access error:", error);
      }
    };

    const loadHandpose = async () => {
      await tf.setBackend("webgl");
      await tf.ready();

      try {
        const net = await handpose.load();
        console.log("🤖 Handpose model loaded");
        await setupCamera();
        detect(net);
      } catch (error) {
        console.error("❌ Handpose model failed to load:", error);
      }
    };

    const detect = async (net: handpose.HandPose) => {
      if (!videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState !== 4) {
        requestAnimationFrame(() => detect(net));
        return;
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      const hands = await net.estimateHands(videoRef.current);
      if (hands.length > 0) {
        drawHand(hands, ctx);
        const gesture = recognizeGesture(hands[0].landmarks);

        if (gesture && gesture !== prevGestureRef.current) {
          prevGestureRef.current = gesture; // Update last detected gesture
          setRecognizedText(gesture);
          speakText(gesture);
        }
      }
      requestAnimationFrame(() => detect(net));
    };

    // Recognize gesture
    const recognizeGesture = (landmarks: number[][]): string | null => {
      if (!landmarks) return null;

      const [thumb, index, middle, ring, pinky] = [
        landmarks[4],  // Thumb tip
        landmarks[8],  // Index tip
        landmarks[12], // Middle tip
        landmarks[16], // Ring tip
        landmarks[20], // Pinky tip
      ];

      const indexMiddleDistance = Math.abs(index[1] - middle[1]);
      const thumbIndexDistance = Math.abs(thumb[0] - index[0]);

      // ✋ "Hello" - Open palm
      if (
        index[1] < landmarks[5][1] &&
        middle[1] < landmarks[9][1] &&
        ring[1] < landmarks[13][1] &&
        pinky[1] < landmarks[17][1]
      ) {
        return "Hello";
      }

      // 👍 "Yes" - Thumb up, other fingers closed
      if (thumb[1] < index[1] && indexMiddleDistance < 20) {
        return "Yes";
      }

      // 👎 "No" - Thumb down, other fingers closed
      if (thumb[1] > index[1] && indexMiddleDistance < 20) {
        return "No";
      }

      // ✋ "Stop" - Open palm facing forward
      if (
        index[1] < landmarks[5][1] &&
        middle[1] < landmarks[9][1] &&
        ring[1] < landmarks[13][1] &&
        pinky[1] < landmarks[17][1] &&
        thumbIndexDistance > 40
      ) {
        return "Stop";
      }

      // 🤟 "I Love You" (ASL) - Thumb, index, pinky up; middle, ring down
      if (
        index[1] < landmarks[5][1] &&
        pinky[1] < landmarks[17][1] &&
        middle[1] > landmarks[9][1] &&
        ring[1] > landmarks[13][1]
      ) {
        return "I Love You";
      }

      return null;
    };

    // Speak recognized text
    const speakText = (text: string) => {
      if (!window.speechSynthesis || !text) return;
    
      // Stop any ongoing speech before starting a new one
      window.speechSynthesis.cancel();
    
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
    
      // Speak the new recognized text
      window.speechSynthesis.speak(utterance);
    };
    

    loadHandpose();
  }, []);

  return (
    <div className="relative flex justify-center items-center h-screen bg-gray-900">
      <div className="relative">
        <h1 className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xl font-bold text-white">
          Sign-to-Speech AI
        </h1>
        <video ref={videoRef} className="rounded-lg" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
        <p className="mt-4 text-2xl font-semibold text-white">{recognizedText}</p>
      </div>
    </div>
  );
};

export default HandTracker;
