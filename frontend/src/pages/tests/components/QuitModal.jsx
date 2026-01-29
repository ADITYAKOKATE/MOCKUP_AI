import React from 'react';
import { PlayCircle, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';

const QuitModal = ({ isOpen, onClose, onResume, onDiscard, onSaveAndExit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Close Button (top-right) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="bg-orange-100 p-3 rounded-full mb-4">
                        <AlertTriangle className="text-orange-600 w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pause / Quit Test</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        What would you like to do? You can resume later (if active), discard this attempt, or save and finish later.
                    </p>

                    <div className="grid grid-cols-1 gap-3 w-full">
                        {/* Resume */}
                        <button
                            onClick={onResume}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                        >
                            <PlayCircle size={18} />
                            Resume Test
                        </button>

                        {/* Save & Finish Later */}
                        <button
                            onClick={onSaveAndExit}
                            className="w-full py-3 bg-white hover:bg-green-50 text-green-700 border border-green-200 hover:border-green-300 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Save & Finish Later
                        </button>

                        {/* Discard */}
                        <button
                            onClick={onDiscard}
                            className="w-full py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Discard Attempt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuitModal;
