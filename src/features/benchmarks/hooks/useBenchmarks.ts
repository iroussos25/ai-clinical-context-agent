import { useCallback, useState } from "react";
import { getClientApiHeaders, readApiErrorMessage } from "@/lib/client/api";
import { BenchmarkMetrics, BenchmarkResult, BenchmarkState, ConsistencyRun } from "../types";
import { BENCHMARK_SCENARIOS } from "../scenarios";

const COST_PER_1M_INPUT_TOKENS = 0.005; // Rough estimate for Gemini models
const COST_PER_1M_OUTPUT_TOKENS = 0.015;

function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

function computeStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

function countEvidenceCitations(response: string): number {
  // Count [chunk N | ...] patterns in the response
  const citationMatches = response.match(/\[chunk\s+\d+/g);
  return citationMatches?.length ?? 0;
}

export function useBenchmarks() {
  const [state, setState] = useState<BenchmarkState>({
    results: [],
    isRunning: false,
    currentTestIndex: 0,
    totalTests: 0,
    progressMessage: "",
  });

  const runBenchmarks = useCallback(
    async (runsPerTest: number = 2) => {
      setState({
        results: [],
        isRunning: true,
        currentTestIndex: 0,
        totalTests: BENCHMARK_SCENARIOS.length,
        progressMessage: "Initializing benchmarks...",
      });

      const allResults: BenchmarkResult[] = [];

      for (let testIdx = 0; testIdx < BENCHMARK_SCENARIOS.length; testIdx++) {
        const scenario = BENCHMARK_SCENARIOS[testIdx];

        setState((prev) => ({
          ...prev,
          currentTestIndex: testIdx + 1,
          progressMessage: `Running ${scenario.name}... (${runsPerTest} runs)`,
        }));

        const metrics: BenchmarkMetrics[] = [];
        const consistencyRuns: ConsistencyRun[] = [];

        for (let run = 0; run < runsPerTest; run++) {
          try {
            const startTime = performance.now();
            let timeToFirstToken = 0;
            let firstTokenReceived = false;

            const res = await fetch("/api/analyze", {
              method: "POST",
              headers: getClientApiHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({
                prompt: scenario.question,
                context: scenario.context,
              }),
            });

            if (!res.ok) {
              throw new Error(await readApiErrorMessage(res, `API error: ${res.status}`));
            }

            let responseText = "";
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (!firstTokenReceived) {
                  timeToFirstToken = performance.now() - startTime;
                  firstTokenReceived = true;
                }

                const chunk = decoder.decode(value, { stream: true });
                responseText += chunk;
              }

              const finalChunk = decoder.decode();
              if (finalChunk) {
                responseText += finalChunk;
              }
            }

            const endTime = performance.now();
            const totalLatency = endTime - startTime;

            const completionTokens = estimateTokenCount(responseText);
            const inputTokens = estimateTokenCount(scenario.question + scenario.context);
            const totalTokens = inputTokens + completionTokens;
            const cost =
              (inputTokens * COST_PER_1M_INPUT_TOKENS + completionTokens * COST_PER_1M_OUTPUT_TOKENS) / 1000000;

            const metric: BenchmarkMetrics = {
              testId: scenario.id,
              testName: scenario.name,
              model: res.headers.get("X-Model-Used") || "unknown",
              latencyMs: Math.round(totalLatency),
              timeToFirstTokenMs: Math.round(timeToFirstToken),
              completionTokens,
              estimatedInputTokens: inputTokens,
              estimatedTotalTokens: totalTokens,
              estimatedCost: cost,
              evidenceCitationsCount: countEvidenceCitations(responseText),
              responseLength: responseText.length,
              timestamp: new Date().toISOString(),
              success: true,
            };

            metrics.push(metric);

            // Track for consistency analysis
            const responseHash = computeStringHash(responseText);
            consistencyRuns.push({
              runNumber: run + 1,
              responseHash,
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";

            const metric: BenchmarkMetrics = {
              testId: scenario.id,
              testName: scenario.name,
              model: "unknown",
              latencyMs: 0,
              timeToFirstTokenMs: 0,
              completionTokens: 0,
              estimatedInputTokens: 0,
              estimatedTotalTokens: 0,
              estimatedCost: 0,
              evidenceCitationsCount: 0,
              responseLength: 0,
              timestamp: new Date().toISOString(),
              success: false,
              errorMessage: errorMsg,
            };

            metrics.push(metric);
          }

          // Small delay between runs
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Calculate consistency score: percentage of runs with same hash
        const hashes = consistencyRuns.map((r) => r.responseHash);
        const mostCommonHash = hashes[0];
        const consistencyScore =
          hashes.length > 0 ? (hashes.filter((h) => h === mostCommonHash).length / hashes.length) * 100 : 0;

        consistencyRuns.forEach((r) => {
          r.semanticConsistency = consistencyScore / 100;
        });

        // Aggregate results
        const successfulMetrics = metrics.filter((m) => m.success);
        const modelUsageSummary: Record<string, { count: number; avgLatency: number; successRate: number }> = {};

        for (const metric of metrics) {
          if (!modelUsageSummary[metric.model]) {
            modelUsageSummary[metric.model] = { count: 0, avgLatency: 0, successRate: 0 };
          }
          modelUsageSummary[metric.model].count++;
          modelUsageSummary[metric.model].avgLatency += metric.latencyMs;
          if (metric.success) {
            modelUsageSummary[metric.model].successRate++;
          }
        }

        for (const model in modelUsageSummary) {
          const usage = modelUsageSummary[model];
          usage.avgLatency = Math.round(usage.avgLatency / usage.count);
          usage.successRate = Math.round((usage.successRate / usage.count) * 100);
        }

        const result: BenchmarkResult = {
          testId: scenario.id,
          testName: scenario.name,
          runs: metrics,
          consistency: consistencyRuns,
          averageLatencyMs:
            successfulMetrics.length > 0
              ? Math.round(successfulMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / successfulMetrics.length)
              : 0,
          averageTimeToFirstTokenMs:
            successfulMetrics.length > 0
              ? Math.round(
                  successfulMetrics.reduce((sum, m) => sum + m.timeToFirstTokenMs, 0) / successfulMetrics.length
                )
              : 0,
          successRate: Math.round((successfulMetrics.length / metrics.length) * 100),
          averageCitationsPerRun:
            successfulMetrics.length > 0
              ? Math.round(successfulMetrics.reduce((sum, m) => sum + m.evidenceCitationsCount, 0))
              : 0,
          totalCostEstimate: metrics.reduce((sum, m) => sum + m.estimatedCost, 0),
          modelUsageSummary,
        };

        allResults.push(result);

        setState((prev) => ({
          ...prev,
          results: allResults,
        }));
      }

      setState((prev) => ({
        ...prev,
        isRunning: false,
        progressMessage: "Benchmarks complete!",
      }));
    },
    []
  );

  const clearResults = useCallback(() => {
    setState({
      results: [],
      isRunning: false,
      currentTestIndex: 0,
      totalTests: 0,
      progressMessage: "",
    });
  }, []);

  const exportResults = useCallback((format: "json" | "csv" = "json") => {
    if (state.results.length === 0) {
      alert("No results to export");
      return;
    }

    if (format === "json") {
      const dataStr = JSON.stringify(state.results, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `benchmarks-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      // Flatten results into CSV
      const rows: string[] = [
        "Test Name,Model,Latency (ms),Time To First Token (ms),Completion Tokens,Total Tokens,Estimated Cost ($),Evidence Citations,Response Length,Success Rate,Consistency Score",
      ];

      for (const result of state.results) {
        const row = [
          result.testName,
          Object.keys(result.modelUsageSummary).join("|"),
          result.averageLatencyMs,
          result.averageTimeToFirstTokenMs,
          Math.round(result.runs.reduce((sum, m) => sum + m.completionTokens, 0) / result.runs.length),
          Math.round(result.runs.reduce((sum, m) => sum + m.estimatedTotalTokens, 0) / result.runs.length),
          result.totalCostEstimate.toFixed(6),
          result.averageCitationsPerRun,
          Math.round(result.runs.reduce((sum, m) => sum + m.responseLength, 0) / result.runs.length),
          result.successRate,
          (
            (result.consistency.reduce((sum, c) => sum + (c.semanticConsistency || 0), 0) / result.consistency.length) *
            100
          ).toFixed(1),
        ];
        rows.push(row.map((cell) => `"${cell}"`).join(","));
      }

      const dataStr = rows.join("\n");
      const dataBlob = new Blob([dataStr], { type: "text/csv" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `benchmarks-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [state.results]);

  return {
    state,
    runBenchmarks,
    clearResults,
    exportResults,
  };
}
