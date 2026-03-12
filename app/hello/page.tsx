"use client";

import Lottie from "lottie-react";
import animationData from "../../public/hello-animation.json";

export default function HelloPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "'Georgia', serif",
      }}
    >
      <Lottie
        animationData={animationData}
        loop
        style={{ width: 500, maxWidth: "90vw" }}
      />

      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(2.5rem, 7vw, 5rem)",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          background:
            "linear-gradient(90deg, #f9d423, #ff4e50, #c471ed, #12c2e9, #f9d423)",
          backgroundSize: "300% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shine 4s linear infinite",
          filter: "drop-shadow(0 0 18px rgba(196,113,237,0.6))",
          textAlign: "center",
          padding: "0 16px",
        }}
      >
        Welcome Aboard
      </h1>

      <style>{`
        @keyframes shine {
          0%   { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
      `}</style>
    </main>
  );
}
