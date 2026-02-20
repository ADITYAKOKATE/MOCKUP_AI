import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import Layout from "./layouts/Layout";

// Pages Imports
import Dashboard from "./pages/Dashboard/Dashboard";
import Tests from "./pages/tests/Tests";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Settings from "./pages/settings/Settings";

import TestHistory from "./pages/tests/TestHistory";
import TestReview from "./pages/tests/TestReview";
import Analysis from "./pages/analysis/Analysis";
import PerformanceAnalysis from "./pages/analysis/PerformanceAnalysis";
import AIRecommendationTests from "./pages/aiInsights/AIRecommendationTests";

import ChatPage from "./pages/Assistant/ChatPage";

// Temporary placeholders 
const MyTestsPlaceholder = () => <div className="p-8">My Tests Page Coming Soon</div>;

import { useAuth } from "./context/AuthContext";
import { Outlet } from "react-router-dom";

// Protected Route Component (Internal)
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tests" element={<Tests />} />
                    <Route path="my-tests" element={<TestHistory />} />
                    <Route path="analysis" element={<PerformanceAnalysis />} />
                    <Route path="test-analysis" element={<Analysis />} />
                    <Route path="ai-recommendations" element={<AIRecommendationTests />} />
                    <Route path="ai-tutor" element={<ChatPage />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Independent Protected Routes (No Main Layout) */}
                <Route path="tests/review/:attemptId" element={<TestReview />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;