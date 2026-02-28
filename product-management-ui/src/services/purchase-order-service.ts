import axios from 'axios';

const API_URL = '/api/purchaseorders';

export interface PurchaseOrderDto {
    id: string;
    title: string;
    description: string;
    urgent: number;
    status: number;
    statusText: string;
    reviewerId: string;
    reviewerName: string;
    approverId: string;
    approverName: string;
    createdUserId: string;
    createdUserName: string;
    createdDate: string;
    modifiedDate: string;
    reviewerComment: string | null;
    orderingComment: string | null;
    totalPrice: number;
    purchaseRequestId: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const purchaseOrderService = {
    async getAll(): Promise<PurchaseOrderDto[]> {
        const response = await axios.get<PurchaseOrderDto[]>(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<PurchaseOrderDto> {
        const response = await axios.get<PurchaseOrderDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async existsForRequest(purchaseRequestId: string): Promise<boolean> {
        const response = await axios.get<{ exists: boolean }>(`${API_URL}/exists-for-request/${purchaseRequestId}`, { headers: getAuthHeaders() });
        return response.data.exists;
    },

    async convertFromRequest(purchaseRequestId: string): Promise<PurchaseOrderDto> {
        const response = await axios.post<PurchaseOrderDto>(`${API_URL}/convert/${purchaseRequestId}`, {}, { headers: getAuthHeaders() });
        return response.data;
    },

    async setOrdering(id: string): Promise<PurchaseOrderDto> {
        const response = await axios.put<PurchaseOrderDto>(`${API_URL}/${id}/set-ordering`, {}, { headers: getAuthHeaders() });
        return response.data;
    },

    async cancel(id: string): Promise<PurchaseOrderDto> {
        const response = await axios.put<PurchaseOrderDto>(`${API_URL}/${id}/cancel`, {}, { headers: getAuthHeaders() });
        return response.data;
    },

    async importProducts(orderId: string, items: { purchaseProductOrderId: string; quantity: number }[]): Promise<PurchaseOrderDto> {
        const response = await axios.post<PurchaseOrderDto>(`${API_URL}/${orderId}/import`, items, { headers: getAuthHeaders() });
        return response.data;
    },
};
