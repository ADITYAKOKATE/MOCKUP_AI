import React from 'react';
import { Book, HelpCircle } from 'lucide-react';

const FocusAreaWidget = ({ areas }) => {
    return (
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Focus Area</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Based on your last 3 mocks, you are losing 15+ marks in <span className="font-bold text-blue-600">TOC: Context-Free Languages</span>.
            </p>

            <div className="space-y-3">
                {areas.map((area) => (
                    <div key={area.id} className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${area.type === 'notes' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            {area.type === 'notes' ? <Book size={20} /> : <HelpCircle size={20} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{area.title}</h4>
                            <p className="text-xs text-gray-500">{area.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FocusAreaWidget;
