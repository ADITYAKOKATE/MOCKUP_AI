import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

/**
 * FormField Component
 * 
 * A versatile form input component that supports various field types.
 * 
 * Supported `type` props:
 * - 'text': Standard text input.
 * - 'email': Email input field.
 * - 'password': Password field with toggle visibility button.
 * - 'select': Dropdown selection field.
 * - 'number': Numeric input field.
 * - 'date': Date picker field.
 * - ...and other standard HTML input types.
 */
const FormField = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    icon: Icon,
    options = [],
    required = false,
    disabled = false,
    className = '',
    error = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const isDropdown = type === 'select';

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div className="relative group">
                {/* Left Icon */}
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                        <Icon size={18} />
                    </div>
                )}

                {isDropdown ? (
                    <div className="relative">
                        <select
                            name={name}
                            value={value}
                            onChange={onChange}
                            disabled={disabled}
                            required={required}
                            className={`
                                w-full rounded-xl border border-gray-300 bg-white 
                                py-2.5 px-4 outline-none transition-all duration-200
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                                appearance-none cursor-pointer
                                ${Icon ? 'pl-10' : ''}
                                pr-10
                                ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}
                            `}
                            {...props}
                        >
                            <option value="" disabled>Select {label || 'Option'}</option>
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        
                        {/* Custom Dropdown Arrow */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 group-focus-within:rotate-180">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                ) : (
                    <input
                        type={inputType}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        className={`
                            w-full rounded-xl border border-gray-300 bg-white 
                            py-2.5 px-4 outline-none transition-all duration-200
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                            ${Icon ? 'pl-10' : ''}
                            ${isPassword ? 'pr-10' : ''}
                            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}
                        `}
                        {...props}
                    />
                )}

                {/* Password Toggle Button */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;
