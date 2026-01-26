import React, { useState } from 'react';
import { Layers, Search, ChevronDown, ChevronUp } from 'lucide-react';
import StrengthIndicator from './StrengthIndicator';

const TopicsTab = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [filterStrength, setFilterStrength] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');

    if (!data || !data.hasData || !data.groupedBySubject) {
        return (
            <div className="text-center py-20">
                <Layers size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Topic Data Available</h3>
                <p className="text-gray-600">Take some tests to see topic-wise analysis</p>
            </div>
        );
    }

    const subjects = Object.keys(data.groupedBySubject);

    const toggleSubject = (subject) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subject]: !prev[subject]
        }));
    };

    const filterTopics = (topics) => {
        return topics.filter(topic => {
            const matchesSearch = topic.topic.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterStrength === 'all' ||
                (filterStrength === 'weak' && topic.strength < 60) ||
                (filterStrength === 'moderate' && topic.strength >= 60 && topic.strength < 76) ||
                (filterStrength === 'strong' && topic.strength >= 76);
            return matchesSearch && matchesFilter;
        });
    };

    const displayedSubjects = filterSubject === 'all'
        ? Object.entries(data.groupedBySubject)
        : [[filterSubject, data.groupedBySubject[filterSubject]]];

    return (
        <div className="space-y-6">
            {/* Header with Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Subject Filter */}
                <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>

                {/* Strength Filter */}
                <select
                    value={filterStrength}
                    onChange={(e) => setFilterStrength(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Strengths</option>
                    <option value="weak">Weak (&lt; 60)</option>
                    <option value="moderate">Moderate (60-75)</option>
                    <option value="strong">Strong (≥ 76)</option>
                </select>
            </div>

            {/* Grouped Topics */}
            <div className="space-y-4">
                {displayedSubjects.map(([subject, topics]) => {
                    const filteredTopics = filterTopics(topics);
                    if (filteredTopics.length === 0) return null;

                    const isExpanded = expandedSubjects[subject] !== false; // Default expanded

                    return (
                        <div key={subject} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Subject Header */}
                            <button
                                onClick={() => toggleSubject(subject)}
                                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Layers size={20} className="text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-black text-gray-900">{subject}</h3>
                                        <p className="text-sm text-gray-500">{filteredTopics.length} topics</p>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {/* Topics List */}
                            {isExpanded && (
                                <div className="p-6 pt-0 space-y-3">
                                    {filteredTopics.map((topic, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="text-sm font-bold text-gray-900 flex-1">{topic.topic}</h4>
                                                <StrengthIndicator strength={topic.strength} size="sm" />
                                            </div>

                                            <div className="grid grid-cols-4 gap-3 text-center">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">Attempted</p>
                                                    <p className="text-sm font-black text-gray-900">{topic.attempted}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">Correct</p>
                                                    <p className="text-sm font-black text-green-600">{topic.correct}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">Accuracy</p>
                                                    <p className="text-sm font-black text-blue-600">{topic.accuracy}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">Avg Time</p>
                                                    <p className="text-sm font-black text-gray-900">{topic.avgTime}s</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopicsTab;
