import axios from 'axios';

const API_URL = '/api/auth';

export interface LoginResponse {
    token: string;
    username: string;
    email: string;
    role: string;
}

export interface UserData {
    token: string;
    username: string;
    email: string;
    role: string;
}


export const authService = {
    async login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResponse> {
        const response = await axios.post<LoginResponse>(`${API_URL}/login`, {
            email,
            password,
        });
        const data = response.data;

        // Store rememberMe flag in localStorage (always accessible)
        localStorage.setItem('rememberMe', String(rememberMe));

        // Store token and user in the appropriate storage
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify({
            username: data.username,
            email: data.email,
            role: data.role,
        }));

        return data;
    },

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },

    getToken(): string | null {
        return sessionStorage.getItem('token') || localStorage.getItem('token');
    },

    getUser(): UserData | null {
        const user = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!user) return null;
        try {
            return JSON.parse(user);
        } catch {
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    getRole(): string | null {
        const user = this.getUser();
        return user?.role || null;
    },

    getRolePath(): string {
        const role = this.getRole();
        if (!role) return '/login';
        return `/dashboard/${role.toLowerCase()}`;
    },
};
