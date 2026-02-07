import apiClient from './apiClient';

interface UploadOfferData {
    company: string;
    package: string;
    jobId?: string;
    file: File;
}

interface VerifyOfferData {
    status: 'Verified' | 'Rejected';
    remarks?: string;
}

export const offerAPI = {
    // Student: Upload Offer
    uploadOffer: async (data: UploadOfferData) => {
        const formData = new FormData();
        formData.append('company', data.company);
        formData.append('package', data.package);
        if (data.jobId) formData.append('job', data.jobId);
        formData.append('offerLetter', data.file);

        const response = await apiClient.post('/offers/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Student: Get My Offers
    getMyOffers: async () => {
        const response = await apiClient.get('/offers/my-offers');
        return response.data;
    },

    // Admin/TPO: Get All Offers
    getAllOffers: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await apiClient.get('/offers/all', { params });
        return response.data;
    },

    // Admin/TPO: Verify Offer
    verifyOffer: async (id: string, data: VerifyOfferData) => {
        const response = await apiClient.put(`/offers/${id}/verify`, data);
        return response.data;
    },

    // Student: Delete Offer
    deleteOffer: async (id: string) => {
        const response = await apiClient.delete(`/offers/${id}`);
        return response.data;
    }
};
