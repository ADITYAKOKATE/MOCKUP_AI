import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, BookOpen, GitBranch, Lock } from 'lucide-react';
import FormField from '../../components/ui/FormField';
import { EXAM_OPTIONS, BRANCH_OPTIONS } from '../../utils/constants';

import toast from 'react-hot-toast';

const Signup = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', targetExam: '', branch: '' });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            const msg = "Passwords do not match";
            setError(msg);
            toast.error(msg);
            return;
        }
        
        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            toast.success("Account created successfully!");
            navigate('/');
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to create account");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'targetExam' && value !== 'GATE' ? { branch: '' } : {})
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-1">Join the Ultimate Exam Prep Platform!</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Full Name"
                        name="name"
                        icon={User}
                        placeholder="Rahul Sharma"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <FormField
                        label="Email Address"
                        type="email"
                        name="email"
                        icon={Mail}
                        placeholder="student@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <FormField
                        label="Target Exam"
                        type="select"
                        name="targetExam"
                        icon={BookOpen}
                        value={formData.targetExam}
                        onChange={handleChange}
                        options={EXAM_OPTIONS}
                        required
                    />

                    {formData.targetExam === 'GATE' && (
                        <FormField
                            label="Branch"
                            type="select"
                            name="branch"
                            icon={GitBranch}
                            value={formData.branch}
                            onChange={handleChange}
                            options={BRANCH_OPTIONS}
                            required
                        />
                    )}

                    <FormField
                        label="Password"
                        type="password"
                        name="password"
                        icon={Lock}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <FormField
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        icon={Lock}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 cursor-pointer"
                        >
                            Create Account
                        </button>
                    </div>
                </form>

                <p className="text-center mt-6 text-sm text-gray-600">
                    Already have an account? {' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
