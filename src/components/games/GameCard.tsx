'use client';

type GameCardProps = {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
};

export function GameCard({ icon, title, description, onClick }: GameCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-pink-50 p-6 shadow-lg ring-1 ring-pink-100/70 transition-all hover:shadow-xl hover:scale-[1.02] hover:ring-pink-200 active:scale-[0.98]"
    >
      <div className="flex flex-col items-start gap-4">
        <div className="text-5xl transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
