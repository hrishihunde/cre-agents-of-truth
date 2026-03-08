import {
  ConfidentialHTTPClient,
  decodeJson,
  handler,
  HTTPCapability,
  Runner,
  type HTTPPayload,
  type Runtime,
} from "@chainlink/cre-sdk";
import { z } from "zod";

const x402RequestSchema = z.object({
  resource_url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  parameters: z.record(z.string(), z.any()).optional().default({}),
  payment_proof: z.string().min(1),
  secret_id: z.string().optional(),
});

type Config = {
  facilitator_verify_url: string;
};

type x402Response = {
  status: "success" | "error";
  message: string;
  statusCode?: number;
  data?: any;
};

const onHttpTrigger = (runtime: Runtime<Config>, httpPayload: HTTPPayload): x402Response => {
  let requestData: unknown;
  try {
    requestData = typeof httpPayload.input === "object" ? httpPayload.input : decodeJson(httpPayload.input);
  } catch (err: any) {
    return { status: "error", message: "Invalid payload format" };
  }

  const parsed = x402RequestSchema.safeParse(requestData);
  if (!parsed.success) {
    return { status: "error", message: "Invalid x402 request parameters" };
  }

  const req = parsed.data;
  const confidentialClient = new ConfidentialHTTPClient();

  const verifyRes = confidentialClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: runtime.config.facilitator_verify_url,
      method: "POST",
      multiHeaders: { "Content-Type": { values: ["application/json"] } },
      bodyString: JSON.stringify({ paymentProof: req.payment_proof }),
      encryptOutput: false
    }
  }).result();

  if (verifyRes.statusCode !== 200) {
    return { status: "error", message: "x402 Proof Verification Failed", statusCode: verifyRes.statusCode };
  }

  const secrets = req.secret_id ? [{ key: req.secret_id, version: 1 }] : [];
  const headers: Record<string, { values: string[] }> = {
    "Content-Type": { values: ["application/json"] },
    "X-X402-Payment-Proof": { values: [req.payment_proof] }
  };
  if (req.secret_id) {
    headers["Authorization"] = { values: [`Bearer {{.${req.secret_id}}}`] };
  }

  const serviceRes = confidentialClient.sendRequest(runtime, {
    vaultDonSecrets: secrets,
    request: {
      url: req.resource_url,
      method: req.method,
      multiHeaders: headers,
      bodyString: req.method !== "GET" ? JSON.stringify(req.parameters) : "",
      encryptOutput: true
    }
  }).result();

  if (serviceRes.statusCode >= 400) {
    return { status: "error", message: "Resource Execution Failed", statusCode: serviceRes.statusCode };
  }

  let responseBody: any;
  try {
    responseBody = decodeJson(serviceRes.body);
  } catch {
    responseBody = new TextDecoder().decode(serviceRes.body);
  }

  return {
    status: "success",
    message: "Resource Executed Successfully",
    data: responseBody
  };
};

const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();
  return [handler(http.trigger({}), onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
