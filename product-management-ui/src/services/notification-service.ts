import axios from 'axios';

const API_URL = '/api/notifications';

export interface NotificationCountResponse {
    normalCount: number;
    urgentCount: number;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const notificationService = {
    async getPendingCount(): Promise<NotificationCountResponse> {
        const response = await axios.get<NotificationCountResponse>(
            `${API_URL}/pending-count`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },
};
