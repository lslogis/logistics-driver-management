import React from 'react';
import { MapPin, Phone, Clock, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface LoadingPoint {
  id: string;
  name: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  operatingHours?: string;
  status: 'active' | 'inactive' | 'maintenance';
  centerId: string;
  center?: {
    id: string;
    name: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface LoadingPointCardProps {
  loadingPoint: LoadingPoint;
  variant?: 'default' | 'compact' | 'detailed';
  showCenter?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (loadingPoint: LoadingPoint) => void;
  className?: string;
  isSelected?: boolean;
}

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(loadingPoint.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(loadingPoint.id);
    }
  };

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
            <p className="font-medium text-gray-900">{loadingPoint.name}</p>
            {showCenter && loadingPoint.center && (
              <p className="text-sm text-gray-500">{loadingPoint.center.name}</p>
            )}
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={statusVariants[loadingPoint.status]}
        >
          {statusLabels[loadingPoint.status]}
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
              {loadingPoint.name}
            </h3>
            <Badge 
              variant="outline" 
              className={statusVariants[loadingPoint.status]}
            >
              {statusLabels[loadingPoint.status]}
            </Badge>
          </div>
          {showCenter && loadingPoint.center && (
            <p className="text-sm text-gray-600 mb-2">
              Center: {loadingPoint.center.name}
            </p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Address */}
      <div className="flex items-start space-x-2 mb-3">
        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-600 leading-relaxed">
          {loadingPoint.address}
        </p>
      </div>

      {/* Contact Information */}
      {(loadingPoint.contactPerson || loadingPoint.contactPhone) && (
        <div className="flex items-center space-x-2 mb-3">
          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            {loadingPoint.contactPerson && (
              <span>{loadingPoint.contactPerson}</span>
            )}
            {loadingPoint.contactPerson && loadingPoint.contactPhone && (
              <span> • </span>
            )}
            {loadingPoint.contactPhone && (
              <span className="font-mono">{loadingPoint.contactPhone}</span>
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

      {variant === 'detailed' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Created: {loadingPoint.createdAt.toLocaleDateString()}</span>
            <span>Updated: {loadingPoint.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}