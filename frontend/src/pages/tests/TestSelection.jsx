import React from 'react';
import { BookOpen, Target, BrainCircuit, Shuffle } from 'lucide-react';

const TestSelection = ({ onSelectTest }) => {
    const testTypes = [
        {
            id: 'Full Test',
            title: 'Full Mock Test',
            description: 'Simulate a complete exam environment. Covers all subjects.',
            icon: BookOpen,
            color: 'bg-purple-50 text-purple-600',
            borderColor: 'hover:border-purple-200'
        },
        {
            id: 'Subject Test',
            title: 'Subject Wise',
            description: 'Focus on specific subjects to improve weak areas.',
            icon: Target,
            color: 'bg-blue-50 text-blue-600',
            borderColor: 'hover:border-blue-200'
        },
        {
            id: 'AI-Recommended',
            title: 'AI Recommended',
            description: 'Personalized test based on your past performance.',
            icon: BrainCircuit,
            color: 'bg-emerald-50 text-emerald-600',
            borderColor: 'hover:border-emerald-200',
            recommended: true
        },
        {
            id: 'Random Test',
            title: 'Quick Random',
            description: 'Random questions for quick practice.',
            icon: Shuffle,
            color: 'bg-orange-50 text-orange-600',
            borderColor: 'hover:border-orange-200'
        }
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Select Test Mode</h2>
                <p className="text-gray-500 mt-2">Choose how you want to challenge yourself today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testTypes.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => onSelectTest(type.id)}
                        className={`relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${type.borderColor}`}
                    >
                        {type.recommended && (
                            <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                RECOMMENDED
                            </span>
                        )}

                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${type.color}`}>
                            <type.icon size={28} />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">{type.title}</h3>
                        <p className="text-gray-500">{type.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestSelection;
