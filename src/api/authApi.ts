import axiosInstance from './axiosInstance';

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
  id: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  
  // Future proofing for verify/me endpoint
  getMe: async (): Promise<AuthResponse> => {
      const response = await axiosInstance.get<AuthResponse>('/auth/profile');
      return response.data;
  }
};
