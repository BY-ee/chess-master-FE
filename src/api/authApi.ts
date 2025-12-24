import axiosInstance from './axiosInstance';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  email: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface SignupResponse {
  access_token: string;
  user: UserProfile;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<string> => {
    // Expecting { access_token: "..." } from BE
    const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
    return response.data.access_token; 
  },

  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    // Optimized: Returns { access_token, user } immediately
    const response = await axiosInstance.post<SignupResponse>('/auth/signup', data);
    return response.data;
  },
  
  getMe: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get<UserProfile>('/auth/profile');
    return response.data;
  }
};
