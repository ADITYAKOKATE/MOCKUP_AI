import React, { useState, useEffect } from 'react';
import { X, Check, Dna, Clock, Target, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { METADATA } from '../../utils/constants';

const CustomTestModal = ({ isOpen, onClose, examType, onStartTest }) => {
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [questionCount, setQuestionCount] = useState(20);
    const [duration, setDuration] = useState(30);
    const [questionTypes, setQuestionTypes] = useState(['MCQ', 'MSQ', 'NAT']);

    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [subjectTopicMap, setSubjectTopicMap] = useState({});

    // Parse Metadata for the current Exam
    useEffect(() => {
        if (!examType || !isOpen) return;

        // Robust matching logic
        const normalize = (s) => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); // "JEE Main" -> "JEEMAIN"
        const target = normalize(examType);

        // 1. Try fuzzy match against Keys
        const keys = Object.keys(METADATA);
        let metaKey = keys.find(k => normalize(k) === target);

        // 2. Special Case: GATE (examType might be "GATE CS" but key is "GATE")
        if (!metaKey && target.startsWith('GATE')) {
            metaKey = 'GATE';
        }

        console.log(`[CustomTestModal] Exam="${examType}" -> Target="${target}" -> ResolvedKey="${metaKey}"`);


        if (metaKey && METADATA[metaKey]) {
            const data = METADATA[metaKey];
            let subList = [];
            let topicMap = {};

            // GATE has nested branches (CS, EC...)
            if (metaKey === 'GATE') {
                // Infer branch from examType string if possible, or show all?
                // For simplicity, let's assume we flatten all available branches or use a specific one if detected
                // If user has "GATE CS", use CS.
                const branch = examType.split(' ')[1]; // "CS"
                if (branch && data[branch]) {
                    subList = Object.keys(data[branch]);
                    topicMap = data[branch]; // Key: Subject -> Value: Array[Topics]
                } else if (!branch) {
                    // Fallback to CS defaults if unspecified (Or handle better URI state)
                    if (data.CS) {
                        subList = Object.keys(data.CS);
                        topicMap = data.CS;
                    }
                }
            } else {
                // JEE/NEET Structure: Key: Subject -> Value: Array[Topics]
                subList = Object.keys(data);
                topicMap = data;
            }

            setAvailableSubjects(subList);
            setSubjectTopicMap(topicMap);
        }
    }, [examType, isOpen]);

    const toggleSubject = (subject) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(prev => prev.filter(s => s !== subject));
            // Also deselect topics for this subject?
            // Maybe keep them but they won't apply if subject matches
        } else {
            setSelectedSubjects(prev => [...prev, subject]);
            setExpandedSubjects(prev => ({ ...prev, [subject]: true })); // Auto expand
        }
    };

    const toggleTopic = (topic) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(prev => prev.filter(t => t !== topic));
        } else {
            setSelectedTopics(prev => [...prev, topic]);
        }
    };

    const toggleExpand = (subject) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subject]: !prev[subject]
        }));
    };

    const handleStart = () => {
        onStartTest({
            subjects: selectedSubjects,
            topics: selectedTopics,
            count: questionCount,
            duration: duration,
            questionTypes: questionTypes
        });
    };

    // Calculate All Selects
    const isAllTopicsSelected = (subject) => {
        const topics = subjectTopicMap[subject] || [];
        if (topics.length === 0) return false;
        return topics.every(t => selectedTopics.includes(t));
    };

    const toggleAllTopics = (subject) => {
        const topics = subjectTopicMap[subject] || [];
        if (isAllTopicsSelected(subject)) {
            // Deselect all
            setSelectedTopics(prev => prev.filter(t => !topics.includes(t)));
        } else {
            // Select all
            const newTopics = topics.filter(t => !selectedTopics.includes(t));
            setSelectedTopics(prev => [...prev, ...newTopics]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-200">
                            <Dna className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Custom Drill</h2>
                            <p className="text-gray-500 text-sm">Design your perfect practice session</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <X className="text-gray-400 hover:text-gray-600" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Scope Selection */}
                    <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            1. Select Scope
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                {selectedSubjects.length} selected
                            </span>
                        </h3>

                        <div className="space-y-3">
                            {availableSubjects.length === 0 && (
                                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200 text-sm">
                                    <div className="font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                        No subjects found
                                    </div>
                                    <p className="mt-1">
                                        Could not load subjects for <strong>{examType}</strong>.
                                        Please try re-selecting the exam from the dashboard.
                                    </p>
                                </div>
                            )}
                            {availableSubjects.map(sub => {
                                const isSelected = selectedSubjects.includes(sub);
                                const isExpanded = expandedSubjects[sub];
                                const topics = subjectTopicMap[sub] || [];
                                const selectedTopicsCount = topics.filter(t => selectedTopics.includes(t)).length;

                                return (
                                    <div key={sub} className={`rounded-xl border transition-all ${isSelected ? 'border-violet-200 bg-violet-50/50' : 'border-gray-200 hover:border-violet-100'}`}>
                                        <div className="flex items-center p-3 gap-3">
                                            <button
                                                onClick={() => toggleSubject(sub)}
                                                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected
                                                    ? 'bg-violet-600 border-violet-600'
                                                    : 'border-gray-300 bg-white hover:border-violet-400'}`}
                                            >
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </button>

                                            <span className={`font-semibold flex-1 ${isSelected ? 'text-violet-900' : 'text-gray-700'}`}>
                                                {sub}
                                            </span>

                                            {topics.length > 0 && isSelected && (
                                                <button onClick={() => toggleExpand(sub)} className="p-1 hover:bg-violet-100 rounded text-violet-400">
                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </button>
                                            )}
                                        </div>

                                        {/* Nested Topics */}
                                        {isSelected && isExpanded && topics.length > 0 && (
                                            <div className="px-3 pb-3 ml-8 border-l-2 border-violet-100 pl-4 space-y-2 animate-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between text-xs text-violet-600 mb-2">
                                                    <span>Select Topics ({selectedTopicsCount}/{topics.length})</span>
                                                    <button onClick={() => toggleAllTopics(sub)} className="hover:underline font-medium">
                                                        {isAllTopicsSelected(sub) ? 'None' : 'All'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {topics.map(topic => {
                                                        const isTopicSel = selectedTopics.includes(topic);
                                                        return (
                                                            <div
                                                                key={topic}
                                                                onClick={() => toggleTopic(topic)}
                                                                className={`flex items-center gap-2 cursor-pointer text-sm p-1.5 rounded-lg transition-colors ${isTopicSel ? 'bg-violet-100 text-violet-900' : 'text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isTopicSel ? 'bg-violet-500 border-violet-500' : 'border-gray-300'
                                                                    }`}>
                                                                    {isTopicSel && <Check size={10} className="text-white" />}
                                                                </div>
                                                                <span className="truncate">{topic}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Configuration */}
                    <div className="md:w-80 bg-gray-50 p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">2. Configuration</h3>

                            {/* Question Count */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                        <Target size={18} className="text-violet-500" />
                                        Questions
                                    </div>
                                    <span className="bg-white px-3 py-1 rounded-lg border border-gray-200 font-mono font-bold text-violet-600">
                                        {questionCount}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="5"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-2">
                                    <span>5</span>
                                    <span>25</span>
                                    <span>50</span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                        <Clock size={18} className="text-violet-500" />
                                        Duration
                                    </div>
                                    <span className="bg-white px-3 py-1 rounded-lg border border-gray-200 font-mono font-bold text-violet-600">
                                        {duration}m
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="180"
                                    step="10"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-2">
                                    <span>10m</span>
                                    <span>90m</span>
                                    <span>3h</span>
                                </div>
                            </div>

                            {/* Question Types */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                        <div className="p-1 bg-violet-100 rounded">
                                            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        Question Types
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {['MCQ', 'MSQ', 'NAT'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                if (questionTypes.includes(type)) {
                                                    // Don't allow deselecting if it's the last one
                                                    if (questionTypes.length > 1) {
                                                        setQuestionTypes(prev => prev.filter(t => t !== type));
                                                    }
                                                } else {
                                                    setQuestionTypes(prev => [...prev, type]);
                                                }
                                            }}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${questionTypes.includes(type)
                                                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="space-y-3">
                            <div className="p-4 bg-violet-100 rounded-xl border border-violet-200">
                                <h4 className="font-bold text-violet-900 text-sm mb-1">Summary</h4>
                                <ul className="text-xs text-violet-700 space-y-1">
                                    <li>• {selectedSubjects.length} Subjects Selected</li>
                                    <li>• {selectedTopics.length > 0 ? `${selectedTopics.length} Specific Topics` : 'All Topics in Subjects'}</li>
                                    <li>• {questionCount} Questions</li>
                                    <li>• {duration} Minutes</li>
                                </ul>
                            </div>
                            <button
                                onClick={handleStart}
                                disabled={selectedSubjects.length === 0}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedSubjects.length > 0
                                    ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Wand2 size={20} />
                                Start Custom Drill
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomTestModal;
