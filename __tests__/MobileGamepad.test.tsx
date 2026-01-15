import { render, screen } from '@testing-library/react';
import { MobileGamepad } from '../src/components/games/MobileGamepad';

// Mock window.innerWidth for mobile detection
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('MobileGamepad', () => {
  const mockButtons = [
    {
      id: 'left',
      label: '←',
      icon: '⬅️',
      position: 'left' as const,
      onPress: jest.fn(),
    },
    {
      id: 'right',
      label: '→',
      icon: '➡️',
      position: 'left' as const,
      onPress: jest.fn(),
    },
    {
      id: 'jump',
      label: '↑',
      icon: '⬆️',
      position: 'right' as const,
      onPress: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render on desktop (width > 767px)', () => {
    mockInnerWidth(1024);
    const { container } = render(<MobileGamepad buttons={mockButtons} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders buttons on mobile (width <= 767px)', () => {
    mockInnerWidth(375);
    render(<MobileGamepad buttons={mockButtons} />);
    
    // Wait for state update after resize check
    setTimeout(() => {
      const leftButton = screen.getByLabelText('←');
      const rightButton = screen.getByLabelText('→');
      const jumpButton = screen.getByLabelText('↑');
      
      expect(leftButton).toBeInTheDocument();
      expect(rightButton).toBeInTheDocument();
      expect(jumpButton).toBeInTheDocument();
    }, 100);
  });

  it('buttons have minimum touch area of 60x60px', () => {
    mockInnerWidth(375);
    render(<MobileGamepad buttons={mockButtons} />);
    
    setTimeout(() => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Check for min-w-[60px] min-h-[60px] classes
        expect(button.className).toMatch(/min-w-\[60px\]/);
        expect(button.className).toMatch(/min-h-\[60px\]/);
      });
    }, 100);
  });
});
