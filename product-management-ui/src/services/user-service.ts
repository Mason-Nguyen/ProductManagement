import axios from 'axios';

const API_URL = '/api/users';
const ROLES_URL = '/api/roles';

export interface UserDto {
    id: string;
    username: string;
    email: string;
    phone: string;
    createdDate: string;
    status: boolean;
    roleId: string;
    roleName: string;
    departmentId?: string | null;
    departmentName?: string | null;
}

export interface RoleDto {
    id: string;
    roleName: string;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    phone: string;
    roleId: string;
    departmentId?: string | null;
}

export interface UpdateUserRequest {
    username: string;
    email: string;
    password?: string;
    phone: string;
    roleId: string;
    status: boolean;
    departmentId?: string | null;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const userService = {
    async getAll(): Promise<UserDto[]> {
        const response = await axios.get<UserDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<UserDto> {
        const response = await axios.get<UserDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async create(data: CreateUserRequest): Promise<UserDto> {
        const response = await axios.post<UserDto>(API_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async update(id: string, data: UpdateUserRequest): Promise<UserDto> {
        const response = await axios.put<UserDto>(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    },

    async getRoles(): Promise<RoleDto[]> {
        const response = await axios.get<RoleDto[]>(ROLES_URL, { headers: getAuthHeaders() });
        return response.data;
    },
};
