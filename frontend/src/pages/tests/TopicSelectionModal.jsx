import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight, Hash, Target } from 'lucide-react';
import { getSubjectTopics } from '../../utils/constants';

const TopicSelectionModal = ({ isOpen, onClose, onSelect, subject, examType }) => {
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedTopic(null);
            setSearchTerm('');
        }
    }, [isOpen, subject]);

    if (!isOpen) return null;

    // Get topics for the selected subject
    const topics = getSubjectTopics(examType, subject) || [];

    const filteredTopics = topics.filter(topic =>
        topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirm = () => {
        if (selectedTopic) {
            onSelect(selectedTopic);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-teal-50/50 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Target className="text-teal-600" />
                            Select Topic
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 font-medium">
                            Choose a topic from <span className="text-teal-700 font-bold">{subject}</span> to practice
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Search & List */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all mb-4 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTopics.length > 0 ? (
                            filteredTopics.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setSelectedTopic(topic)}
                                    className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md relative overflow-hidden ${selectedTopic === topic
                                        ? 'border-teal-600 bg-teal-50'
                                        : 'border-white bg-white hover:border-teal-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${selectedTopic === topic ? 'bg-teal-200 text-teal-800' : 'bg-gray-100 text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                                                <Hash size={18} />
                                            </div>
                                            <span className={`font-bold ${selectedTopic === topic ? 'text-teal-900' : 'text-gray-700'}`}>
                                                {topic}
                                            </span>
                                        </div>
                                        {selectedTopic === topic && (
                                            <div className="text-teal-600 animate-in zoom-in">
                                                <CheckCircle size={20} fill="currentColor" className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                <BookOpen className="mx-auto mb-3 opacity-20" size={48} />
                                <p>No topics found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTopic}
                        className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${selectedTopic
                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200 hover:translate-y-0.5'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Start Topic Test
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Accessor for the icon, import was missing in previous snippet
import { CheckCircle } from 'lucide-react';

export default TopicSelectionModal;
