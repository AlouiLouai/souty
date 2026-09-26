export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-mesh-noise opacity-30" />

      <div className="absolute -left-1/4 top-[-10%] h-[70vh] w-[70vh] rounded-full bg-white/[0.08] blur-[110px] animate-blob-a" />
      <div className="absolute -right-1/4 top-[10%] h-[60vh] w-[60vh] rounded-full bg-white/[0.06] blur-[110px] animate-blob-b" />
      <div className="absolute bottom-[-15%] left-[10%] h-[65vh] w-[65vh] rounded-full bg-white/[0.05] blur-[120px] animate-blob-c" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-white/[0.04] blur-[100px] animate-blob-b" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
    </div>
  );
}
