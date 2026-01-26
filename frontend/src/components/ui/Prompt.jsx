import React from 'react';

const Prompt = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancel" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
                </div>
                
                <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg char hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors shadow-sm cursor-pointer"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Prompt;
