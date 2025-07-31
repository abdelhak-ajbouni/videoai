import { PerformanceMonitor, ModelHealth, PerformanceMetrics } from '../performanceMonitor';
import { ReplicateErrorType } from '../../lib/replicateErrors';

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

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;
  let mockCtx: any;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    
    // Create mock Convex context
    const mockQuery = {
      withIndex: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      collect: jest.fn().mockResolvedValue([]),
      first: jest.fn().mockResolvedValue(null),
    };

    mockCtx = {
      db: {
        insert: jest.fn().mockResolvedValue('mock-id'),
        query: jest.fn(() => mockQuery),
        patch: jest.fn().mockResolvedValue(undefined),
      },
    };
    
    jest.clearAllMocks();
  });

  describe('recordSuccess', () => {
    it('should record successful operation metrics', async () => {
      const modelId = 'test/model';
      const operation = 'create_prediction';
      const responseTime = 2500;
      const context = { userId: 'user123' };

      await performanceMonitor.recordSuccess(mockCtx, modelId, operation, responseTime, context);

      expect(mockCtx.db.insert).toHaveBeenCalledWith('replicateMetrics', {
        modelId,
        operation,
        duration: responseTime,
        success: true,
        timestamp: expect.any(Number),
        context,
      });
    });

    it('should update model health after recording success', async () => {
      // Mock the query to return some metrics
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue([
        { success: true, duration: 1000 },
        { success: true, duration: 2000 },
      ]);

      mockCtx.db.query().withIndex().eq().first.mockResolvedValue({
        _id: 'model123',
        modelId: 'test/model',
      });

      await performanceMonitor.recordSuccess(mockCtx, 'test/model', 'create_prediction', 1500);

      // Should call updateModelHealth which queries for recent metrics
      expect(mockCtx.db.query).toHaveBeenCalled();
    });
  });

  describe('recordFailure', () => {
    it('should record failed operation metrics with error classification', async () => {
      const modelId = 'test/model';
      const operation = 'create_prediction';
      const error = { status: 429, message: 'Rate limit exceeded' };
      const responseTime = 1000;
      const context = { userId: 'user123' };

      await performanceMonitor.recordFailure(mockCtx, modelId, operation, error, responseTime, context);

      expect(mockCtx.db.insert).toHaveBeenCalledWith('replicateMetrics', {
        modelId,
        operation,
        duration: responseTime,
        success: false,
        errorType: ReplicateErrorType.RATE_LIMIT,
        timestamp: expect.any(Number),
        context: {
          ...context,
          errorMessage: error.message,
          errorStatus: error.status,
        },
      });
    });

    it('should handle errors without response time', async () => {
      const error = { message: 'Network error' };

      await performanceMonitor.recordFailure(mockCtx, 'test/model', 'create_prediction', error);

      expect(mockCtx.db.insert).toHaveBeenCalledWith('replicateMetrics', expect.objectContaining({
        duration: 0,
        success: false,
      }));
    });
  });

  describe('getModelHealth', () => {
    it('should return healthy status for good metrics', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 1000 },
        { success: true, duration: 1500 },
        { success: true, duration: 2000 },
        { success: true, duration: 1200 },
        { success: true, duration: 1800 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const health = await performanceMonitor.getModelHealth(mockCtx, modelId);

      expect(health).toEqual({
        modelId,
        successRate: 100,
        avgResponseTime: 1500,
        totalRequests: 5,
        successfulRequests: 5,
        failedRequests: 0,
        isHealthy: true,
        lastChecked: expect.any(Number),
        status: 'healthy',
        issues: [],
      });
    });

    it('should return degraded status for low success rate', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 1000 },
        { success: true, duration: 1500 },
        { success: true, duration: 1200 },
        { success: false, duration: 0 },
        { success: false, duration: 0 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const health = await performanceMonitor.getModelHealth(mockCtx, modelId);

      expect(health.successRate).toBe(60); // 3/5 = 60%
      expect(health.status).toBe('degraded');
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('Success rate below threshold: 60.0%');
    });

    it('should return critical status for very low success rate', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 1000 },
        { success: false, duration: 0 },
        { success: false, duration: 0 },
        { success: false, duration: 0 },
        { success: false, duration: 0 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const health = await performanceMonitor.getModelHealth(mockCtx, modelId);

      expect(health.successRate).toBe(20); // 1/5 = 20%
      expect(health.status).toBe('critical');
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('Success rate critically low: 20.0%');
    });

    it('should return degraded status for high response time', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 35000 }, // 35 seconds
        { success: true, duration: 40000 }, // 40 seconds
        { success: true, duration: 30000 }, // 30 seconds
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const health = await performanceMonitor.getModelHealth(mockCtx, modelId);

      expect(health.avgResponseTime).toBe(35000);
      expect(health.status).toBe('degraded');
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('Response time above threshold: 35.0s');
    });

    it('should return critical status for very high response time', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 70000 }, // 70 seconds
        { success: true, duration: 80000 }, // 80 seconds
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const health = await performanceMonitor.getModelHealth(mockCtx, modelId);

      expect(health.avgResponseTime).toBe(75000);
      expect(health.status).toBe('critical');
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('Response time critically high: 75.0s');
    });

    it('should return unknown status when no recent data is available', async () => {
      const modelId = 'test/model';
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue([]);

      const health = await performanceMonitor.getModelHealth(mockCtx, modelId);

      expect(health).toEqual({
        modelId,
        successRate: 100,
        avgResponseTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        isHealthy: true,
        lastChecked: expect.any(Number),
        status: 'unknown',
        issues: ['No recent data available'],
      });
    });
  });

  describe('getModelStatistics', () => {
    it('should calculate comprehensive statistics', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 1000, errorType: undefined },
        { success: true, duration: 2000, errorType: undefined },
        { success: false, duration: 0, errorType: 'rate_limit' },
        { success: true, duration: 1500, errorType: undefined },
        { success: false, duration: 0, errorType: 'server_error' },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const stats = await performanceMonitor.getModelStatistics(mockCtx, modelId, '24h');

      expect(stats.modelId).toBe(modelId);
      expect(stats.timeWindow).toBe('24h');
      expect(stats.totalRequests).toBe(5);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(2);
      expect(stats.successRate).toBe(60);
      expect(stats.avgResponseTime).toBe(1500); // (1000 + 2000 + 1500) / 3
      expect(stats.errorBreakdown.rate_limit).toBe(1);
      expect(stats.errorBreakdown.server_error).toBe(1);
    });

    it('should calculate median and p95 response times', async () => {
      const modelId = 'test/model';
      const mockMetrics = [
        { success: true, duration: 1000 },
        { success: true, duration: 2000 },
        { success: true, duration: 3000 },
        { success: true, duration: 4000 },
        { success: true, duration: 5000 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const stats = await performanceMonitor.getModelStatistics(mockCtx, modelId, '24h');

      expect(stats.medianResponseTime).toBe(3000);
      expect(stats.p95ResponseTime).toBe(5000); // 95th percentile of 5 items is the 5th item
    });

    it('should return empty statistics when no data is available', async () => {
      const modelId = 'test/model';
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue([]);

      const stats = await performanceMonitor.getModelStatistics(mockCtx, modelId, '1h');

      expect(stats.totalRequests).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.avgResponseTime).toBe(0);
      expect(stats.trends.successRateTrend).toBe('stable');
      expect(stats.trends.responseTimeTrend).toBe('stable');
    });
  });

  describe('getAllModelsHealth', () => {
    it('should return health for all active models', async () => {
      const mockModels = [
        { modelId: 'model1' },
        { modelId: 'model2' },
      ];

      // First call returns models, subsequent calls return metrics for each model
      mockCtx.db.query().withIndex().eq().collect
        .mockResolvedValueOnce(mockModels) // First call for models
        .mockResolvedValueOnce([{ success: true, duration: 1000 }]) // model1 metrics
        .mockResolvedValueOnce([{ success: true, duration: 2000 }]); // model2 metrics

      const allHealth = await performanceMonitor.getAllModelsHealth(mockCtx);

      expect(allHealth).toHaveLength(2);
      expect(allHealth[0].modelId).toBe('model1');
      expect(allHealth[1].modelId).toBe('model2');
    });
  });

  describe('getHealthAlerts', () => {
    it('should return alerts for unhealthy models', async () => {
      const mockModels = [
        { modelId: 'healthy-model' },
        { modelId: 'degraded-model' },
        { modelId: 'critical-model' },
      ];

      // First call returns models, subsequent calls return metrics for each model
      mockCtx.db.query().withIndex().eq().collect
        .mockResolvedValueOnce(mockModels) // First call for models
        .mockResolvedValueOnce([
          { success: true, duration: 1000 },
          { success: true, duration: 1500 },
        ]) // healthy-model
        .mockResolvedValueOnce([
          { success: true, duration: 35000 }, // High response time
          { success: true, duration: 40000 },
        ]) // degraded-model
        .mockResolvedValueOnce([
          { success: false, duration: 0 },
          { success: false, duration: 0 },
          { success: false, duration: 0 },
          { success: false, duration: 0 },
          { success: true, duration: 1000 },
        ]); // critical-model (20% success rate)

      const alerts = await performanceMonitor.getHealthAlerts(mockCtx);

      expect(alerts).toHaveLength(2);
      
      const degradedAlert = alerts.find(a => a.modelId === 'degraded-model');
      expect(degradedAlert?.severity).toBe('warning');
      expect(degradedAlert?.message).toContain('degraded');

      const criticalAlert = alerts.find(a => a.modelId === 'critical-model');
      expect(criticalAlert?.severity).toBe('critical');
      expect(criticalAlert?.message).toContain('critical');
    });

    it('should return empty array when all models are healthy', async () => {
      const mockModels = [{ modelId: 'healthy-model' }];

      mockCtx.db.query().withIndex().eq().collect.mockResolvedValue(mockModels);
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue([
        { success: true, duration: 1000 },
        { success: true, duration: 1500 },
      ]);

      const alerts = await performanceMonitor.getHealthAlerts(mockCtx);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('error classification', () => {
    const testCases = [
      { error: { status: 429 }, expected: ReplicateErrorType.RATE_LIMIT },
      { error: { status: 401 }, expected: ReplicateErrorType.AUTHENTICATION },
      { error: { status: 400 }, expected: ReplicateErrorType.INVALID_INPUT },
      { error: { status: 404 }, expected: ReplicateErrorType.MODEL_NOT_FOUND },
      { error: { status: 500 }, expected: ReplicateErrorType.SERVER_ERROR },
      { error: { code: 'ETIMEDOUT' }, expected: ReplicateErrorType.TIMEOUT },
      { error: { code: 'ECONNRESET' }, expected: ReplicateErrorType.NETWORK_ERROR },
      { error: { message: 'Unknown error' }, expected: ReplicateErrorType.UNKNOWN },
    ];

    testCases.forEach(({ error, expected }) => {
      it(`should classify ${JSON.stringify(error)} as ${expected}`, async () => {
        await performanceMonitor.recordFailure(mockCtx, 'test/model', 'test_op', error);

        expect(mockCtx.db.insert).toHaveBeenCalledWith('replicateMetrics', 
          expect.objectContaining({
            errorType: expected,
          })
        );
      });
    });
  });

  describe('time window parsing', () => {
    it('should parse hour-based time windows', async () => {
      const mockMetrics = [{ success: true, duration: 1000 }];
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      await performanceMonitor.getModelStatistics(mockCtx, 'test/model', '6h');

      // Verify the query was called (we can't easily test the exact timestamp due to timing)
      expect(mockCtx.db.query().withIndex().eq().gte).toHaveBeenCalled();
    });

    it('should parse day-based time windows', async () => {
      const mockMetrics = [{ success: true, duration: 1000 }];
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      await performanceMonitor.getModelStatistics(mockCtx, 'test/model', '7d');

      // Should query for 7 days worth of data
      expect(mockCtx.db.query().withIndex().eq().gte).toHaveBeenCalled();
    });

    it('should default to 24h for invalid time windows', async () => {
      const mockMetrics = [{ success: true, duration: 1000 }];
      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      await performanceMonitor.getModelStatistics(mockCtx, 'test/model', 'invalid');

      // Should still work with default 24h window
      expect(mockCtx.db.query().withIndex().eq().gte).toHaveBeenCalled();
    });
  });

  describe('trend calculation', () => {
    it('should detect improving success rate trend', async () => {
      const mockMetrics = [
        // First half - lower success rate
        { success: false, duration: 0 },
        { success: false, duration: 0 },
        { success: true, duration: 1000 },
        { success: false, duration: 0 },
        { success: true, duration: 1000 },
        // Second half - higher success rate
        { success: true, duration: 1000 },
        { success: true, duration: 1000 },
        { success: true, duration: 1000 },
        { success: true, duration: 1000 },
        { success: true, duration: 1000 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const stats = await performanceMonitor.getModelStatistics(mockCtx, 'test/model', '24h');

      expect(stats.trends.successRateTrend).toBe('improving');
    });

    it('should detect declining response time trend', async () => {
      const mockMetrics = [
        // First half - faster response times
        { success: true, duration: 1000 },
        { success: true, duration: 1200 },
        { success: true, duration: 1100 },
        { success: true, duration: 1300 },
        { success: true, duration: 1000 },
        // Second half - slower response times
        { success: true, duration: 3000 },
        { success: true, duration: 3500 },
        { success: true, duration: 3200 },
        { success: true, duration: 3800 },
        { success: true, duration: 3100 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const stats = await performanceMonitor.getModelStatistics(mockCtx, 'test/model', '24h');

      expect(stats.trends.responseTimeTrend).toBe('declining');
    });

    it('should return stable trends for insufficient data', async () => {
      const mockMetrics = [
        { success: true, duration: 1000 },
        { success: true, duration: 1100 },
      ];

      mockCtx.db.query().withIndex().eq().gte().collect.mockResolvedValue(mockMetrics);

      const stats = await performanceMonitor.getModelStatistics(mockCtx, 'test/model', '24h');

      expect(stats.trends.successRateTrend).toBe('stable');
      expect(stats.trends.responseTimeTrend).toBe('stable');
    });
  });
});