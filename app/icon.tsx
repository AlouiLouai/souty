import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "#000000",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "3px solid rgba(255,255,255,0.9)",
            background: "rgba(255,255,255,0.15)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
