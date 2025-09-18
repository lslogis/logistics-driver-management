/**
 * Loading Points Design System Components
 * Integrates with existing useLoadingPoints hook and API structure
 */

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, MapPin, Star, Clock, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { LoadingPointResponse, LoadingPointSuggestion } from '@/hooks/useLoadingPoints';

// Enhanced interfaces that extend existing types
export interface EnhancedLoadingPoint extends LoadingPointResponse {
  center?: {
    id: string;
    name: string;
    status: 'active' | 'inactive';
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  operatingHours?: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface LoadingPointCenter {
  id: string;
  name: string;
  description?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
  loadingPoints?: EnhancedLoadingPoint[];
  createdAt: Date;
  updatedAt: Date;
}

// Status styling utilities
const statusVariants = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
};

// Enhanced Loading Point Card Component
interface LoadingPointCardProps {
  loadingPoint: EnhancedLoadingPoint;
  variant?: 'default' | 'compact' | 'detailed';
  showCenter?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (loadingPoint: EnhancedLoadingPoint) => void;
  className?: string;
  isSelected?: boolean;
}

export function LoadingPointCard({
  loadingPoint,
  variant = 'default',
  showCenter = false,
  onEdit,
  onDelete,
  onSelect,
  className,
  isSelected = false,
}: LoadingPointCardProps) {
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(loadingPoint);
    }
  };

  // Map existing data structure to display format
  const displayAddress = loadingPoint.roadAddress || loadingPoint.lotAddress || 'No address provided';
  const displayContact = loadingPoint.manager1 || loadingPoint.manager2;
  const displayPhone = loadingPoint.phone1 || loadingPoint.phone2;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border transition-colors',
          'hover:bg-gray-50 cursor-pointer',
          isSelected && 'ring-2 ring-emerald-500 bg-emerald-50',
          className
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center space-x-3">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{loadingPoint.loadingPointName}</p>
            {showCenter && (
              <p className="text-sm text-gray-500">{loadingPoint.centerName}</p>
            )}
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={statusVariants[loadingPoint.isActive ? 'active' : 'inactive']}
        >
          {loadingPoint.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-6 transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        onSelect && 'cursor-pointer',
        isSelected && 'ring-2 ring-emerald-500 border-emerald-300',
        className
      )}
      onClick={onSelect ? handleCardClick : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {loadingPoint.loadingPointName}
            </h3>
            <Badge 
              variant="outline" 
              className={statusVariants[loadingPoint.isActive ? 'active' : 'inactive']}
            >
              {loadingPoint.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {showCenter && (
            <p className="text-sm text-gray-600 mb-2">
              Center: {loadingPoint.centerName}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start space-x-2 mb-3">
        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-600 leading-relaxed">
          {displayAddress}
        </p>
      </div>

      {/* Contact Information */}
      {(displayContact || displayPhone) && (
        <div className="flex items-center space-x-2 mb-3">
          <div className="text-sm text-gray-600">
            {displayContact && (
              <span>{displayContact}</span>
            )}
            {displayContact && displayPhone && (
              <span> • </span>
            )}
            {displayPhone && (
              <span className="font-mono">{displayPhone}</span>
            )}
          </div>
        </div>
      )}

      {/* Operating Hours */}
      {loadingPoint.operatingHours && (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600 font-mono">
            {loadingPoint.operatingHours}
          </p>
        </div>
      )}

      {/* Remarks */}
      {loadingPoint.remarks && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 italic">
            {loadingPoint.remarks}
          </p>
        </div>
      )}

      {variant === 'detailed' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Created: {new Date(loadingPoint.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(loadingPoint.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Selector that integrates with existing suggestion system
interface LoadingPointSelectorProps {
  suggestions: LoadingPointSuggestion[];
  value?: string;
  onChange: (loadingPointId: string) => void;
  onSearch: (term: string) => void;
  placeholder?: string;
  groupByCenter?: boolean;
  favoritePoints?: string[];
  recentPoints?: string[];
  disabled?: boolean;
  error?: string;
  className?: string;
  isLoading?: boolean;
}

export function LoadingPointSelector({
  suggestions = [],
  value,
  onChange,
  onSearch,
  placeholder = "Search loading points...",
  groupByCenter = true,
  favoritePoints = [],
  recentPoints = [],
  disabled = false,
  error,
  className,
  isLoading = false,
}: LoadingPointSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPoint = useMemo(() => {
    return suggestions.find(point => point.id === value);
  }, [suggestions, value]);

  const { favoritesList, recentsList, groupedPoints } = useMemo(() => {
    const favorites = suggestions.filter(point => 
      favoritePoints.includes(point.id)
    );

    const recents = suggestions.filter(point => 
      recentPoints.includes(point.id) && !favoritePoints.includes(point.id)
    );

    let grouped: Record<string, LoadingPointSuggestion[]> = {};
    
    if (groupByCenter) {
      grouped = suggestions.reduce((acc, point) => {
        const centerName = point.centerName || 'Uncategorized';
        if (!acc[centerName]) {
          acc[centerName] = [];
        }
        acc[centerName].push(point);
        return acc;
      }, {} as Record<string, LoadingPointSuggestion[]>);

      // Sort points within each group
      Object.keys(grouped).forEach(centerName => {
        grouped[centerName].sort((a, b) => a.loadingPointName.localeCompare(b.loadingPointName));
      });
    }

    return {
      favoritesList: favorites,
      recentsList: recents,
      groupedPoints: grouped,
    };
  }, [suggestions, favoritePoints, recentPoints, groupByCenter]);

  const handleSelect = (pointId: string) => {
    onChange(pointId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const getPointDisplayText = (point: LoadingPointSuggestion): string => {
    if (groupByCenter) {
      return point.loadingPointName;
    }
    return `${point.loadingPointName} (${point.centerName})`;
  };

  const renderPointItem = (point: LoadingPointSuggestion, showIcon = false) => (
    <CommandItem
      key={point.id}
      value={point.id}
      onSelect={handleSelect}
      className="flex items-center justify-between py-3"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex items-center space-x-2 flex-shrink-0">
          {showIcon && <MapPin className="h-4 w-4 text-gray-400" />}
          <Check
            className={cn(
              "h-4 w-4",
              value === point.id ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium truncate">
            {getPointDisplayText(point)}
          </span>
        </div>
      </div>
    </CommandItem>
  );

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              error && "border-red-500 focus:ring-red-500",
              !selectedPoint && "text-muted-foreground"
            )}
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {selectedPoint ? getPointDisplayText(selectedPoint) : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search loading points..."
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                      <span className="ml-2 text-sm text-gray-600">Searching...</span>
                    </div>
                  ) : (
                    <>
                      <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">No loading points found</p>
                      <Button variant="outline" size="sm">
                        Create new loading point
                      </Button>
                    </>
                  )}
                </div>
              </CommandEmpty>

              {/* Favorites Section */}
              {favoritesList.length > 0 && (
                <>
                  <CommandGroup heading="Favorites">
                    {favoritesList.map(point => (
                      <CommandItem
                        key={`fav-${point.id}`}
                        value={point.id}
                        onSelect={handleSelect}
                        className="flex items-center space-x-3 py-3"
                      >
                        <Star className="h-4 w-4 text-amber-500 fill-current" />
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === point.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">
                            {getPointDisplayText(point)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Recent Section */}
              {recentsList.length > 0 && (
                <>
                  <CommandGroup heading="Recent">
                    {recentsList.map(point => (
                      <CommandItem
                        key={`recent-${point.id}`}
                        value={point.id}
                        onSelect={handleSelect}
                        className="flex items-center space-x-3 py-3"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === point.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">
                            {getPointDisplayText(point)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Grouped Points */}
              {groupByCenter ? (
                Object.entries(groupedPoints).map(([centerName, points]) => (
                  <CommandGroup key={centerName} heading={centerName}>
                    {points.map(point => renderPointItem(point))}
                  </CommandGroup>
                ))
              ) : (
                <CommandGroup heading="All Loading Points">
                  {suggestions.map(point => renderPointItem(point, true))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Center Group View for hierarchical display
interface CenterGroupViewProps {
  center: LoadingPointCenter;
  loadingPoints: EnhancedLoadingPoint[];
  expanded?: boolean;
  onToggle?: (centerId: string) => void;
  onPointSelect?: (point: EnhancedLoadingPoint) => void;
  showActions?: boolean;
  variant?: 'list' | 'grid' | 'compact';
  className?: string;
}

export function CenterGroupView({
  center,
  loadingPoints = [],
  expanded = false,
  onToggle,
  onPointSelect,
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

  const activePointsCount = loadingPoints.filter(point => point.isActive).length;
  const totalPointsCount = loadingPoints.length;

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
                <Badge 
                  variant="outline" 
                  className={statusVariants[center.status]}
                >
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}