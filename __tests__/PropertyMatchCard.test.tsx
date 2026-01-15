/**
 * PropertyMatchCard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyMatchCard, PropertyMatch } from '@/components/search/PropertyMatchCard';

const mockProperty: PropertyMatch = {
  id: 'prop-123',
  title: 'Apartamento T2 em Lisboa',
  typology: 'T2',
  location: {
    distrito: 'Lisboa',
    concelho: 'Lisboa',
    freguesia: 'Alvalade',
  },
  price: 350000,
  area: 85,
  bedrooms: 2,
  bathrooms: 1,
  images: ['/test-image.jpg'],
  matchScore: {
    overall: 85,
    locationScore: 90,
    priceScore: 80,
    featuresScore: 85,
    reasons: [
      'Localização premium próxima ao metro',
      'Preço dentro do orçamento',
      'Tipologia corresponde à procura',
    ],
  },
  portalCount: 3,
  sources: [
    { name: 'Idealista', url: 'https://idealista.pt/test' },
    { name: 'Imovirtual', url: 'https://imovirtual.pt/test' },
  ],
  firstSeen: new Date('2024-01-01'),
  lastSeen: new Date('2024-01-15'),
};

describe('PropertyMatchCard', () => {
  it('should render property information correctly', () => {
    render(<PropertyMatchCard property={mockProperty} />);

    expect(screen.getByText(/Apartamento T2 em Lisboa/i)).toBeInTheDocument();
    expect(screen.getByText(/Alvalade, Lisboa/i)).toBeInTheDocument();
    expect(screen.getByText(/350\.000/)).toBeInTheDocument();
    expect(screen.getByText(/85m²/)).toBeInTheDocument();
  });

  it('should display match score badge', () => {
    render(<PropertyMatchCard property={mockProperty} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should display match reasons', () => {
    render(<PropertyMatchCard property={mockProperty} />);

    expect(screen.getByText(/Localização premium próxima ao metro/i)).toBeInTheDocument();
    expect(screen.getByText(/Preço dentro do orçamento/i)).toBeInTheDocument();
  });

  it('should call onView when card is clicked', () => {
    const onView = jest.fn();
    render(<PropertyMatchCard property={mockProperty} onView={onView} />);

    const card = screen.getByText(/Apartamento T2 em Lisboa/i).closest('div')?.parentElement;
    if (card) {
      fireEvent.click(card);
    }

    expect(onView).toHaveBeenCalledWith('prop-123');
  });

  it('should call onFavorite when favorite button is clicked', () => {
    const onFavorite = jest.fn();
    render(<PropertyMatchCard property={mockProperty} onFavorite={onFavorite} />);

    const favoriteButton = screen.getByLabelText(/Adicionar aos favoritos/i);
    fireEvent.click(favoriteButton);

    expect(onFavorite).toHaveBeenCalledWith('prop-123');
  });

  it('should call onShare when share button is clicked', () => {
    const onShare = jest.fn();
    render(<PropertyMatchCard property={mockProperty} onShare={onShare} />);

    const shareButton = screen.getByLabelText(/Partilhar/i);
    fireEvent.click(shareButton);

    expect(onShare).toHaveBeenCalledWith('prop-123');
  });

  it('should display portal count when available', () => {
    render(<PropertyMatchCard property={mockProperty} />);

    expect(screen.getByText(/Disponível em 3 portais/i)).toBeInTheDocument();
  });

  it('should show price drop badge when price decreased', () => {
    const propertyWithPriceDrop: PropertyMatch = {
      ...mockProperty,
      priceChange: {
        oldPrice: 380000,
        percentChange: -7.89,
      },
    };

    render(<PropertyMatchCard property={propertyWithPriceDrop} />);

    expect(screen.getByText(/7\.9%/)).toBeInTheDocument();
  });

  it('should render without optional fields', () => {
    const minimalProperty: PropertyMatch = {
      id: 'prop-minimal',
      location: {
        distrito: 'Porto',
        concelho: 'Porto',
      },
      price: 200000,
    };

    render(<PropertyMatchCard property={minimalProperty} />);

    expect(screen.getByText(/200\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Porto, Porto/i)).toBeInTheDocument();
  });

  it('should handle missing image gracefully', () => {
    const propertyNoImage: PropertyMatch = {
      ...mockProperty,
      images: [],
    };

    const { container } = render(<PropertyMatchCard property={propertyNoImage} />);
    const img = container.querySelector('img');

    expect(img).toHaveAttribute('src', '/placeholder-property.jpg');
  });
});
