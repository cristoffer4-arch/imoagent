export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-pink-100 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-sm">
      <span className="h-3 w-3 animate-ping rounded-full bg-[#E91E63]" />
      <span className="h-3 w-3 animate-ping rounded-full bg-[#9C27B0]" />
      <span className="h-3 w-3 animate-ping rounded-full bg-[#FF9800]" />
      <span>{label ?? "Carregando..."}</span>
    </div>
  );
}
