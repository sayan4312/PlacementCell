import apiClient from './apiClient';

const API_URL = '/reports';

export const getPlacementStats = async () => {
    const response = await apiClient.get(`${API_URL}/stats`);
    return response.data;
};

export const getCompanyStats = async () => {
    const response = await apiClient.get(`${API_URL}/company-stats`);
    return response.data;
};

export const getStudentReportData = async (department?: string, batch?: string) => {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (batch) params.append('batch', batch);

    const response = await apiClient.get(`${API_URL}/export-students?${params.toString()}`);
    return response.data;
};
