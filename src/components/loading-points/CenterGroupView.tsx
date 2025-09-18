import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Building2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingPoint, LoadingPointCard } from './LoadingPointCard';

export interface Center {
  id: string;
  name: string;
  description?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface CenterGroupViewProps {
  center: Center;
  loadingPoints: LoadingPoint[];
  expanded?: boolean;
  onToggle?: (centerId: string) => void;
  onPointSelect?: (point: LoadingPoint) => void;
  onAddPoint?: (centerId: string) => void;
  onEditCenter?: (centerId: string) => void;
  showActions?: boolean;
  variant?: 'list' | 'grid' | 'compact';
  className?: string;
}

const statusVariants = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
};

export function CenterGroupView({
  center,
  loadingPoints = [],
  expanded = false,
  onToggle,
  onPointSelect,
  onAddPoint,
  onEditCenter,
  showActions = true,
  variant = 'list',
  className,
}: CenterGroupViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onToggle) {
      onToggle(center.id);
    }
  };

  const activePointsCount = loadingPoints.filter(point => point.status === 'active').length;
  const totalPointsCount = loadingPoints.length;

  if (variant === 'compact') {
    return (
      <div className={cn("border border-gray-200 rounded-lg", className)}>
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={handleToggle}
        >
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <Building2 className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{center.name}</h3>
              <p className="text-sm text-gray-500">
                {activePointsCount} of {totalPointsCount} points active
              </p>
            </div>
          </div>
          <Badge variant="outline" className={statusVariants[center.status]}>
            {statusLabels[center.status]}
          </Badge>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 p-4 space-y-2">
            {loadingPoints.map(point => (
              <LoadingPointCard
                key={point.id}
                loadingPoint={point}
                variant="compact"
                onSelect={onPointSelect}
              />
            ))}
            {loadingPoints.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No loading points in this center</p>
                {showActions && onAddPoint && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onAddPoint(center.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Loading Point
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg", className)}>
      {/* Center Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <button
              onClick={handleToggle}
              className="mt-1 p-1 rounded hover:bg-gray-100 transition-colors"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${center.name}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {center.name}
                </h2>
                <Badge variant="outline" className={statusVariants[center.status]}>
                  {statusLabels[center.status]}
                </Badge>
              </div>

              {center.description && (
                <p className="text-gray-600 mb-2">{center.description}</p>
              )}

              {center.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{center.address}</span>
                </div>
              )}

              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{totalPointsCount} loading points</span>
                <span>•</span>
                <span>{activePointsCount} active</span>
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2">
              {onAddPoint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddPoint(center.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Point
                </Button>
              )}
              {onEditCenter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditCenter(center.id)}
                >
                  Edit Center
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Points List */}
      {isExpanded && (
        <div className="p-6">
          {loadingPoints.length > 0 ? (
            <div 
              className={cn(
                variant === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              )}
            >
              {loadingPoints.map(point => (
                <LoadingPointCard
                  key={point.id}
                  loadingPoint={point}
                  variant={variant === 'grid' ? 'default' : 'compact'}
                  onSelect={onPointSelect}
                  showCenter={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No loading points yet
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first loading point to this center.
              </p>
              {showActions && onAddPoint && (
                <Button onClick={() => onAddPoint(center.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Loading Point
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}