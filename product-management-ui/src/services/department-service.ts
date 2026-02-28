import axios from 'axios';

const API_URL = '/api/departments';

export interface DepartmentDto {
    id: string;
    name: string;
}

export interface CreateDepartmentRequest {
    name: string;
}

export interface UpdateDepartmentRequest {
    name: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const departmentService = {
    async getAll(): Promise<DepartmentDto[]> {
        const response = await axios.get<DepartmentDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<DepartmentDto> {
        const response = await axios.get<DepartmentDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async create(data: CreateDepartmentRequest): Promise<DepartmentDto> {
        const response = await axios.post<DepartmentDto>(API_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async update(id: string, data: UpdateDepartmentRequest): Promise<DepartmentDto> {
        const response = await axios.put<DepartmentDto>(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    },
};
