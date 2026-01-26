import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Initialize from localStorage or null
    const [selectedExam, setSelectedExam] = useState(() => localStorage.getItem('selectedExam') || null);

    useEffect(() => {
        // Check for token on load
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await api.getMe(token); 
                    setUser(userData);
                    
                    // Check if local selection is missing OR represents an invalid legacy ID (24 hex chars)
                    const localExam = localStorage.getItem('selectedExam');
                    const isInvalidId = localExam && /^[0-9a-fA-F]{24}$/.test(localExam);

                    if ((!localExam || isInvalidId) && userData?.profile?.exams?.length > 0) {
                        const firstExam = userData.profile.exams[0];
                        const examValue = firstExam.branch 
                            ? `${firstExam.examType}-${firstExam.branch}` 
                            : firstExam.examType;
                        // Use formatted string as value (Identifier for backend)
                        const val = examValue.toLowerCase().replace(/\s+/g, '-');
                        setSelectedExam(val);
                        // Explicitly update localStorage to fix the bad data immediately
                        localStorage.setItem('selectedExam', val);
                    }
                } catch (error) {
                    console.error("Auth Load Error", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // Persist selectedExam change
    useEffect(() => {
        if (selectedExam) {
            localStorage.setItem('selectedExam', selectedExam);
        }
    }, [selectedExam]);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        localStorage.setItem('token', data.token);
        const userData = await api.getMe(data.token);
        setUser(userData);
        
        // Initialize selectedExam if not set
        if (!selectedExam && userData?.profile?.exams?.length > 0) {
             const firstExam = userData.profile.exams[0];
             const examValue = firstExam.branch 
                 ? `${firstExam.examType}-${firstExam.branch}` 
                 : firstExam.examType;
             const val = examValue.toLowerCase().replace(/\s+/g, '-');
             setSelectedExam(val);
        }
    };

    const register = async (userData) => {
        const data = await api.register(userData);
        localStorage.setItem('token', data.token);
        const user = await api.getMe(data.token);
        setUser(user);
        // Initialize selectedExam on register (if applicable)
        if (user?.profile?.exams?.length > 0) {
             const firstExam = user.profile.exams[0];
             const examValue = firstExam.branch 
                 ? `${firstExam.examType}-${firstExam.branch}` 
                 : firstExam.examType;
             const val = examValue.toLowerCase().replace(/\s+/g, '-');
             setSelectedExam(val);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedExam');
        setUser(null);
        setSelectedExam(null);
    };

    const value = {
        user,
        loading,
        selectedExam,
        setSelectedExam,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
