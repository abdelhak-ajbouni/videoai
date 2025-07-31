import { RetryManager, RetryOptions } from '../retryManager';
import { ReplicateErrorType } from '../replicateErrors';

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

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return result on first success', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce('success');
      
      const result = await retryManager.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new Error('Invalid input');
      const mockOperation = jest.fn().mockRejectedValue(nonRetryableError);
      
      await expect(retryManager.execute(mockOperation)).rejects.toThrow('Invalid input');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries option', async () => {
      const retryableError = new Error('ECONNRESET');
      const mockOperation = jest.fn().mockRejectedValue(retryableError);
      
      const options: RetryOptions = { maxRetries: 2 };
      
      await expect(retryManager.execute(mockOperation, options)).rejects.toThrow();
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle rate limit errors with appropriate delays', async () => {
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      const result = await retryManager.execute(mockOperation, { baseDelay: 100 });
      const duration = Date.now() - startTime;
      
      expect(result).toBe('success');
      expect(duration).toBeGreaterThan(90); // Should have some delay
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should handle server errors (5xx)', async () => {
      const serverError = { status: 500, message: 'Internal server error' };
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce('success');
      
      const result = await retryManager.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry authentication errors', async () => {
      const authError = { status: 401, message: 'Unauthorized' };
      const mockOperation = jest.fn().mockRejectedValue(authError);
      
      await expect(retryManager.execute(mockOperation)).rejects.toMatchObject({
        status: 401
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should create aggregate error after max retries', async () => {
      const retryableError = new Error('ECONNRESET');
      const mockOperation = jest.fn().mockRejectedValue(retryableError);
      
      try {
        await retryManager.execute(mockOperation, { maxRetries: 2 });
      } catch (error: any) {
        expect(error.message).toContain('Operation failed after 3 attempts');
        expect(error.originalErrors).toHaveLength(3);
        expect(error.attempts).toBe(3);
      }
    });
  });

  describe('executeWithStats', () => {
    it('should return detailed statistics on success', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce('success');
      
      const result = await retryManager.executeWithStats(mockOperation);
      
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should include all errors in stats', async () => {
      const error1 = new Error('ECONNRESET'); // Make it retryable
      const error2 = new Error('ECONNRESET'); // Make it retryable
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValueOnce('success');
      
      const result = await retryManager.executeWithStats(mockOperation);
      
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe(error1);
      expect(result.errors[1]).toBe(error2);
    });
  });

  describe('delay calculation', () => {
    it('should calculate exponential backoff correctly', async () => {
      const delays: number[] = [];
      const mockOperation = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('ECONNRESET'));
      });
      
      // Mock sleep to capture delays
      const originalSleep = (retryManager as any).sleep;
      (retryManager as any).sleep = jest.fn().mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });
      
      try {
        await retryManager.execute(mockOperation, { 
          maxRetries: 3, 
          baseDelay: 1000,
          jitterFactor: 0 // Remove jitter for predictable testing
        });
      } catch (error) {
        // Expected to fail
      }
      
      // Restore original sleep
      (retryManager as any).sleep = originalSleep;
      
      expect(delays).toHaveLength(3);
      expect(delays[0]).toBe(1000); // First retry: 1000ms
      expect(delays[1]).toBe(2000); // Second retry: 2000ms
      expect(delays[2]).toBe(4000); // Third retry: 4000ms
    });

    it('should respect maximum delay', async () => {
      const delays: number[] = [];
      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      
      const originalSleep = (retryManager as any).sleep;
      (retryManager as any).sleep = jest.fn().mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });
      
      try {
        await retryManager.execute(mockOperation, { 
          maxRetries: 2, 
          baseDelay: 10000,
          maxDelay: 15000,
          jitterFactor: 0
        });
      } catch (error) {
        // Expected to fail
      }
      
      (retryManager as any).sleep = originalSleep;
      
      expect(delays[0]).toBe(10000); // First retry: 10000ms
      expect(delays[1]).toBe(15000); // Second retry: capped at 15000ms
    });

    it('should add jitter to delays', async () => {
      const delays: number[] = [];
      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      
      const originalSleep = (retryManager as any).sleep;
      (retryManager as any).sleep = jest.fn().mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });
      
      try {
        await retryManager.execute(mockOperation, { 
          maxRetries: 2, 
          baseDelay: 1000,
          jitterFactor: 0.1
        });
      } catch (error) {
        // Expected to fail
      }
      
      (retryManager as any).sleep = originalSleep;
      
      // With jitter, delays should vary from the base exponential values
      expect(delays[0]).not.toBe(1000);
      expect(delays[1]).not.toBe(2000);
      
      // But should be within reasonable range (±10% jitter)
      expect(delays[0]).toBeGreaterThan(900);
      expect(delays[0]).toBeLessThan(1100);
    });
  });

  describe('error type specific configurations', () => {
    it('should use appropriate config for rate limit errors', () => {
      const config = RetryManager.getConfigForErrorType(ReplicateErrorType.RATE_LIMIT);
      
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelay).toBe(5000);
      expect(config.maxDelay).toBe(60000);
      expect(config.jitterFactor).toBe(0.2);
    });

    it('should use appropriate config for server errors', () => {
      const config = RetryManager.getConfigForErrorType(ReplicateErrorType.SERVER_ERROR);
      
      expect(config.maxRetries).toBe(3);
      expect(config.baseDelay).toBe(2000);
      expect(config.maxDelay).toBe(30000);
    });

    it('should use appropriate config for network errors', () => {
      const config = RetryManager.getConfigForErrorType(ReplicateErrorType.NETWORK_ERROR);
      
      expect(config.maxRetries).toBe(4);
      expect(config.baseDelay).toBe(1000);
      expect(config.maxDelay).toBe(15000);
    });
  });

  describe('network error detection', () => {
    const networkErrors = [
      { code: 'ECONNRESET', message: 'Connection reset' },
      { code: 'ECONNREFUSED', message: 'Connection refused' },
      { code: 'ETIMEDOUT', message: 'Connection timed out' },
      { code: 'ENOTFOUND', message: 'Host not found' },
      { message: 'network error occurred' },
    ];

    networkErrors.forEach(error => {
      it(`should detect ${error.code || 'message-based'} as network error`, async () => {
        const mockOperation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce('success');
        
        const result = await retryManager.execute(mockOperation);
        
        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('HTTP status code handling', () => {
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    const nonRetryableStatusCodes = [400, 401, 403, 404];

    retryableStatusCodes.forEach(status => {
      it(`should retry on HTTP ${status}`, async () => {
        const error = { status, message: `HTTP ${status} error` };
        const mockOperation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce('success');
        
        const result = await retryManager.execute(mockOperation);
        
        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(2);
      });
    });

    nonRetryableStatusCodes.forEach(status => {
      it(`should not retry on HTTP ${status}`, async () => {
        const error = { status, message: `HTTP ${status} error` };
        const mockOperation = jest.fn().mockRejectedValue(error);
        
        await expect(retryManager.execute(mockOperation)).rejects.toMatchObject({
          status
        });
        expect(mockOperation).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined operations gracefully', async () => {
      await expect(retryManager.execute(null as any)).rejects.toThrow();
    });

    it('should handle operations that throw non-Error objects', async () => {
      const mockOperation = jest.fn().mockRejectedValue('string error');
      
      await expect(retryManager.execute(mockOperation)).rejects.toBeDefined();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle zero maxRetries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      
      await expect(retryManager.execute(mockOperation, { maxRetries: 0 })).rejects.toThrow();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle negative delays gracefully', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce('success');
      
      const result = await retryManager.execute(mockOperation, { 
        baseDelay: -1000 // Negative delay should be handled
      });
      
      expect(result).toBe('success');
    });
  });
});