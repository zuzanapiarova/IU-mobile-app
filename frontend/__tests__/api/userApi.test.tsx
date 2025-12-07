import { User } from '@/constants/interfaces';

jest.mock('expo-secure-store');

// Create a mocked axios instance
const mockAxiosInstance = {
  post: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
  },
};

// Use jest.doMock to mock axios BEFORE importing userApi - else the interceptors will not load and be undefined
jest.doMock('axios', () => ({
  create: () => mockAxiosInstance,
}));

// Require userApi only after mocking axios - again because the interceptors will not load and be undefined
const { addUser, loginUser, updateUserBackend } = require('../../api/userApi');

describe('userApi', () => {
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: '2023-01-01',
    successLimit: 80,
    failureLimit: 20,
    notificationTime: '18:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------
  // 1. ADD USER
  // ------------------
  it('should add a new user', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockUser });

    const result = await addUser('Test User', 'test@example.com', '1234');

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', {
      name: 'Test User',
      email: 'test@example.com',
      password: '1234',
    });

    expect(result).toEqual(mockUser);
  });

  // ------------------
  // 2. LOGIN USER
  // ------------------
  it('should log in a user', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockUser });

    const result = await loginUser('test@example.com', '1234');

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: '1234',
    });

    expect(result).toEqual(mockUser);
    });

    // ------------------
    // 3. UPDATE USER
    // ------------------
    it('should update a user', async () => {
        const updated = { ...mockUser, name: 'New Name' };
        mockAxiosInstance.put.mockResolvedValueOnce({ data: updated });

        const result = await updateUserBackend(1, { name: 'New Name' });

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/1', { name: 'New Name' });

        expect(result).toEqual(updated);
    });

    // ------------------------
    // 4. ATTACHING JWT TOKENS
    // ------------------------
    it('should attach token in interceptor', async () => {
        // Reset module registry
        jest.resetModules();
        
        // Mock SecureStore BEFORE requiring userApi
        const mockedSecureStore = require('expo-secure-store');
        mockedSecureStore.getItemAsync = jest.fn().mockResolvedValue('mock-token');
        
        // Mock axios BEFORE requiring userApi - so the inerceptors are populated
        const mockAxiosInstance = {
            post: jest.fn(),
            put: jest.fn(),
            get: jest.fn(),
        interceptors: { request: { use: jest.fn() } },
        };
        jest.doMock('axios', () => ({ create: () => mockAxiosInstance }));
        
        // Capture the interceptor function
        let interceptorFn: any = null;
        mockAxiosInstance.interceptors.request.use.mockImplementation((fn: any) => {
            interceptorFn = fn;
        });
        
        // Require userApi AFTER all mocks
        require('../../api/userApi');
        
        // Ensure interceptor was captured
        expect(interceptorFn).not.toBeNull();
        
        // Call interceptor manually
        const config = await interceptorFn({ headers: {} });
        
        // Expect Authorization header to be set
        expect(config.headers.Authorization).toBe('Bearer mock-token');
    });

    // -------------------------------------
    // 5. ATTACHING JWT TOKENS WHEN MISSING
    // -------------------------------------
    it('should not attach token when missing', async () => {
        // Reset module registry so userApi reloads fresh
        jest.resetModules();
      
        // Mock SecureStore BEFORE importing userApi
        const mockedSecureStore = require('expo-secure-store');
        mockedSecureStore.getItemAsync = jest.fn().mockResolvedValue(null);
      
        // Mock axios BEFORE importing userApi
        const mockAxiosInstance = {
          post: jest.fn(),
          put: jest.fn(),
          get: jest.fn(),
          interceptors: { request: { use: jest.fn() } },
        };
        jest.doMock('axios', () => ({ create: () => mockAxiosInstance }));
      
        // Capture the interceptor function
        let interceptorFn: any = null;
        mockAxiosInstance.interceptors.request.use.mockImplementation((fn: any) => {
          interceptorFn = fn;
        });
      
        // Import userApi AFTER mocks
        require('../../api/userApi');
      
        // Ensure the interceptor function was captured
        expect(interceptorFn).not.toBeNull();
      
        // Call interceptor manually with a fake config
        const config = await interceptorFn({ headers: {} });
      
        // Check that Authorization header is NOT set
        expect(config.headers.Authorization).toBeUndefined();
    });   
});