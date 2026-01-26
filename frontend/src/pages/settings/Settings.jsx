import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Camera, Save, User, Mail, Shield, BookOpen, GitBranch } from 'lucide-react';
import FormField from '../../components/ui/FormField';
import Tooltip from '../../components/ui/Tooltip';



import toast from 'react-hot-toast';

import CropModal from '../../components/CropModal';
import { EXAM_OPTIONS, BRANCH_OPTIONS } from '../../utils/constants';
import { dataService } from '../../services/data.service';

// ... imports ...

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    // const [msg, setMsg] = useState({ type: '', text: '' }); // Removing local msg state in favor of toast
    const [formData, setFormData] = useState({
        name: user?.profile?.name || user?.name || '',
        profileImage: user?.profile?.profileImage || '',
        exams: user?.profile?.exams || []
    });

    // Crop Modal State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result);
                setCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input value
        e.target.value = '';
    };

    const handleCropComplete = async (croppedImage) => {
        setCropModalOpen(false);
        setTempImage(null);

        // Convert base64 to blob/file
        try {
            setUploading(true);
            const res = await fetch(croppedImage);
            const blob = await res.blob();
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

            const uploadRes = await dataService.uploadImage(file);
            const imageUrl = uploadRes.imageUrl;

            // Auto-save the new profile image to the backend
            const updatedData = { ...formData, profileImage: imageUrl };
            await api.updateProfile(localStorage.getItem('token'), updatedData);

            setFormData(prev => ({ ...prev, profileImage: imageUrl }));
            toast.success("Image updated successfully");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to update profile image");
        } finally {
            setUploading(false);
        }
    };

    const handleCropCancel = () => {
        setCropModalOpen(false);
        setTempImage(null);
    };

    const handleAddExam = () => {
        setFormData(prev => ({
            ...prev,
            exams: [...prev.exams, { examType: '', branch: '' }]
        }));
    };

    const handleRemoveExam = (index) => {
        if (formData.exams.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            exams: prev.exams.filter((_, i) => i !== index)
        }));
    };

    const handleExamChange = (index, field, value) => {
        setFormData(prev => {
            const newExams = [...prev.exams];
            newExams[index] = { ...newExams[index], [field]: value };
            // Reset branch if exam changes to non-GATE
            if (field === 'examType' && value !== 'GATE') {
                newExams[index].branch = '';
            }
            return { ...prev, exams: newExams };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.updateProfile(localStorage.getItem('token'), formData);

            // Check if performance schemas were initialized
            if (response.performanceInitialized && response.performanceInitialized.length > 0) {
                const successfulInits = response.performanceInitialized.filter(r => r.success);
                const failedInits = response.performanceInitialized.filter(r => !r.success);

                if (successfulInits.length > 0) {
                    const examNames = successfulInits.map(r => r.examName).join(', ');
                    toast.success(`Performance tracking initialized for: ${examNames}`);
                }

                if (failedInits.length > 0) {
                    const examNames = failedInits.map(r => r.examName).join(', ');
                    toast.error(`Failed to initialize tracking for: ${examNames}`);
                }
            }

            toast.success('Profile updated successfully');
            // Reload to refresh context
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6">


                {/* Profile Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                        <p className="text-gray-500 text-sm">Update your account details and profile image</p>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center sm:flex-row gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                    {uploading ? (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    ) : formData.profileImage ? (
                                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                                    <Camera size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="font-bold text-gray-900">Profile Photo</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                    Upload a new avatar. Recommended size: 400x400px.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                label="Display Name"
                                name="name"
                                icon={User}
                                placeholder="Your Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />

                            <div>
                                <FormField
                                    label="Email Address"
                                    type="email"
                                    name="email"
                                    icon={Mail}
                                    value={user?.email || ''}
                                    disabled
                                />
                                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                    <Shield size={10} /> Email cannot be changed
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exam Management Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">My Exams</h2>
                            <p className="text-gray-500 text-sm">Manage your target exams and branches</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddExam}
                            className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                        >
                            + Add Exam
                        </button>
                    </div>

                    <div className="p-6 md:p-8 space-y-4">
                        {formData.exams.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No exams added yet. Click "Add Exam" to get started.
                            </div>
                        ) : (
                            formData.exams.map((exam, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                    <div className="flex-1 w-full">
                                        <FormField
                                            label="Exam Type"
                                            type="select"
                                            value={exam.examType}
                                            onChange={(e) => handleExamChange(index, 'examType', e.target.value)}
                                            options={EXAM_OPTIONS}
                                            icon={BookOpen}
                                            required
                                        />
                                    </div>

                                    {exam.examType === 'GATE' && (
                                        <div className="flex-1 w-full">
                                            <FormField
                                                label="Branch"
                                                type="select"
                                                value={exam.branch}
                                                onChange={(e) => handleExamChange(index, 'branch', e.target.value)}
                                                options={BRANCH_OPTIONS}
                                                icon={GitBranch}
                                                required
                                            />
                                        </div>
                                    )}

                                    <Tooltip
                                        content={formData.exams.length <= 1 ? "At least one exam is required" : "Remove Exam"}
                                        className="self-end md:mb-3"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExam(index)}
                                            disabled={formData.exams.length <= 1}
                                            className={`transition-colors text-sm font-medium p-2 ${formData.exams.length <= 1
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-red-500 hover:text-red-700'
                                                }`}
                                        >
                                            Remove
                                        </button>
                                    </Tooltip>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200/50 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <CropModal
                open={cropModalOpen}
                imageSrc={tempImage}
                onCancel={handleCropCancel}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

export default Settings;
