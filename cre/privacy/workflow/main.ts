import { HTTPCapability, ConfidentialHTTPClient, handler, type Runtime, type HTTPPayload, Runner, decodeJson } from "@chainlink/cre-sdk";
import { z } from "zod";

const PayloadSchema = z.object({
  service_target: z.string().startsWith("http", "Must be a valid HTTP/HTTPS URL"),
  method: z.string().default("POST"),
  queryParameters: z.record(z.string(), z.any()).optional().default({}),
  paymentPayload: z.string().min(1, "Payment payload cannot be empty"),
});

type Payload = z.infer<typeof PayloadSchema>;

type Config = {
  facilitatorUrl?: string; // e.g. "https://api.x402.example.com/verify"
};

type ResponsePayload = {
  status: "success" | "error";
  message: string;
  errors?: any;
  statusCode?: number;
  data?: any;
};

const onHttpTrigger = (runtime: Runtime<Config>, httpPayload: HTTPPayload): ResponsePayload => {
  // Decode the generic HTTP payload
  let requestData: unknown;
  try {
    requestData = decodeJson(httpPayload.input);
    runtime.log(`Raw requestData: ${JSON.stringify(requestData)}`);
  } catch (err: any) {
    runtime.log(`Failed to parse input JSON: ${err.message}`);
    return { status: "error", message: "Invalid JSON format" };
  }

  // Validate using Zod schema
  const parsed = PayloadSchema.safeParse(requestData);

  if (!parsed.success) {
    runtime.log(`Invalid payload. Errors: ${JSON.stringify(parsed.error.errors)}`);
    return {
      status: "error",
      message: "Invalid payload schema",
      errors: parsed.error.errors,
    };
  }

  const payload = parsed.data;
  runtime.log(`Received ${payload.method} request for ${payload.service_target} with payment payload: ${payload.paymentPayload.substring(0, 10)}...`);

  // --- Payment Verification Logic ---
  const facilitatorUrl = runtime.config.facilitatorUrl || "https://echo.free.beeceptor.com/verify";
  runtime.log(`Verifying payment payload with x402 facilitator at ${facilitatorUrl}...`);

  const confidentialClient = new ConfidentialHTTPClient();

  // Use ConfidentialHTTPClient for verification (executes in DON mode easily)
  const verifyResFn = confidentialClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: facilitatorUrl,
      method: "POST",
      multiHeaders: {
        "Content-Type": { values: ["application/json"] }
      },
      bodyString: JSON.stringify({ paymentPayload: payload.paymentPayload }),
      encryptOutput: false
    }
  });

  const verifyRes = verifyResFn.result();

  if (verifyRes.statusCode !== 200) {
    runtime.log("Payment verification failed.");
    return {
      status: "error",
      message: "Payment verification failed"
    };
  }

  runtime.log("Payment verified securely.");

  // --- Confidential Execution ---
  runtime.log(`Executing confidential request to ${payload.service_target}...`);

  const serviceResFn = confidentialClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: payload.service_target,
      method: payload.method,
      multiHeaders: {
        "Content-Type": { values: ["application/json"] }
      },
      bodyString: JSON.stringify(payload.queryParameters),
      encryptOutput: false
    }
  });

  const serviceRes = serviceResFn.result();

  if (serviceRes.statusCode >= 400) {
    runtime.log(`Confidential service failed with status ${serviceRes.statusCode}`);
    return {
      status: "error",
      message: "Confidential execution failed",
      statusCode: serviceRes.statusCode
    };
  }

  runtime.log("Confidential request executed successfully.");

  let responseBody: unknown = "";
  try {
    responseBody = decodeJson(serviceRes.body);
  } catch {
    // Body is not JSON, returning raw representation might be limited, but we return empty for safety
    responseBody = "Success (Non-JSON)";
  }

  return {
    status: "success",
    message: "Trigger executed successfully",
    data: responseBody
  };
};

const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();

  return [
    handler(
      http.trigger({}),
      onHttpTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
