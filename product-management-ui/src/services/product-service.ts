import axios from 'axios';

const API_URL = '/api/products';

export interface ProductDto {
    id: string;
    productCode: string;
    productName?: string | null;
    category: string;
    unit: string;
    price: number;
    inStock: number;
    minInStock: number;
    providerId: string;
    providerName: string;
    status: boolean;
    inStockStatus: number;
    inStockStatusText: string;
}

export interface CreateProductRequest {
    productCode: string;
    productName?: string | null;
    category: string;
    unit: string;
    price: number;
    inStock: number;
    minInStock: number;
    providerId: string;
}

export interface UpdateProductRequest {
    productCode: string;
    productName?: string | null;
    category: string;
    unit: string;
    price: number;
    inStock: number;
    minInStock: number;
    providerId: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const productService = {
    async getAll(): Promise<ProductDto[]> {
        const response = await axios.get<ProductDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<ProductDto> {
        const response = await axios.get<ProductDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async create(data: CreateProductRequest): Promise<ProductDto> {
        const response = await axios.post<ProductDto>(API_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async update(id: string, data: UpdateProductRequest): Promise<ProductDto> {
        const response = await axios.put<ProductDto>(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    },
};
