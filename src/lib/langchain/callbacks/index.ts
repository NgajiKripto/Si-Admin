import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { MetricsHandler } from "./metrics-handler";
import { TracingHandler } from "./tracing-handler";

export { MetricsHandler } from "./metrics-handler";
export { TracingHandler } from "./tracing-handler";

export function createCallbacks(
  requestId: string,
  sessionId: string
): {
  metricsHandler: MetricsHandler;
  tracingHandler: TracingHandler;
  callbacks: BaseCallbackHandler[];
} {
  const metricsHandler = new MetricsHandler(requestId, sessionId);
  const tracingHandler = new TracingHandler(requestId, sessionId);

  return {
    metricsHandler,
    tracingHandler,
    callbacks: [metricsHandler, tracingHandler],
  };
}
