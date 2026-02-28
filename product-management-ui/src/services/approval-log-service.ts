import axios from 'axios';

const API_URL = '/api/approvallogs';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export interface ApprovalLogDto {
    id: string;
    requestId: string;
    requestTitle: string;
    approverId: string;
    approverName: string;
    action: number;
    actionText: string;
    approverComment: string | null;
    logTime: string;
}

export const approvalLogService = {
    async getAll(): Promise<ApprovalLogDto[]> {
        const response = await axios.get<ApprovalLogDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getByRequestId(requestId: string): Promise<ApprovalLogDto[]> {
        const response = await axios.get<ApprovalLogDto[]>(`${API_URL}/request/${requestId}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    },
};
