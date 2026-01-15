/**
 * Tests for PropertyMatchCard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyMatchCard } from '@/components/ia-busca/PropertyMatchCard';
import type { PropertyMatch } from '@/services/notifications';

const mockMatch: PropertyMatch = {
  propertyId: 'test-1',
  matchScore: 85,
  matchReasons: [
    'Preço dentro do orçamento',
    'Localização premium',
    'Área adequada'
  ],
  property: {
    id: 'test-1',
    title: 'Apartamento T3 Moderno',
    price: 450000,
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    location: 'Lisboa, Portugal',
    images: ['https://example.com/image1.jpg'],
    angariaScore: 75,
    vendaScore: 80
  }
};

describe('PropertyMatchCard', () => {
  it('should render property details correctly', () => {
    render(<PropertyMatchCard match={mockMatch} />);
    
    expect(screen.getByText('Apartamento T3 Moderno')).toBeInTheDocument();
    expect(screen.getByText('Lisboa, Portugal')).toBeInTheDocument();
    expect(screen.getByText('450 000 €')).toBeInTheDocument();
  });

  it('should display match score', () => {
    render(<PropertyMatchCard match={mockMatch} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should display match reasons', () => {
    render(<PropertyMatchCard match={mockMatch} />);
    
    expect(screen.getByText('Preço dentro do orçamento')).toBeInTheDocument();
    expect(screen.getByText('Localização premium')).toBeInTheDocument();
  });

  it('should display property characteristics', () => {
    render(<PropertyMatchCard match={mockMatch} />);
    
    expect(screen.getByText('120')).toBeInTheDocument(); // area
    expect(screen.getByText('3')).toBeInTheDocument(); // bedrooms
    expect(screen.getByText('2')).toBeInTheDocument(); // bathrooms
  });

  it('should display AI scores when available', () => {
    render(<PropertyMatchCard match={mockMatch} />);
    
    expect(screen.getByText(/A: 75/)).toBeInTheDocument();
    expect(screen.getByText(/V: 80/)).toBeInTheDocument();
  });

  it('should call onViewDetails when clicking details button', () => {
    const onViewDetails = jest.fn();
    render(<PropertyMatchCard match={mockMatch} onViewDetails={onViewDetails} />);
    
    const detailsButton = screen.getByText('Ver Detalhes');
    fireEvent.click(detailsButton);
    
    expect(onViewDetails).toHaveBeenCalledWith('test-1');
  });

  it('should call onContact when clicking contact button', () => {
    const onContact = jest.fn();
    render(<PropertyMatchCard match={mockMatch} onContact={onContact} />);
    
    const contactButton = screen.getByText('Contactar');
    fireEvent.click(contactButton);
    
    expect(onContact).toHaveBeenCalledWith('test-1');
  });

  it('should hide actions when showActions is false', () => {
    render(<PropertyMatchCard match={mockMatch} showActions={false} />);
    
    expect(screen.queryByText('Ver Detalhes')).not.toBeInTheDocument();
    expect(screen.queryByText('Contactar')).not.toBeInTheDocument();
  });

  it('should render without image when images array is empty', () => {
    const matchWithoutImage = {
      ...mockMatch,
      property: {
        ...mockMatch.property,
        images: []
      }
    };
    
    render(<PropertyMatchCard match={matchWithoutImage} />);
    
    // Should still render the card
    expect(screen.getByText('Apartamento T3 Moderno')).toBeInTheDocument();
  });

  it('should apply correct color class based on match score', () => {
    const { rerender, container } = render(<PropertyMatchCard match={mockMatch} />);
    
    // High score (85) should have emerald color
    const highScoreBadge = container.querySelector('[class*="text-emerald-400"]');
    expect(highScoreBadge).toBeInTheDocument();
    
    // Medium score
    const mediumScoreMatch = { ...mockMatch, matchScore: 65 };
    rerender(<PropertyMatchCard match={mediumScoreMatch} />);
    const mediumScoreBadge = container.querySelector('[class*="text-blue-400"]');
    expect(mediumScoreBadge).toBeInTheDocument();
    
    // Low score
    const lowScoreMatch = { ...mockMatch, matchScore: 45 };
    rerender(<PropertyMatchCard match={lowScoreMatch} />);
    const lowScoreBadge = container.querySelector('[class*="text-yellow-400"]');
    expect(lowScoreBadge).toBeInTheDocument();
  });
});
