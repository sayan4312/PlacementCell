import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { offerAPI } from '../../services/offerService';
import { toast } from 'react-toastify';

interface UploadOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const UploadOfferModal: React.FC<UploadOfferModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, reset } = useForm();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        if (!file) {
            toast.error('Please select an offer letter file');
            return;
        }

        setLoading(true);
        try {
            await offerAPI.uploadOffer({
                company: data.company,
                package: data.package,
                file: file
            });
            toast.success('Offer uploaded successfully!');
            reset();
            setFile(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload offer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card w-full max-w-md relative overflow-hidden shadow-2xl border border-white/20 bg-dark-bg/90"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-500/10 rounded-xl">
                                <Upload className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Upload Offer Letter</h2>
                                <p className="text-sm text-gray-400">Share your success with us!</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                                <input
                                    {...register('company', { required: true })}
                                    className="input-glass w-full bg-black/20 focus:bg-black/40"
                                    placeholder="e.g. Google, Microsoft"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Package (CTC)</label>
                                <input
                                    {...register('package', { required: true })}
                                    className="input-glass w-full bg-black/20 focus:bg-black/40"
                                    placeholder="e.g. 12 LPA"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Offer Letter (PDF/Image)</label>
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative bg-black/20">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {file ? (
                                        <div className="flex items-center justify-center gap-2 text-green-400">
                                            <FileText size={20} />
                                            <span className="text-sm font-medium">{file.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Click to upload or drag and drop</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? 'Uploading...' : (
                                    <>
                                        <CheckCircle size={18} /> Submit Offer
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default UploadOfferModal;
