'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchAPI } from '@/lib/api/client';

interface SettlementPreview {
  driverId: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    bankName?: string;
    accountNumber?: string;
  };
  yearMonth: string;
  totalTrips: number;
  totalBaseFare: number;
  totalDeductions: number;
  totalAdditions: number;
  finalAmount: number;
  trips: any[];
}

export default function SettlementPage() {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch drivers
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => fetchAPI('/api/drivers'),
  });

  // Fetch preview
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['settlement-preview', selectedMonth, selectedDriverId],
    queryFn: () => fetchAPI('/api/settlements/preview', {
      method: 'POST',
      body: JSON.stringify({
        yearMonth: selectedMonth,
        driverId: selectedDriverId || undefined,
      }),
    }),
    enabled: showPreview,
  });

  // Fetch existing settlements
  const { data: existingSettlements } = useQuery({
    queryKey: ['settlements', selectedMonth],
    queryFn: () => fetchAPI(`/api/settlements?yearMonth=${selectedMonth}`),
    enabled: showPreview,
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () => fetchAPI('/api/settlements/finalize', {
      method: 'POST',
      body: JSON.stringify({
        yearMonth: selectedMonth,
        driverId: selectedDriverId || undefined,
      }),
    }),
    onSuccess: () => {
      toast.success('Settlement confirmed successfully');
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlement-preview'] });
      setShowPreview(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to confirm settlement');
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => fetchAPI('/api/settlements/export', {
      method: 'POST',
      body: JSON.stringify({
        yearMonth: selectedMonth,
        driverId: selectedDriverId || undefined,
      }),
    }),
    onSuccess: (data) => {
      toast.success(`Export ready: ${data.data.filename}`);
      // In production, this would trigger file download
      console.log('Export data:', data);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export settlements');
    },
  });

  const handlePreview = () => {
    setShowPreview(true);
    refetchPreview();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settlement Management</h1>
        <p className="text-gray-600">Generate and manage monthly driver settlements</p>
      </div>

      {/* Selection Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver (Optional)
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Drivers</option>
              {drivers?.data?.map((driver: any) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePreview}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Preview Settlement
            </button>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {showPreview && previewData && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Settlement Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {previewData.data.summary.totalDrivers}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(previewData.data.summary.totalAmount)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {previewData.data.summary.hasExisting ? 
                    <span className="text-yellow-600">Has Existing</span> : 
                    <span className="text-green-600">Ready</span>
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Driver Details */}
          {previewData.data.previews.map((preview: SettlementPreview) => (
            <div key={preview.driverId} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{preview.driver.name}</h3>
                  <p className="text-sm text-gray-600">
                    {preview.driver.phone} | {preview.driver.bankName} {preview.driver.accountNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Final Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(preview.finalAmount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="font-semibold">{preview.totalTrips}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Base Fare</p>
                  <p className="font-semibold">{formatCurrency(preview.totalBaseFare)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deductions</p>
                  <p className="font-semibold text-red-600">
                    -{formatCurrency(preview.totalDeductions)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Additions</p>
                  <p className="font-semibold text-green-600">
                    +{formatCurrency(preview.totalAdditions)}
                  </p>
                </div>
              </div>

              {previewData.data.existingSettlements[preview.driverId] && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    Existing settlement found: {previewData.data.existingSettlements[preview.driverId]}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => exportMutation.mutate()}
                disabled={!existingSettlements?.data?.length || exportMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {exportMutation.isPending ? 'Exporting...' : 'Export to Excel'}
              </button>
              <button
                onClick={() => finalizeMutation.mutate()}
                disabled={finalizeMutation.isPending || previewData.data.summary.hasExisting}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {finalizeMutation.isPending ? 'Confirming...' : 'Confirm Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}