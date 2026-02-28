import axios from 'axios';

const API_URL = '/api/providers';

export interface ProviderDto {
    id: string;
    providerName: string;
    taxIdentification: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
}

export interface CreateProviderRequest {
    providerName: string;
    taxIdentification: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
}

export interface UpdateProviderRequest {
    providerName: string;
    taxIdentification: string;
    address: string;
    contactPerson: string;
    phoneNumber: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const providerService = {
    async getAll(): Promise<ProviderDto[]> {
        const response = await axios.get<ProviderDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<ProviderDto> {
        const response = await axios.get<ProviderDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async create(data: CreateProviderRequest): Promise<ProviderDto> {
        const response = await axios.post<ProviderDto>(API_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async update(id: string, data: UpdateProviderRequest): Promise<ProviderDto> {
        const response = await axios.put<ProviderDto>(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },
};
