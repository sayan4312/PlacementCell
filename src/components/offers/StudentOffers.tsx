import { useEffect, useState } from 'react';
import { offerAPI } from '../../services/offerService';
import { CheckCircle, Clock, XCircle, ExternalLink, Plus, Trash2 } from 'lucide-react';
import UploadOfferModal from './UploadOfferModal';
import { toast } from 'react-toastify';

const StudentOffers = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const data = await offerAPI.getMyOffers();
            setOffers(data);
        } catch (error) {
            console.error('Failed to load offers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            toast.info('Click delete again to confirm', { autoClose: 3000 });
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            await offerAPI.deleteOffer(id);
            setOffers(prev => prev.filter(o => o._id !== id));
            toast.success('Offer deleted successfully');
            setDeleteConfirm(null);
        } catch (error: any) {
            console.error('Failed to delete offer', error);
            toast.error(error.response?.data?.message || 'Failed to delete offer');
            setDeleteConfirm(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Verified': return <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Verified</span>;
            case 'Rejected': return <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
            default: return <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Pending</span>;
        }
    };

    if (loading) return <div className="p-8 text-center">Loading offers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">My Offer Letters</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                >
                    <Plus size={16} /> Upload New Offer
                </button>
            </div>

            {offers.length === 0 ? (
                <div className="glass-card p-8 text-center text-gray-400">
                    <p>No offer letters uploaded yet. Got placed? Upload your offer now!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers.map((offer) => (
                        <div key={offer._id} className="glass-card p-4 hover:bg-glass-200 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ease-in-out">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{offer.company}</h3>
                                    <p className="text-indigo-400 font-medium">{offer.package}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(offer.status)}
                                    <button
                                        onClick={() => handleDelete(offer._id)}
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete Offer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-gray-500">Uploaded {new Date(offer.uploadedAt).toLocaleDateString()}</span>
                                <a
                                    href={offer.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-400 hover:text-white flex items-center gap-1 text-sm bg-white/5 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <ExternalLink size={14} /> View File
                                </a>
                            </div>
                            {offer.remarks && (
                                <div className="mt-2 text-xs text-red-400 bg-red-500/5 p-2 rounded">
                                    Reason: {offer.remarks}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <UploadOfferModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchOffers}
            />
        </div>
    );
};

export default StudentOffers;
