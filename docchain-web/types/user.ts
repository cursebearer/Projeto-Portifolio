export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
