import axios from 'axios';

const API_URL = '/api/loginlogs';

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export interface LoginLogDto {
    id: string;
    userId: string;
    userName: string;
    roleName: string;
    action: number;
    actionText: string;
    actionTime: string;
    ipAddress: string;
}

export const loginLogService = {
    async getRecent(): Promise<LoginLogDto[]> {
        const response = await axios.get<LoginLogDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },
};
