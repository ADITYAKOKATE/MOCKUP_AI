import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, ChevronRight } from 'lucide-react';
import { getExamSubjects } from '../../utils/constants';

const SubjectSelectionModal = ({ isOpen, onClose, examType, onSelect }) => {
    const [subjects, setSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        if (isOpen && examType) {
            const data = getExamSubjects(examType);
            setSubjects(data);
        }
    }, [isOpen, examType]);

    const filteredSubjects = subjects.filter(s =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirm = () => {
        if (selectedSubject) {
            onSelect(selectedSubject);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <BookOpen size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Select Subject</h2>
                                <p className="text-sm text-gray-500">Choose a subject for {examType}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:border-indigo-300"
                        />
                    </div>
                </div>

                {/* Subjects List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredSubjects.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">No subjects found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredSubjects.map((subject, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedSubject(subject)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all group ${selectedSubject === subject
                                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-bold text-lg mb-1 ${selectedSubject === subject ? 'text-indigo-900' : 'text-gray-700'}`}>
                                            {subject}
                                        </h3>
                                        {selectedSubject === subject && (
                                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center animate-in fade-in zoom-in spin-in-180 duration-300">
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                    <p className="text-sm text-gray-500 font-medium">
                        {selectedSubject ? <span className="text-indigo-600">Selected: {selectedSubject}</span> : 'Select a subject to continue'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedSubject}
                            className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm ${selectedSubject
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200 hover:shadow-lg transform hover:-translate-y-0.5'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Start Test <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionModal;
