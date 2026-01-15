'use client';

import { useEffect, useState } from 'react';

export type GamepadButton = {
  id: string;
  label: string;
  icon?: string;
  position: 'left' | 'right';
  onPress: () => void;
  onRelease?: () => void;
};

type MobileGamepadProps = {
  buttons: GamepadButton[];
  className?: string;
};

export function MobileGamepad({ buttons, className = '' }: MobileGamepadProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if device is mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (button: GamepadButton) => {
    setActiveButtons(prev => new Set(prev).add(button.id));
    button.onPress();
  };

  const handleTouchEnd = (button: GamepadButton) => {
    setActiveButtons(prev => {
      const next = new Set(prev);
      next.delete(button.id);
      return next;
    });
    button.onRelease?.();
  };

  // Don't render on desktop
  if (!isMobile) return null;

  const leftButtons = buttons.filter(b => b.position === 'left');
  const rightButtons = buttons.filter(b => b.position === 'right');

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none ${className}`}>
      <div className="flex justify-between items-end p-4 max-w-6xl mx-auto">
        {/* Left controls */}
        <div className="flex gap-3 pointer-events-auto">
          {leftButtons.map((button) => (
            <button
              key={button.id}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart(button);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd(button);
              }}
              className={`
                min-w-[60px] min-h-[60px] w-16 h-16
                rounded-full
                flex items-center justify-center
                text-white font-bold text-sm
                shadow-lg
                transition-all duration-100
                ${activeButtons.has(button.id)
                  ? 'bg-purple-700 scale-95'
                  : 'bg-purple-500/90 active:bg-purple-700'
                }
              `}
              aria-label={button.label}
            >
              {button.icon || button.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex gap-3 pointer-events-auto">
          {rightButtons.map((button) => (
            <button
              key={button.id}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart(button);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd(button);
              }}
              className={`
                min-w-[60px] min-h-[60px] w-16 h-16
                rounded-full
                flex items-center justify-center
                text-white font-bold text-sm
                shadow-lg
                transition-all duration-100
                ${activeButtons.has(button.id)
                  ? 'bg-pink-700 scale-95'
                  : 'bg-pink-500/90 active:bg-pink-700'
                }
              `}
              aria-label={button.label}
            >
              {button.icon || button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
