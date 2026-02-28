import axios from 'axios';

const API_URL = '/api/approvalconfigs';

export interface ApprovalConfigDto {
    id: string;
    roleId: string;
    roleName: string;
    minAmount: number;
    maxAmount: number;
}

export interface CreateApprovalConfigRequest {
    roleId: string;
    minAmount: number;
    maxAmount: number;
}

export interface UpdateApprovalConfigRequest {
    roleId: string;
    minAmount: number;
    maxAmount: number;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const approvalConfigService = {
    async getAll(): Promise<ApprovalConfigDto[]> {
        const response = await axios.get<ApprovalConfigDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<ApprovalConfigDto> {
        const response = await axios.get<ApprovalConfigDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async create(data: CreateApprovalConfigRequest): Promise<ApprovalConfigDto> {
        const response = await axios.post<ApprovalConfigDto>(API_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async update(id: string, data: UpdateApprovalConfigRequest): Promise<ApprovalConfigDto> {
        const response = await axios.put<ApprovalConfigDto>(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    },
};
