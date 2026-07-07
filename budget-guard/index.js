"use strict";

const functions = require("@google-cloud/functions-framework");

const projectId = process.env.TARGET_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "ayah-9b1d5";
const region = process.env.TARGET_REGION || "us-central1";
const service = process.env.TARGET_SERVICE || "ayah-studio-render";
const role = "roles/run.invoker";
const member = "allUsers";

functions.cloudEvent("budgetGuard", async (cloudEvent) => {
  const payload = decodePubSubPayload(cloudEvent);
  console.log("Budget guard payload:", JSON.stringify(redactPayload(payload)));

  if (payload.action === "enable") {
    await setPublicAccess(true);
    console.log("Cloud Run public access enabled for monthly reset.");
    return;
  }

  if (payload.action === "disable") {
    await setPublicAccess(false);
    console.log("Cloud Run public access disabled by manual guard action.");
    return;
  }

  if (!shouldStopForBudget(payload)) {
    console.log("Budget threshold is below 100%; no shutdown action taken.");
    return;
  }

  await setPublicAccess(false);
  console.log("Budget reached 100%; Cloud Run public access disabled.");
});

function shouldStopForBudget(payload) {
  const threshold = Number(payload.alertThresholdExceeded || 0);
  const cost = Number(payload.costAmount || 0);
  const budget = Number(payload.budgetAmount || 0);

  if (threshold >= 1) return true;
  if (budget > 0 && cost >= budget) return true;
  return false;
}

function decodePubSubPayload(cloudEvent) {
  const encoded = cloudEvent?.data?.message?.data;
  if (!encoded) return {};

  const text = Buffer.from(encoded, "base64").toString("utf8").trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const actionMatch = text.match(/action\s*:\s*(enable|disable)/i) || text.match(/^(enable|disable)$/i);
    if (actionMatch) return { action: actionMatch[1].toLowerCase() };
    return { raw: text };
  }
}

function redactPayload(payload) {
  const clone = { ...payload };
  delete clone.invoiceMonth;
  return clone;
}

async function setPublicAccess(enabled) {
  const policy = await requestRunIam("getIamPolicy", {});
  const bindings = Array.isArray(policy.bindings) ? policy.bindings : [];
  const binding = bindings.find((item) => item.role === role);

  if (enabled) {
    if (binding) {
      binding.members = unique([...(binding.members || []), member]);
    } else {
      bindings.push({ role, members: [member] });
    }
  } else if (binding) {
    binding.members = (binding.members || []).filter((item) => item !== member);
  }

  const cleanBindings = bindings.filter((item) => Array.isArray(item.members) && item.members.length > 0);
  await requestRunIam("setIamPolicy", {
    policy: {
      ...policy,
      bindings: cleanBindings
    }
  });
}

async function requestRunIam(action, body) {
  const token = await getAccessToken();
  const resource = `projects/${projectId}/locations/${region}/services/${service}`;
  const url = `https://run.googleapis.com/v2/${resource}:${action}`;
  const isGet = action === "getIamPolicy";
  const response = await fetch(url, {
    method: isGet ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: isGet ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${action} failed (${response.status}): ${text}`);
  }

  return text ? JSON.parse(text) : {};
}

async function getAccessToken() {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Metadata token failed (${response.status}): ${text}`);
  }
  return JSON.parse(text).access_token;
}

function unique(values) {
  return [...new Set(values)];
}
