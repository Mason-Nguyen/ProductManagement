import axios from 'axios';

const API_URL = '/api/purchaseproductorders';

export interface PurchaseProductOrderDto {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    category: string;
    unit: string;
    price: number;
    inStock: number;
    minInStock: number;
    quantityRequest: number;
    purchaseOrderId: string;
    purchaseOrderTitle: string;
    importedDate: string | null;
    quantity: number;
    checkedUserId: string | null;
    checkedUserName: string | null;
    comment: string | null;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const purchaseProductOrderService = {
    async getByOrderId(purchaseOrderId: string): Promise<PurchaseProductOrderDto[]> {
        const response = await axios.get<PurchaseProductOrderDto[]>(`${API_URL}/by-order/${purchaseOrderId}`, { headers: getAuthHeaders() });
        return response.data;
    },
};
