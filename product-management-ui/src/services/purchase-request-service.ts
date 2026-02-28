import axios from 'axios';

const API_URL = '/api/purchaserequests';

export interface PurchaseProductDto {
    id: string;
    productId: string;
    productCode: string;
    productName?: string | null;
    category: string;
    unit: string;
    price: number;
    quantityRequest: number;
    lineTotal: number;
}

export interface PurchaseRequestDto {
    id: string;
    title: string;
    description: string;
    urgent: number;
    status: number;
    statusText: string;
    reviewerId: string | null;
    reviewerName: string | null;
    approverId: string | null;
    approverName: string | null;
    createdUserId: string;
    createdUserName: string;
    createdDate: string;
    modifiedDate: string;
    reviewerComment: string | null;
    totalPrice: number;
    products: PurchaseProductDto[];
}

export interface PurchaseProductItemDto {
    productId: string;
    quantityRequest: number;
}

export interface CreatePurchaseRequestDto {
    title: string;
    description: string;
    urgent: number;
    products: PurchaseProductItemDto[];
}

export interface UpdatePurchaseRequestDto {
    title: string;
    description: string;
    urgent: number;
    products: PurchaseProductItemDto[];
}

export interface AvailableProductDto {
    id: string;
    productCode: string;
    productName?: string | null;
    category: string;
    unit: string;
    price: number;
    inStock: number;
    minInStock: number;
    inStockStatus: number;
    inStockStatusText: string;
    providerName: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const purchaseRequestService = {
    async getAll(): Promise<PurchaseRequestDto[]> {
        const response = await axios.get<PurchaseRequestDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<PurchaseRequestDto> {
        const response = await axios.get<PurchaseRequestDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async create(data: CreatePurchaseRequestDto): Promise<PurchaseRequestDto> {
        const response = await axios.post<PurchaseRequestDto>(API_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async update(id: string, data: UpdatePurchaseRequestDto): Promise<PurchaseRequestDto> {
        const response = await axios.put<PurchaseRequestDto>(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    },

    async getAvailableProducts(excludeRequestId?: string): Promise<AvailableProductDto[]> {
        const params = excludeRequestId ? `?excludeRequestId=${excludeRequestId}` : '';
        const response = await axios.get<AvailableProductDto[]>(`${API_URL}/available-products${params}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async submit(id: string): Promise<PurchaseRequestDto> {
        const response = await axios.put<PurchaseRequestDto>(`${API_URL}/${id}/submit`, {}, { headers: getAuthHeaders() });
        return response.data;
    },
};
