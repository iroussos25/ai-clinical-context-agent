export type BenchmarkTestScenario = {
  id: string;
  name: string;
  description: string;
  context: string;
  question: string;
};

export type BenchmarkMetrics = {
  testId: string;
  testName: string;
  model: string;
  latencyMs: number;
  timeToFirstTokenMs: number;
  completionTokens: number;
  estimatedInputTokens: number;
  estimatedTotalTokens: number;
  estimatedCost: number;
  evidenceCitationsCount: number;
  responseLength: number;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
};

export type ConsistencyRun = {
  runNumber: number;
  responseHash: string;
  semanticConsistency?: number; // 0-1 score
};

export type BenchmarkResult = {
  testId: string;
  testName: string;
  runs: BenchmarkMetrics[];
  consistency: ConsistencyRun[];
  averageLatencyMs: number;
  averageTimeToFirstTokenMs: number;
  successRate: number;
  averageCitationsPerRun: number;
  totalCostEstimate: number;
  modelUsageSummary: Record<string, { count: number; avgLatency: number; successRate: number }>;
};

export type BenchmarkState = {
  results: BenchmarkResult[];
  isRunning: boolean;
  currentTestIndex: number;
  totalTests: number;
  progressMessage: string;
};
