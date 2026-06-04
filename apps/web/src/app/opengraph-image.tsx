import { ImageResponse } from "next/og";

export const alt = "LearnDojoWorld";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f8fafc",
        color: "#0f172a",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: 72,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ color: "#0f766e", fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
          LEARNDOJOWORLD
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          AI learning, courses, memory, and creators.
        </div>
        <div style={{ color: "#475569", fontSize: 32, maxWidth: 900 }}>
          A global learning platform for focused learners and creator-powered education.
        </div>
      </div>
    </div>,
    size,
  );
}
