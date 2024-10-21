import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'client';
}

interface DecodedToken {
  user: User;
  exp: number;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: '2', name: 'Tech User', email: 'tech@example.com', role: 'technician' },
  { id: '3', name: 'Client User', email: 'client@example.com', role: 'client' },
];

const AUTH_TOKEN_KEY = 'auth_token';

export const login = (email: string, password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      console.log('Login attempt:', { email, password, userFound: !!user });
      if (user && password === 'password123') {
        const token = generateToken(user);
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log('Login successful, token set:', token);
        resolve(token);
      } else {
        console.log('Login failed: Invalid credentials');
        reject(new Error('Invalid credentials'));
      }
    }, 1000);
  });
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  console.log('User logged out, token removed');
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  console.log('Checking authentication, token exists:', !!token);
  if (!token) return false;
  
  try {
    const decodedToken = parseToken(token);
    const isValid = decodedToken.exp > Date.now() / 1000;
    console.log('Token validation result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  
  try {
    const decodedToken = parseToken(token);
    return decodedToken.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

const generateToken = (user: User): string => {
  const payload = {
    user: { ...user, password: undefined },
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  };
  return btoa(JSON.stringify(payload));
};

const parseToken = (token: string): DecodedToken => {
  try {
    return JSON.parse(atob(token)) as DecodedToken;
  } catch (error) {
    console.error('Error parsing token:', error);
    throw new Error('Invalid token');
  }
};