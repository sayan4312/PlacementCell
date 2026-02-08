import { useEffect, useState } from 'react';
import { offerAPI } from '../../services/offerService';
import { Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

const OfferVerificationTable = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');

    useEffect(() => {
        fetchOffers();
    }, [filter]);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const data = await offerAPI.getAllOffers(filter === 'All' ? '' : filter);
            setOffers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, status: 'Verified' | 'Rejected') => {
        let remarks: string | undefined;
        if (status === 'Rejected') {
            const input = prompt('Enter rejection reason:');
            if (input === null) return; // User cancelled
            remarks = input;
        }

        try {
            await offerAPI.verifyOffer(id, { status, remarks });
            toast.success(`Offer ${status} successfully`);
            fetchOffers(); // Refresh
        } catch (error) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Offer Verification</h2>
                <div className="flex gap-2">
                    {['Pending', 'Verified', 'Rejected', 'All'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-glass-100 text-gray-400 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Company</th>
                                <th className="p-4">Package</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Proof</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : offers.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No offers found</td></tr>
                            ) : (
                                offers.map((offer) => (
                                    <tr key={offer._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{offer.student?.studentId || offer.student?.rollNo || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{offer.student?.branch}</div>
                                        </td>
                                        <td className="p-4 text-gray-300">{offer.company}</td>
                                        <td className="p-4 text-indigo-400 font-medium">{offer.package}</td>
                                        <td className="p-4 text-gray-500 text-sm">{new Date(offer.uploadedAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <a
                                                href={offer.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                                            >
                                                <ExternalLink size={14} /> View
                                            </a>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${offer.status === 'Verified' ? 'bg-green-500/10 text-green-400' :
                                                offer.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {offer.status === 'Pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleVerify(offer._id, 'Verified')}
                                                        className="p-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                                                        title="Verify"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(offer._id, 'Rejected')}
                                                        className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                                        title="Reject"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OfferVerificationTable;
