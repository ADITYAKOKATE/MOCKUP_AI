import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw, ZoomIn, RefreshCw } from 'lucide-react';


// Canvas Utilities
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getRadianAngle = (degreeValue) => {
    return (degreeValue * Math.PI) / 180;
};

const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
};

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    return canvas.toDataURL('image/jpeg');
};

const CropModal = ({ imageSrc, onCancel, onCropComplete, open }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation) => {
        setRotation(rotation);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Edit Profile Photo</h3>
                    <button 
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative h-64 sm:h-80 w-full bg-slate-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        onRotationChange={onRotationChange}
                        showGrid={true}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 space-y-6">
                    {/* Zoom Control */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1"><ZoomIn size={14} /> Zoom</span>
                            <span>{Math.round(zoom * 100) - 100}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    {/* Rotation Control */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1"><RotateCw size={14} /> Rotate</span>
                            <span>{rotation}°</span>
                        </div>
                        <input
                            type="range"
                            value={rotation}
                            min={0}
                            max={360}
                            step={1}
                            aria-labelledby="Rotation"
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            title="Reset Edits"
                        >
                            <RefreshCw size={16} />
                            Reset
                        </button>
                        <div className="flex-1"></div>
                        <button
                            onClick={onCancel}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition-all active:scale-95"
                        >
                            <Check size={16} />
                            Save Photo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropModal;
