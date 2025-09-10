'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface ImportResult {
  success: boolean;
  simulation?: boolean;
  data?: any;
  error?: any;
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'trips'>('drivers');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Driver import mutation
  const driverImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/drivers', {
        method: 'POST',
        body: formData,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      if (data.success) {
        toast.success(`Successfully imported ${data.data.imported} drivers`);
        setSelectedFile(null);
      } else if (data.simulation) {
        toast.warning('Validation completed. Review errors before importing.');
      } else {
        toast.error('Import failed. Check the error report.');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Import failed');
      setImportResult({ success: false, error: error.message });
    },
  });

  // Trip import mutation
  const tripImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/trips', {
        method: 'POST',
        body: formData,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      if (data.success) {
        toast.success(`Successfully imported ${data.data.imported} trips`);
        setSelectedFile(null);
      } else if (data.simulation) {
        toast.warning('Validation completed. Review errors and duplicates.');
      } else {
        toast.error('Import failed. Check the error report.');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Import failed');
      setImportResult({ success: false, error: error.message });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (activeTab === 'drivers') {
      driverImportMutation.mutate(selectedFile);
    } else {
      tripImportMutation.mutate(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const headers = activeTab === 'drivers' 
      ? ['name', 'phone', 'email', 'businessNumber', 'companyName', 'representativeName', 'bankName', 'accountNumber', 'remarks', 'isActive']
      : ['date', 'driverPhone', 'vehiclePlateNumber', 'routeTemplateName', 'status', 'driverFare', 'billingFare', 'absenceReason', 'deductionAmount', 'substituteDriverPhone', 'substituteFare', 'remarks'];
    
    const csv = headers.join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = driverImportMutation.isPending || tripImportMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Import</h1>
        <p className="text-gray-600">Import drivers and trips from CSV files</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => {
                setActiveTab('drivers');
                setSelectedFile(null);
                setImportResult(null);
              }}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'drivers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Drivers
            </button>
            <button
              onClick={() => {
                setActiveTab('trips');
                setSelectedFile(null);
                setImportResult(null);
              }}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'trips'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Trips
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Import Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the CSV template for {activeTab}</li>
              <li>Fill in the data following the template format</li>
              <li>Upload the completed CSV file</li>
              <li>Review validation results before confirming import</li>
            </ol>
            <button
              onClick={downloadTemplate}
              className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              📥 Download {activeTab} Template
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleImport}
                disabled={!selectedFile || isLoading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {/* Success Result */}
              {importResult.success && importResult.data && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Import Successful!</h3>
                  <div className="text-sm text-green-800">
                    <p>✅ Imported: {importResult.data.imported} records</p>
                    <p className="mt-1">Timestamp: {importResult.data.audit?.timestamp}</p>
                    <p>Imported by: {importResult.data.audit?.importedBy}</p>
                  </div>
                  
                  {/* Show imported items */}
                  {importResult.data[activeTab] && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-green-700 hover:text-green-800">
                        View imported records
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {importResult.data[activeTab].map((item: any, idx: number) => (
                          <div key={idx} className="text-xs py-1 border-t border-green-100">
                            {activeTab === 'drivers' 
                              ? `${item.name} - ${item.phone}`
                              : `${item.date} - ${item.driver} - ${item.vehicle}`
                            }
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Validation Errors */}
              {!importResult.success && importResult.data && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">
                    {importResult.simulation ? 'Validation Report' : 'Import Failed'}
                  </h3>
                  
                  {/* Summary */}
                  <div className="text-sm text-red-800 mb-3">
                    <p>Total Rows: {importResult.data.totalRows}</p>
                    <p>Valid Rows: {importResult.data.validRows}</p>
                    <p>Error Rows: {importResult.data.errorRows}</p>
                    {importResult.data.duplicateRows !== undefined && (
                      <p>Duplicate Rows: {importResult.data.duplicateRows}</p>
                    )}
                  </div>

                  {/* Errors */}
                  {importResult.data.errors && importResult.data.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">Errors:</h4>
                      <div className="max-h-60 overflow-y-auto bg-white rounded border border-red-200 p-2">
                        {importResult.data.errors.map((error: any, idx: number) => (
                          <div key={idx} className="text-xs py-1 border-b border-gray-100 last:border-0">
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicates */}
                  {importResult.data.duplicates && importResult.data.duplicates.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-red-900 mb-1">Duplicates:</h4>
                      <div className="max-h-60 overflow-y-auto bg-white rounded border border-red-200 p-2">
                        {importResult.data.duplicates.map((dup: any, idx: number) => (
                          <div key={idx} className="text-xs py-1 border-b border-gray-100 last:border-0">
                            <span className="font-medium">Row {dup.row}:</span> {dup.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Simple Error */}
              {importResult.error && typeof importResult.error === 'string' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{importResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}