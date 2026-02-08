import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a global flag to prevent multiple logout/refresh attempts
let isLoggingOut = false;

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !isLoggingOut) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshResponse = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (refreshResponse.data.token) {
          // Update the token in store
          const { setAuth } = useAuthStore.getState();
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            setAuth(currentUser, refreshResponse.data.token);
          }

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user (only once)
        if (!isLoggingOut) {
          isLoggingOut = true;
          const { logout } = useAuthStore.getState();
          logout();
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access denied: Insufficient permissions');
    } else if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found');
    } else if (error.response?.status && error.response.status >= 500) {
      // Server error
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, config = {}) =>
    apiClient.get<T>(url, config).then(response => response.data),

  post: <T = any>(url: string, data = {}, config = {}) =>
    apiClient.post<T>(url, data, config).then(response => response.data),

  put: <T = any>(url: string, data = {}, config = {}) =>
    apiClient.put<T>(url, data, config).then(response => response.data),

  patch: <T = any>(url: string, data = {}, config = {}) =>
    apiClient.patch<T>(url, data, config).then(response => response.data),

  delete: <T = any>(url: string, config = {}) =>
    apiClient.delete<T>(url, config).then(response => response.data),
};

// Notification APIs
export const notificationAPI = {
  // Get user notifications
  getNotifications: (params?: any) =>
    apiClient.get('/notifications', { params }),

  // Get notification count
  getNotificationCount: () =>
    apiClient.get('/notifications/count'),

  // Mark notifications as read
  markAsRead: (notificationIds?: string[]) =>
    apiClient.patch('/notifications/read', { notificationIds }),

  // Mark all notifications as read
  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all'),

  // Mark single notification as read
  markSingleAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  // Delete notifications
  deleteNotifications: (notificationIds?: string[]) =>
    apiClient.delete('/notifications', { data: { notificationIds } }),

  // Delete single notification
  deleteNotification: (id: string) =>
    apiClient.delete(`/notifications/${id}`),

  // Create system notification (Admin/TPO only)
  createSystemNotification: (data: any) =>
    apiClient.post('/notifications/system', data),

  // Create application notification (Company/TPO only)
  createApplicationNotification: (data: any) =>
    apiClient.post('/notifications/application', data),

  // Create drive notification (Company/TPO only)
  createDriveNotification: (data: any) =>
    apiClient.post('/notifications/drive', data)
};

// User profile management APIs
export const userProfileAPI = {
  // Add skill
  addSkill: (skill: string) =>
    apiClient.post('/users/skills', { skill }),

  // Remove skill
  removeSkill: (skill: string) =>
    apiClient.delete(`/users/skills/${encodeURIComponent(skill)}`),

  // Add project
  addProject: (project: any) =>
    apiClient.post('/users/projects', project),

  // Update project
  updateProject: (id: string, project: any) =>
    apiClient.put(`/users/projects/${id}`, project),

  // Remove project
  removeProject: (id: string) =>
    apiClient.delete(`/users/projects/${id}`),

  // Update profile
  updateProfile: (id: string, data: any) =>
    apiClient.put(`/users/${id}`, data),

  // Get current user profile
  getMe: () =>
    apiClient.get('/users/me'),
};

export default apiClient;