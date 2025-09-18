import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, MapPin, Star, Clock } from 'lucide-react';
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
import { LoadingPoint } from './LoadingPointCard';

interface LoadingPointSelectorProps {
  loadingPoints: LoadingPoint[];
  value?: string;
  onChange: (loadingPointId: string) => void;
  placeholder?: string;
  groupByCenter?: boolean;
  favoritePoints?: string[];
  recentPoints?: string[];
  filterFn?: (point: LoadingPoint, query: string) => boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const defaultFilterFn = (point: LoadingPoint, query: string): boolean => {
  const searchText = query.toLowerCase();
  return (
    point.name.toLowerCase().includes(searchText) ||
    point.address.toLowerCase().includes(searchText) ||
    point.center?.name.toLowerCase().includes(searchText) ||
    false
  );
};

export function LoadingPointSelector({
  loadingPoints = [],
  value,
  onChange,
  placeholder = "Select loading point...",
  groupByCenter = true,
  favoritePoints = [],
  recentPoints = [],
  filterFn = defaultFilterFn,
  disabled = false,
  error,
  className,
}: LoadingPointSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPoint = useMemo(() => {
    return loadingPoints.find(point => point.id === value);
  }, [loadingPoints, value]);

  const { favoritesList, recentsList, groupedPoints } = useMemo(() => {
    const filtered = loadingPoints.filter(point => 
      searchQuery ? filterFn(point, searchQuery) : true
    );

    const favorites = filtered.filter(point => 
      favoritePoints.includes(point.id)
    );

    const recents = filtered.filter(point => 
      recentPoints.includes(point.id) && !favoritePoints.includes(point.id)
    );

    let grouped: Record<string, LoadingPoint[]> = {};
    
    if (groupByCenter) {
      grouped = filtered.reduce((acc, point) => {
        const centerName = point.center?.name || 'Uncategorized';
        if (!acc[centerName]) {
          acc[centerName] = [];
        }
        acc[centerName].push(point);
        return acc;
      }, {} as Record<string, LoadingPoint[]>);

      // Sort points within each group
      Object.keys(grouped).forEach(centerName => {
        grouped[centerName].sort((a, b) => a.name.localeCompare(b.name));
      });
    }

    return {
      favoritesList: favorites,
      recentsList: recents,
      groupedPoints: grouped,
    };
  }, [loadingPoints, searchQuery, filterFn, favoritePoints, recentPoints, groupByCenter]);

  const handleSelect = (pointId: string) => {
    onChange(pointId);
    setOpen(false);
  };

  const getPointDisplayText = (point: LoadingPoint): string => {
    if (groupByCenter && point.center) {
      return point.name;
    }
    return point.center ? `${point.name} (${point.center.name})` : point.name;
  };

  const renderPointItem = (point: LoadingPoint, showIcon = false) => (
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
          <div className="flex items-center space-x-2">
            <span className="font-medium truncate">
              {getPointDisplayText(point)}
            </span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                point.status === 'active' && 'bg-emerald-100 text-emerald-700',
                point.status === 'inactive' && 'bg-gray-100 text-gray-600',
                point.status === 'maintenance' && 'bg-amber-100 text-amber-700'
              )}
            >
              {point.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {point.address}
          </p>
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
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No loading points found</p>
                  <Button variant="outline" size="sm">
                    Create new loading point
                  </Button>
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
                          <p className="text-sm text-gray-500 truncate">
                            {point.address}
                          </p>
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
                          <p className="text-sm text-gray-500 truncate">
                            {point.address}
                          </p>
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
                  {loadingPoints
                    .filter(point => searchQuery ? filterFn(point, searchQuery) : true)
                    .map(point => renderPointItem(point, true))}
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