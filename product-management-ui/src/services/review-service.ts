import axios from 'axios';
import type { PurchaseRequestDto } from './purchase-request-service';

const API_URL = '/api/review';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const reviewService = {
    async getPendingReviews(): Promise<PurchaseRequestDto[]> {
        const response = await axios.get<PurchaseRequestDto[]>(`${API_URL}/pending`, { headers: getAuthHeaders() });
        return response.data;
    },

    async getApprovedReviews(): Promise<PurchaseRequestDto[]> {
        const response = await axios.get<PurchaseRequestDto[]>(`${API_URL}/approved`, { headers: getAuthHeaders() });
        return response.data;
    },

    async getRejectedReviews(): Promise<PurchaseRequestDto[]> {
        const response = await axios.get<PurchaseRequestDto[]>(`${API_URL}/rejected`, { headers: getAuthHeaders() });
        return response.data;
    },

    async getById(id: string): Promise<PurchaseRequestDto> {
        const response = await axios.get<PurchaseRequestDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },

    async approve(id: string, reviewerComment: string): Promise<PurchaseRequestDto> {
        const response = await axios.put<PurchaseRequestDto>(
            `${API_URL}/${id}/approve`,
            { reviewerComment },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    async reject(id: string, reviewerComment: string): Promise<PurchaseRequestDto> {
        const response = await axios.put<PurchaseRequestDto>(
            `${API_URL}/${id}/reject`,
            { reviewerComment },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    async updateComment(id: string, reviewerComment: string): Promise<PurchaseRequestDto> {
        const response = await axios.put<PurchaseRequestDto>(
            `${API_URL}/${id}/comment`,
            { reviewerComment },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },
};
