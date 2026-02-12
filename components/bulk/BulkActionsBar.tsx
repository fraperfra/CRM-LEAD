"use client";

import { useState } from 'react';
import { CheckSquare, Square, X, Trash2, Tag, FolderInput, Download } from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onBulkDelete: () => void;
    onBulkUpdateStatus: (status: string) => void;
    onBulkUpdateQuality: (quality: string) => void;
    onBulkAssignSegment: (segmentId: string) => void;
    onBulkExport: () => void;
}

export default function BulkActionsBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onClearSelection,
    onBulkDelete,
    onBulkUpdateStatus,
    onBulkUpdateQuality,
    onBulkAssignSegment,
    onBulkExport,
}: BulkActionsBarProps) {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-40">
            <div className="bg-blue-600 text-white rounded-lg shadow-2xl p-4 max-w-2xl mx-auto md:mx-0">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Selection Info */}
                    <div className="flex items-center gap-3">
                        <CheckSquare className="w-5 h-5" />
                        <span className="font-medium">
                            {selectedCount} su {totalCount} selezionati
                        </span>
                        {selectedCount < totalCount && (
                            <button
                                onClick={onSelectAll}
                                className="text-sm underline hover:no-underline"
                            >
                                Seleziona tutti
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Status Update */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowStatusMenu(!showStatusMenu);
                                    setShowQualityMenu(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded-md text-sm"
                            >
                                <Tag className="w-4 h-4" />
                                Status
                            </button>
                            {showStatusMenu && (
                                <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px]">
                                    {['nuovo', 'contattato', 'qualificato', 'in_trattativa', 'vinto', 'perso'].map(
                                        (status) => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    onBulkUpdateStatus(status);
                                                    setShowStatusMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                            >
                                                {status}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quality Update */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowQualityMenu(!showQualityMenu);
                                    setShowStatusMenu(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded-md text-sm"
                            >
                                <Tag className="w-4 h-4" />
                                Quality
                            </button>
                            {showQualityMenu && (
                                <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 py-2 min-w-[120px]">
                                    {['HOT', 'WARM', 'COLD'].map((quality) => (
                                        <button
                                            key={quality}
                                            onClick={() => {
                                                onBulkUpdateQuality(quality);
                                                setShowQualityMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                        >
                                            {quality}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Export */}
                        <button
                            onClick={onBulkExport}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>

                        {/* Delete */}
                        <button
                            onClick={onBulkDelete}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Elimina
                        </button>

                        {/* Clear Selection */}
                        <button
                            onClick={onClearSelection}
                            className="p-2 hover:bg-blue-700 rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
