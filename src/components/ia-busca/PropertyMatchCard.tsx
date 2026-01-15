/**
 * PropertyMatchCard - Display property match with score and reasons
 * Mobile-first responsive design with iOS-style aesthetics
 */

'use client';

import React from 'react';
import { MapPin, Bed, Bath, Maximize2, TrendingUp, TrendingDown, Star, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PropertyMatch } from '@/services/notifications';

interface PropertyMatchCardProps {
  match: PropertyMatch;
  onViewDetails?: (propertyId: string) => void;
  onContact?: (propertyId: string) => void;
  showActions?: boolean;
}

export function PropertyMatchCard({ 
  match, 
  onViewDetails, 
  onContact,
  showActions = true 
}: PropertyMatchCardProps) {
  const { property, matchScore, matchReasons } = match;

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  // Format price in EUR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      {/* Image Section */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-slate-800">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <MapPin className="w-16 h-16 text-slate-600" />
          </div>
        )}
        
        {/* Match Score Badge */}
        <div className="absolute top-3 right-3">
          <div className={`rounded-full px-3 py-1.5 border backdrop-blur-sm ${getScoreColor(matchScore)}`}>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-sm">{matchScore}</span>
            </div>
          </div>
        </div>

        {/* AI Scores */}
        {(property.angariaScore || property.vendaScore) && (
          <div className="absolute top-3 left-3 flex gap-2">
            {property.angariaScore && property.angariaScore > 0 && (
              <div className="rounded-full px-2.5 py-1 bg-red-500/90 backdrop-blur-sm border border-red-400/50">
                <div className="flex items-center gap-1 text-white">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-semibold">A: {property.angariaScore}</span>
                </div>
              </div>
            )}
            {property.vendaScore && property.vendaScore > 0 && (
              <div className="rounded-full px-2.5 py-1 bg-green-500/90 backdrop-blur-sm border border-green-400/50">
                <div className="flex items-center gap-1 text-white">
                  <TrendingDown className="w-3 h-3" />
                  <span className="text-xs font-semibold">V: {property.vendaScore}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 text-slate-50">
          {property.title}
        </CardTitle>
        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="text-2xl font-bold text-emerald-400">
          {formatPrice(property.price)}
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Maximize2 className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <div className="font-semibold">{property.area}</div>
              <div className="text-xs text-slate-500">m²</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-300">
            <Bed className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <div className="font-semibold">{property.bedrooms}</div>
              <div className="text-xs text-slate-500">quartos</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-300">
            <Bath className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <div className="font-semibold">{property.bathrooms}</div>
              <div className="text-xs text-slate-500">casas banho</div>
            </div>
          </div>
        </div>

        {/* Match Reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase">Razões do Match</div>
            <div className="space-y-1">
              {matchReasons.slice(0, 3).map((reason, index) => (
                <div 
                  key={index}
                  className="text-sm text-slate-300 flex items-start gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span className="line-clamp-2">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="flex gap-2 pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails?.(property.id)}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver Detalhes
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={() => onContact?.(property.id)}
          >
            Contactar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
