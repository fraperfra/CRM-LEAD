"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface CSVExportProps {
    data: any[];
    filename: string;
    fields?: string[];
}

export function CSVExport({ data, filename, fields }: CSVExportProps) {
    const exportToCSV = () => {
        if (data.length === 0) return;

        // Determine fields to export
        const exportFields = fields || Object.keys(data[0]);

        // Create CSV header
        const header = exportFields.join(',');

        // Create CSV rows
        const rows = data.map((row) =>
            exportFields
                .map((field) => {
                    const value = row[field];
                    // Escape quotes and wrap в quotes if contains comma
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                })
                .join(',')
        );

        // Combine header and rows
        const csv = [header, ...rows].join('\n');

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
            <Download className="w-5 h-5" />
            Esporta CSV ({data.length} record)
        </button>
    );
}

interface CSVImportProps {
    onImportComplete: (data: any[]) => void;
    fieldMapping?: Record<string, string>;
}

export function CSVImport({ onImportComplete, fieldMapping }: CSVImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            parseCSVPreview(selectedFile);
        }
    };

    const parseCSVPreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter((line) => line.trim());

            if (lines.length === 0) {
                setError('File CSV vuoto');
                return;
            }

            // Parse header
            const header = lines[0].split(',').map((h) => h.trim());

            // Parse first 5 rows for preview
            const rows = lines.slice(1, 6).map((line) => {
                const values = line.split(',').map((v) => v.trim());
                const row: any = {};
                header.forEach((h, i) => {
                    row[h] = values[i] || '';
                });
                return row;
            });

            setPreview(rows);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter((line) => line.trim());

                // Parse header
                const header = lines[0].split(',').map((h) => h.trim());

                // Parse all rows
                const rows = lines.slice(1).map((line) => {
                    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
                    const row: any = {};
                    header.forEach((h, i) => {
                        // Apply field mapping if provided
                        const mappedField = fieldMapping?.[h] || h;
                        row[mappedField] = values[i] || '';
                    });
                    return row;
                });

                onImportComplete(rows);
                setFile(null);
                setPreview([]);
            } catch (err) {
                setError('Errore durante l\'importazione del file');
            } finally {
                setImporting(false);
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                />
                <label
                    htmlFor="csv-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                    Seleziona file CSV
                </label>
                <p className="text-sm text-gray-500 mt-2">o trascina qui il file</p>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                    <XCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">
                            Anteprima prime 5 righe. Click "Importa" per procedere.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {Object.keys(preview[0]).map((key) => (
                                        <th
                                            key={key}
                                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                        >
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {preview.map((row, idx) => (
                                    <tr key={idx}>
                                        {Object.values(row).map((value: any, i) => (
                                            <td key={i} className="px-4 py-2 text-sm text-gray-900">
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {importing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Importazione in corso...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Importa {file?.name}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
