import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

const TopicSelectionModal = ({ isOpen, onClose, examName, onTopicSelect }) => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(null);

    useEffect(() => {
        if (isOpen && examName) {
            fetchTopics();
        }
    }, [isOpen, examName]);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const data = await api.getTopicsByExam(examName);
            setTopics(data);
        } catch (error) {
            console.error('Failed to load topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTopics = topics.filter(t =>
        t.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirm = () => {
        if (selectedTopic) {
            onTopicSelect(selectedTopic);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Select Topic</h2>
                                <p className="text-sm text-gray-500">Choose a topic to practice</p>
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
                            placeholder="Search topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Topics List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                        </div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">No topics found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredTopics.map((topicData, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedTopic(topicData.topic)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all ${selectedTopic === topicData.topic
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">{topicData.topic}</h3>
                                            <p className="text-xs text-gray-500">{topicData.count} questions</p>
                                        </div>
                                        {selectedTopic === topicData.topic && (
                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {selectedTopic ? `Selected: ${selectedTopic}` : 'Select a topic to continue'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedTopic}
                            className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${selectedTopic
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
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

export default TopicSelectionModal;
