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
    expectedTotalPrice: number | null;
    expectedDeliveryDate: string | null;
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

    async exportPdf(orderId: string): Promise<void> {
        const response = await axios.get(`${API_URL}/${orderId}/export-pdf`, {
            headers: getAuthHeaders(),
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'PurchaseOrder.pdf';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
            if (match) {
                fileName = decodeURIComponent(match[1].replace(/"/g, ''));
            }
        }

        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    async exportExcel(orderIds: string[]): Promise<void> {
        const response = await axios.post(`${API_URL}/export-excel`, { orderIds }, {
            headers: getAuthHeaders(),
            responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'PurchaseOrders.xlsx';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
            if (match) {
                fileName = decodeURIComponent(match[1].replace(/"/g, ''));
            }
        }

        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};
