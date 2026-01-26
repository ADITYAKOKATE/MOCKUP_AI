import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import FormField from '../../components/ui/FormField';

import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData.email, formData.password);
            toast.success("Successfully logged in!");
            navigate('/');
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to login");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to access your Portal to Ultimate Exam Prep!</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        label="Password"
                        type="password"
                        name="password"
                        icon={Lock}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 cursor-pointer"
                    >
                        Sign In
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-600">
                    Don't have an account? {' '}
                    <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                        Sign up here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
