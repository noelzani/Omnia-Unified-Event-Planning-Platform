export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#fdf7f8] to-[#f9f0f3]">
      <style>{`
        @keyframes pl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pl-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="flex flex-col items-center gap-5" style={{ animation: 'pl-fade 0.5s ease both' }}>
        <span className="text-2xl font-bold tracking-[0.18em] bg-gradient-to-br from-[#875A6B] to-[#EABAB0] bg-clip-text text-transparent select-none">
          OMNIA
        </span>
        <div className="relative size-8">
          <div className="absolute inset-0 rounded-full border-2 border-[#EABAB0]/30" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#875A6B]"
            style={{ animation: 'pl-spin 0.9s linear infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
