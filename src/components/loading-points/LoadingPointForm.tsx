import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Building2, Phone, Clock, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoadingPoint } from './LoadingPointCard';
import { Center } from './CenterGroupView';

const loadingPointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  centerId: z.string().min(1, 'Center is required'),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  operatingHours: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

type LoadingPointFormData = z.infer<typeof loadingPointSchema>;

interface LoadingPointFormProps {
  centers: Center[];
  loadingPoint?: LoadingPoint;
  onSubmit: (data: LoadingPointFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export function LoadingPointForm({
  centers = [],
  loadingPoint,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: LoadingPointFormProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const form = useForm<LoadingPointFormData>({
    resolver: zodResolver(loadingPointSchema),
    defaultValues: {
      name: loadingPoint?.name || '',
      address: loadingPoint?.address || '',
      centerId: loadingPoint?.centerId || '',
      contactPerson: loadingPoint?.contactPerson || '',
      contactPhone: loadingPoint?.contactPhone || '',
      operatingHours: loadingPoint?.operatingHours || '',
      status: loadingPoint?.status || 'active',
      coordinates: loadingPoint?.coordinates,
    },
  });

  const activeCenters = centers.filter(center => center.status === 'active');

  const handleSubmit = async (data: LoadingPointFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling will be managed by the parent component
      console.error('Form submission error:', error);
    }
  };

  const handleGeocodeAddress = async () => {
    const address = form.getValues('address');
    if (!address.trim()) return;

    setIsGeocoding(true);
    try {
      // This would integrate with a geocoding service like Google Maps API
      // For now, we'll simulate the geocoding process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated coordinates - in real implementation, use actual geocoding
      const mockCoordinates = {
        lat: 37.7749 + (Math.random() - 0.5) * 0.01,
        lng: -122.4194 + (Math.random() - 0.5) * 0.01,
      };
      
      form.setValue('coordinates', mockCoordinates);
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {loadingPoint ? 'Edit Loading Point' : 'New Loading Point'}
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loading Point Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Main Warehouse Dock A" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for this loading point
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="centerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="Select a center" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The center that this loading point belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Enter full address including street, city, state, and postal code"
                      className="min-h-[80px]"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeocodeAddress}
                      disabled={isGeocoding || !field.value.trim()}
                      className="px-3"
                    >
                      {isGeocoding ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Complete address for precise location identification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., John Smith" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Primary contact for this loading point
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., (555) 123-4567" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Phone number for coordination
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Operating Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="operatingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating Hours (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 6:00 AM - 6:00 PM" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    When this loading point is available
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current operational status
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Coordinates Display */}
          {form.watch('coordinates') && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  Location Coordinates
                </span>
              </div>
              <div className="text-sm text-emerald-700 font-mono">
                Lat: {form.watch('coordinates')?.lat.toFixed(6)}, 
                Lng: {form.watch('coordinates')?.lng.toFixed(6)}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{loadingPoint ? 'Update' : 'Create'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}