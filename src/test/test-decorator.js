import { UniversalLogger, LoggerConfigBuilder, ConsoleTransport, ModuleLogger } from '../../lib';
import { LogMethod, LogPerformance, LogMethodFlow, LogCache, LogRetry, EnableLogging } from '../../lib';

// Mock console methods to capture output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

// Setup logger configuration
const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel('debug')
  .addModule('TestService', true, ['trace', 'debug', 'info', 'warn', 'error'], ['console'])
  .build();

const logger = new UniversalLogger(config);
logger.addTransport(new ConsoleTransport({ colorize: false }));

// Mock async delay to simulate long-running operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test class with all decorators
@EnableLogging('TestService')
class TestService {
  constructor(logger = logger.createModuleLogger('TestService')) {}

  @LogMethod
  async basicMethod(input ){
    return `Processed: ${input}`;
  }

  @LogPerformance(100)
  async slowMethod() {
    await delay(150); // Simulate slow operation exceeding 100ms threshold
    return 'Slow operation complete';
  }

  @LogMethodFlow('trace')
  async flowMethod(input){
    return input * 2;
  }

  @LogCache(1000)
  async cachedMethod(input){
    return `Cached: ${input}`;
  }

  @LogRetry(2, 50)
  async retryMethod(shouldFail){
    if (shouldFail) {
      throw new Error('Operation failed');
    }
    return 'Success';
  }

  @LogMethod
  @LogPerformance(100)
  @LogMethodFlow('debug')
  @LogCache(1000)
  @LogRetry(2, 50)
  async combinedMethod(input) {
    await delay(150);
    return `Combined: ${input}`;
  }
}

describe('Logging Decorators', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TestService();
  });

  test('LogMethod decorator logs method call and completion', async () => {
    // Test: Verifies that LogMethod logs the method call and its completion.
    // The decorator should log the method entry with argument details and completion time.
    await service.basicMethod('test');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] Calling method: basicMethod'),
      expect.objectContaining({ args: 1, argTypes: ['string'] })
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] Method basicMethod completed in'),
      undefined
    );
  });

  test('LogPerformance decorator logs slow methods', async () => {
    // Test: Verifies that LogPerformance logs when a method exceeds the 100ms threshold.
    // The slowMethod takes 150ms, so it should trigger a warning log.
    await service.slowMethod();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [WARN] Slow method detected: slowMethod took'),
      expect.objectContaining({ duration: expect.any(Number), threshold: 100 })
    );
  });

  test('LogMethodFlow decorator logs method entry and exit', async () => {
    // Test: Verifies that LogMethodFlow logs method entry and exit with detailed info at trace level.
    // It should log the input arguments and the result type/duration.
    await service.flowMethod(42);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [TRACE] → Entering TestService.flowMethod'),
      expect.objectContaining({
        args: [{ index: 0, type: 'number', value: '42' }]
      })
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [TRACE] ← Exiting TestService.flowMethod'),
      expect.objectContaining({ resultType: 'number', hasResult: true })
    );
  });

  test('LogCache decorator logs cache hits and misses', async () => {
    // Test: Verifies that LogCache logs cache misses on first call and hits on subsequent calls.
    // The first call to cachedMethod should log a miss, and the second should log a hit.
    await service.cachedMethod('test');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] Cache MISS for cachedMethod'),
      expect.any(Object)
    );

    await service.cachedMethod('test');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] Cache HIT for cachedMethod'),
      expect.any(Object)
    );
  });

  test('LogRetry decorator logs retry attempts and failures', async () => {
    // Test: Verifies that LogRetry logs retry attempts and final failure after exhausting retries.
    // The retryMethod is set to fail, so it should log two attempts and a final error.
    await expect(service.retryMethod(true)).rejects.toThrow('Operation failed');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [WARN] Attempt 1/2 failed for retryMethod'),
      expect.objectContaining({ attempt: 1, maxRetries: 2 })
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [ERROR] All 2 attempts failed for retryMethod'),
      expect.any(Object)
    );
  });

  test('EnableLogging decorator auto-sets up logger', () => {
    // Test: Verifies that EnableLogging automatically sets up the logger for the class.
    // The service should have a logger property set to a ModuleLogger instance for 'TestService'.
    expect(service.logger).toBeInstanceOf(ModuleLogger);
    expect(service.moduleName).toBe('TestService');
  });

  test('Combined decorators work together', async () => {
    // Test: Verifies that multiple decorators (LogMethod, LogPerformance, LogMethodFlow, LogCache, LogRetry)
    // can be applied to a single method and work as expected. This tests their compatibility.
    await service.combinedMethod('test');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] Cache MISS for combinedMethod'),
      expect.any(Object)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] Calling method: combinedMethod'),
      expect.any(Object)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [DEBUG] → Entering TestService.combinedMethod'),
      expect.any(Object)
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestService] [WARN] Slow method detected: combinedMethod took'),
      expect.any(Object)
    );
  });
});

afterAll(() => {
  // Clean up spies
  consoleLogSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});