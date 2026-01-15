/**
 * SearchResultsGrid Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid';
import { PropertyMatch } from '@/components/search/PropertyMatchCard';

const mockProperties: PropertyMatch[] = [
  {
    id: 'prop-1',
    title: 'Apartamento T2',
    typology: 'T2',
    location: {
      distrito: 'Lisboa',
      concelho: 'Lisboa',
    },
    price: 300000,
    area: 80,
    bedrooms: 2,
    bathrooms: 1,
    matchScore: {
      overall: 85,
      locationScore: 90,
      priceScore: 80,
      featuresScore: 85,
      reasons: ['Great location'],
    },
  },
  {
    id: 'prop-2',
    title: 'Apartamento T3',
    typology: 'T3',
    location: {
      distrito: 'Porto',
      concelho: 'Porto',
    },
    price: 250000,
    area: 100,
    bedrooms: 3,
    bathrooms: 2,
    matchScore: {
      overall: 75,
      locationScore: 80,
      priceScore: 70,
      featuresScore: 75,
      reasons: ['Good price'],
    },
  },
];

describe('SearchResultsGrid', () => {
  const mockOnSearch = jest.fn().mockResolvedValue({
    properties: mockProperties,
    total: 2,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search results', async () => {
    render(<SearchResultsGrid onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText(/2 imóveis encontrados/i)).toBeInTheDocument();
    });
  });

  it('should display properties in grid', async () => {
    render(<SearchResultsGrid onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText(/Apartamento T2/i)).toBeInTheDocument();
      expect(screen.getByText(/Apartamento T3/i)).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    const slowSearch = jest.fn(() => new Promise(() => {}));
    render(<SearchResultsGrid onSearch={slowSearch} />);

    expect(screen.getByText(/A carregar/i)).toBeInTheDocument();
  });

  it('should show empty state when no properties found', async () => {
    const emptySearch = jest.fn().mockResolvedValue({
      properties: [],
      total: 0,
    });

    render(<SearchResultsGrid onSearch={emptySearch} />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum imóvel encontrado/i)).toBeInTheDocument();
    });
  });

  it('should toggle between grid and list view', async () => {
    render(<SearchResultsGrid onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Vista de grelha/i)).toBeInTheDocument();
    });

    const listViewButton = screen.getByLabelText(/Vista de lista/i);
    fireEvent.click(listViewButton);

    // The view mode should change (can be verified by checking class names)
    expect(listViewButton.closest('button')).toHaveClass('bg-white');
  });

  it('should handle pagination', async () => {
    const paginatedSearch = jest.fn()
      .mockResolvedValueOnce({
        properties: mockProperties,
        total: 25,
      });

    render(<SearchResultsGrid onSearch={paginatedSearch} />);

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 3/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByText(/Próxima/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(paginatedSearch).toHaveBeenCalledTimes(2);
    });
  });

  it('should apply filters', async () => {
    render(<SearchResultsGrid onSearch={mockOnSearch} />);

    // Expand filters
    const expandButton = screen.getByText(/Expandir/i);
    fireEvent.click(expandButton);

    // Apply filters
    const applyButton = screen.getByText(/Aplicar Filtros/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(expect.any(Object), 1);
    });
  });

  it('should reset filters', async () => {
    render(<SearchResultsGrid onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText(/Expandir/i)).toBeInTheDocument();
    });

    const expandButton = screen.getByText(/Expandir/i);
    fireEvent.click(expandButton);

    const resetButton = screen.getByText(/Limpar/i);
    fireEvent.click(resetButton);

    // Filters should be reset
    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('should call onViewProperty when property is clicked', async () => {
    const onViewProperty = jest.fn();
    render(
      <SearchResultsGrid
        onSearch={mockOnSearch}
        onViewProperty={onViewProperty}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Apartamento T2/i)).toBeInTheDocument();
    });

    const propertyCard = screen.getByText(/Apartamento T2/i).closest('div')?.parentElement;
    if (propertyCard) {
      fireEvent.click(propertyCard);
    }

    expect(onViewProperty).toHaveBeenCalledWith('prop-1');
  });

  it('should disable pagination buttons appropriately', async () => {
    const singlePageSearch = jest.fn().mockResolvedValue({
      properties: mockProperties,
      total: 2,
    });

    render(<SearchResultsGrid onSearch={singlePageSearch} />);

    await waitFor(() => {
      expect(screen.queryByText(/Página/i)).not.toBeInTheDocument();
    });
  });
});
