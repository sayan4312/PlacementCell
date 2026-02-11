import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/reports`;


const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return { headers: { Authorization: `Bearer ${user.token}` } };
};

export const getPlacementStats = async () => {
    const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
    return response.data;
};

export const getCompanyStats = async () => {
    const response = await axios.get(`${API_URL}/company-stats`, getAuthHeader());
    return response.data;
};

export const getStudentReportData = async (department?: string, batch?: string) => {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (batch) params.append('batch', batch);

    const response = await axios.get(`${API_URL}/export-students?${params.toString()}`, getAuthHeader());
    return response.data;
};
