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
          background: "#2A1846",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "3px solid #FFC83A",
            background: "rgba(255,200,58,0.25)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
