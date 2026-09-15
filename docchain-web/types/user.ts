export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
}
