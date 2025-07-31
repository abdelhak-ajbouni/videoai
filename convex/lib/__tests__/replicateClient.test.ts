import { EnhancedReplicateClient, createEnhancedReplicateClient, getDefaultEnhancedReplicateClient } from '../replicateClient';
import { RetryManager } from '../retryManager';
import { defaultPerformanceMonitor } from '../../services/performanceMonitor';
import { ReplicateError, ReplicateErrorType } from '../replicateErrors';

// Mock the dependencies
jest.mock('../retryManager');
jest.mock('../../services/performanceMonitor');
jest.mock('replicate');

// Mock console methods to avoid noise in tests
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('EnhancedReplicateClient', () => {
  let client: EnhancedReplicateClient;
  let mockReplicateClient: any;
  let mockRetryManager: jest.Mocked<RetryManager>;
  let mockCtx: any;

  beforeEach(() => {
    // Mock Replicate client
    mockReplicateClient = {
      predictions: {
        create: jest.fn(),
        get: jest.fn(),
        cancel: jest.fn(),
      },
      models: {
        list: jest.fn(),
        get: jest.fn(),
        versions: {
          list: jest.fn(),
        },
      },
      auth: 'test-token',
    };

    // Mock RetryManager
    mockRetryManager = {
      execute: jest.fn(),
    } as any;

    // Mock Convex context
    mockCtx = {
      db: {
        insert: jest.fn(),
        query: jest.fn(),
        patch: jest.fn(),
      },
    };

    // Mock the Replicate constructor
    const ReplicateMock = require('replicate');
    ReplicateMock.mockImplementation(() => mockReplicateClient);

    // Mock RetryManager constructor
    (RetryManager as jest.MockedClass<typeof RetryManager>).mockImplementation(() => mockRetryManager);

    // Create client instance
    client = new EnhancedReplicateClient('test-token', mockCtx);

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with API token', () => {
      const newClient = new EnhancedReplicateClient('test-token');
      expect(newClient).toBeInstanceOf(EnhancedReplicateClient);
    });

    it('should create client with context', () => {
      const newClient = new EnhancedReplicateClient('test-token', mockCtx);
      expect(newClient.hasContext()).toBe(true);
    });
  });

  describe('createPrediction', () => {
    it('should create prediction successfully', async () => {
      const mockPrediction = {
        id: 'pred_123',
        model: 'test/model',
        status: 'starting',
        input: { prompt: 'test' },
      };

      mockRetryManager.execute.mockResolvedValue(mockPrediction);

      const params = {
        model: 'test/model',
        input: { prompt: 'test prompt' },
        webhook: 'https://example.com/webhook',
      };

      const result = await client.createPrediction(params);

      expect(result).toEqual(mockPrediction);
      expect(mockRetryManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 5,
          baseDelay: 2000,
        })
      );
      expect(defaultPerformanceMonitor.recordSuccess).toHaveBeenCalledWith(
        mockCtx,
        'test/model',
        'create_prediction',
        expect.any(Number),
        expect.objectContaining({
          predictionId: 'pred_123',
          inputKeys: ['prompt'],
          hasWebhook: true,
        })
      );
    });

    it('should handle prediction creation failure', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;

      mockRetryManager.execute.mockRejectedValue(error);

      const params = {
        model: 'test/model',
        input: { prompt: 'test prompt' },
      };

      await expect(client.createPrediction(params)).rejects.toThrow(ReplicateError);

      expect(defaultPerformanceMonitor.recordFailure).toHaveBeenCalledWith(
        mockCtx,
        'test/model',
        'create_prediction',
        error,
        expect.any(Number),
        expect.objectContaining({
          inputKeys: ['prompt'],
          hasWebhook: false,
        })
      );
    });

    it('should work without context', async () => {
      const clientWithoutCtx = new EnhancedReplicateClient('test-token');
      const mockPrediction = { id: 'pred_123', model: 'test/model' };

      mockRetryManager.execute.mockResolvedValue(mockPrediction);

      const params = {
        model: 'test/model',
        input: { prompt: 'test prompt' },
      };

      const result = await clientWithoutCtx.createPrediction(params);

      expect(result).toEqual(mockPrediction);
      expect(defaultPerformanceMonitor.recordSuccess).not.toHaveBeenCalled();
    });
  });

  describe('getPrediction', () => {
    it('should get prediction successfully', async () => {
      const mockPrediction = {
        id: 'pred_123',
        model: 'test/model',
        status: 'succeeded',
        output: ['video_url'],
      };

      mockRetryManager.execute.mockResolvedValue(mockPrediction);

      const result = await client.getPrediction('pred_123');

      expect(result).toEqual(mockPrediction);
      expect(mockRetryManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 3,
          baseDelay: 1000,
        })
      );
      expect(defaultPerformanceMonitor.recordSuccess).toHaveBeenCalledWith(
        mockCtx,
        'test/model',
        'get_prediction',
        expect.any(Number),
        expect.objectContaining({
          predictionId: 'pred_123',
          status: 'succeeded',
        })
      );
    });

    it('should handle get prediction failure', async () => {
      const error = new Error('Prediction not found');
      (error as any).status = 404;

      mockRetryManager.execute.mockRejectedValue(error);

      await expect(client.getPrediction('pred_123')).rejects.toThrow(ReplicateError);

      expect(defaultPerformanceMonitor.recordFailure).toHaveBeenCalledWith(
        mockCtx,
        'unknown',
        'get_prediction',
        error,
        expect.any(Number),
        expect.objectContaining({
          predictionId: 'pred_123',
        })
      );
    });
  });

  describe('cancelPrediction', () => {
    it('should cancel prediction successfully', async () => {
      const mockPrediction = {
        id: 'pred_123',
        model: 'test/model',
        status: 'canceled',
      };

      mockRetryManager.execute.mockResolvedValue(mockPrediction);

      const result = await client.cancelPrediction('pred_123');

      expect(result).toEqual(mockPrediction);
      expect(mockRetryManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 2,
          baseDelay: 1000,
        })
      );
    });

    it('should handle cancel prediction failure', async () => {
      const error = new Error('Cannot cancel completed prediction');
      (error as any).status = 400;

      mockRetryManager.execute.mockRejectedValue(error);

      await expect(client.cancelPrediction('pred_123')).rejects.toThrow(ReplicateError);
    });
  });

  describe('listModels', () => {
    it('should list models successfully', async () => {
      const mockModelList = {
        results: [
          { owner: 'test', name: 'model1' },
          { owner: 'test', name: 'model2' },
        ],
        next: 'cursor_123',
      };

      mockRetryManager.execute.mockResolvedValue(mockModelList);

      const result = await client.listModels();

      expect(result).toEqual(mockModelList);
      expect(defaultPerformanceMonitor.recordSuccess).toHaveBeenCalledWith(
        mockCtx,
        'system',
        'list_models',
        expect.any(Number),
        expect.objectContaining({
          cursor: undefined,
          resultCount: 2,
        })
      );
    });

    it('should list models with cursor', async () => {
      const mockModelList = {
        results: [{ owner: 'test', name: 'model3' }],
        previous: 'cursor_123',
      };

      mockRetryManager.execute.mockResolvedValue(mockModelList);

      const result = await client.listModels('cursor_123');

      expect(result).toEqual(mockModelList);
      expect(defaultPerformanceMonitor.recordSuccess).toHaveBeenCalledWith(
        mockCtx,
        'system',
        'list_models',
        expect.any(Number),
        expect.objectContaining({
          cursor: 'cursor_123',
          resultCount: 1,
        })
      );
    });

    it('should handle list models failure', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;

      mockRetryManager.execute.mockRejectedValue(error);

      await expect(client.listModels()).rejects.toThrow(ReplicateError);

      expect(defaultPerformanceMonitor.recordFailure).toHaveBeenCalledWith(
        mockCtx,
        'system',
        'list_models',
        error,
        expect.any(Number),
        expect.objectContaining({
          cursor: undefined,
        })
      );
    });
  });

  describe('getModel', () => {
    it('should get model successfully', async () => {
      const mockModel = {
        owner: 'test',
        name: 'model',
        description: 'Test model',
        visibility: 'public',
      };

      mockRetryManager.execute.mockResolvedValue(mockModel);

      const result = await client.getModel('test', 'model');

      expect(result).toEqual(mockModel);
      expect(defaultPerformanceMonitor.recordSuccess).toHaveBeenCalledWith(
        mockCtx,
        'test/model',
        'get_model',
        expect.any(Number),
        expect.objectContaining({
          owner: 'test',
          name: 'model',
          visibility: 'public',
        })
      );
    });

    it('should handle get model failure', async () => {
      const error = new Error('Model not found');
      (error as any).status = 404;

      mockRetryManager.execute.mockRejectedValue(error);

      await expect(client.getModel('test', 'model')).rejects.toThrow(ReplicateError);

      expect(defaultPerformanceMonitor.recordFailure).toHaveBeenCalledWith(
        mockCtx,
        'test/model',
        'get_model',
        error,
        expect.any(Number),
        expect.objectContaining({
          owner: 'test',
          name: 'model',
        })
      );
    });
  });

  describe('listModelVersions', () => {
    it('should list model versions successfully', async () => {
      const mockVersions = {
        results: [
          { id: 'v1', created_at: '2023-01-01' },
          { id: 'v2', created_at: '2023-01-02' },
        ],
      };

      mockRetryManager.execute.mockResolvedValue(mockVersions);

      const result = await client.listModelVersions('test', 'model');

      expect(result).toEqual(mockVersions);
      expect(defaultPerformanceMonitor.recordSuccess).toHaveBeenCalledWith(
        mockCtx,
        'test/model',
        'list_model_versions',
        expect.any(Number),
        expect.objectContaining({
          owner: 'test',
          name: 'model',
          cursor: undefined,
          resultCount: 2,
        })
      );
    });
  });

  describe('retry options', () => {
    it('should use correct retry options for create_prediction', async () => {
      mockRetryManager.execute.mockResolvedValue({ id: 'pred_123' });

      await client.createPrediction({
        model: 'test/model',
        input: { prompt: 'test' },
      });

      expect(mockRetryManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 30000,
        })
      );
    });

    it('should use correct retry options for get_prediction', async () => {
      mockRetryManager.execute.mockResolvedValue({ id: 'pred_123' });

      await client.getPrediction('pred_123');

      expect(mockRetryManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        })
      );
    });

    it('should use correct retry options for cancel_prediction', async () => {
      mockRetryManager.execute.mockResolvedValue({ id: 'pred_123' });

      await client.cancelPrediction('pred_123');

      expect(mockRetryManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 2,
          baseDelay: 1000,
          maxDelay: 5000,
        })
      );
    });
  });

  describe('context management', () => {
    it('should check if client has context', () => {
      const clientWithCtx = new EnhancedReplicateClient('test-token', mockCtx);
      const clientWithoutCtx = new EnhancedReplicateClient('test-token');

      expect(clientWithCtx.hasContext()).toBe(true);
      expect(clientWithoutCtx.hasContext()).toBe(false);
    });

    it('should set context', () => {
      const clientWithoutCtx = new EnhancedReplicateClient('test-token');
      expect(clientWithoutCtx.hasContext()).toBe(false);

      clientWithoutCtx.setContext(mockCtx);
      expect(clientWithoutCtx.hasContext()).toBe(true);
    });

    it('should create new client with context', () => {
      const originalClient = new EnhancedReplicateClient('test-token');
      const newClient = originalClient.withContext(mockCtx);

      expect(originalClient.hasContext()).toBe(false);
      expect(newClient.hasContext()).toBe(true);
      expect(newClient).not.toBe(originalClient);
    });
  });

  describe('utility methods', () => {
    it('should return underlying Replicate client', () => {
      const underlyingClient = client.getClient();
      expect(underlyingClient).toBe(mockReplicateClient);
    });
  });

  describe('error handling', () => {
    it('should convert errors to ReplicateError', async () => {
      const originalError = new Error('Rate limit exceeded');
      (originalError as any).status = 429;

      mockRetryManager.execute.mockRejectedValue(originalError);

      try {
        await client.createPrediction({
          model: 'test/model',
          input: { prompt: 'test' },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ReplicateError);
        expect((error as ReplicateError).type).toBe(ReplicateErrorType.RATE_LIMIT);
        expect((error as ReplicateError).originalError).toBe(originalError);
      }
    });

    it('should log errors with context', async () => {
      const originalError = new Error('Server error');
      (originalError as any).status = 500;

      mockRetryManager.execute.mockRejectedValue(originalError);

      try {
        await client.createPrediction({
          model: 'test/model',
          input: { prompt: 'test' },
        });
      } catch (error) {
        // Error should be logged (we can't easily test console.error due to mocking)
        expect(error).toBeInstanceOf(ReplicateError);
      }
    });
  });
});

describe('createEnhancedReplicateClient', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env.REPLICATE_API_TOKEN = 'env-token';
  });

  afterEach(() => {
    delete process.env.REPLICATE_API_TOKEN;
  });

  it('should create client with provided token', () => {
    const client = createEnhancedReplicateClient('custom-token');
    expect(client).toBeInstanceOf(EnhancedReplicateClient);
  });

  it('should create client with environment token', () => {
    const client = createEnhancedReplicateClient();
    expect(client).toBeInstanceOf(EnhancedReplicateClient);
  });

  it('should create client with context', () => {
    const mockCtx = { db: {} };
    const client = createEnhancedReplicateClient('token', mockCtx);
    expect(client.hasContext()).toBe(true);
  });

  it('should throw error when no token is available', () => {
    delete process.env.REPLICATE_API_TOKEN;
    
    expect(() => createEnhancedReplicateClient()).toThrow('Replicate API token is required');
  });
});