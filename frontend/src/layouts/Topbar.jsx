import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import FormField from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Topbar = ({ onMenuClick }) => {
    const { user, selectedExam, setSelectedExam } = useAuth();
    const [examOptions, setExamOptions] = useState([]);

    useEffect(() => {
        if (user?.profile?.exams?.length > 0) {
            const options = user.profile.exams.map(exam => {
                const label = exam.branch ? `${exam.examType}-${exam.branch}` : exam.examType;
                // Use formatted string as value only, no IDs
                const value = label.toLowerCase().replace(/\s+/g, '-');
                return { value, label };
            });
            setExamOptions(options);

            // If global selectedExam is not set but options exist, set it
            if (!selectedExam && options.length > 0) {
                setSelectedExam(options[0].value);
            }
        }
    }, [user, selectedExam, setSelectedExam]);

    const handleExamChange = (e) => {
        const newExam = e.target.value;
        const examLabel = examOptions.find(opt => opt.value === newExam)?.label || newExam;
        setSelectedExam(newExam);
        toast.success(`Switched to ${examLabel}`, {
            icon: '📚',
            duration: 2000
        });
    };

    return (
        <div className="flex-shrink-0 px-4 pt-4 z-30">
            <div className="h-16 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between px-4 relative">

                {/* Left: Mobile Menu & Exam Selector */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Trigger */}
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Exam Selector */}
                    <div className="w-48">
                        {examOptions.length > 0 ? (
                            <FormField
                                type="select"
                                name="examType"
                                value={selectedExam}
                                onChange={handleExamChange}
                                options={examOptions}
                                className="w-full"
                            />
                        ) : (
                            <Link
                                to="/settings"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                            >
                                + Add Exam Goal
                            </Link>
                        )}
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Add notification bell or profile quick access here if needed */}
                </div>
            </div>
        </div>
    );
};

export default Topbar;
