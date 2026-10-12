import { apiClient } from "./client";

// ---- Chat assistant ----

// GET /api/v1/wizbot/conversations
export async function listConversations() {
  const { data } = await apiClient.get("/wizbot/conversations");
  return data;
}

// GET /api/v1/wizbot/conversations/:id
export async function getConversation(id) {
  const { data } = await apiClient.get(`/wizbot/conversations/${id}`);
  return data;
}

// POST /api/v1/wizbot/conversations/:id/messages - id can be "new"
export async function sendMessage(id, message) {
  const { data } = await apiClient.post(`/wizbot/conversations/${id}/messages`, { message });
  return data;
}

// PATCH /api/v1/wizbot/config
export async function updateBotConfig(conversationId, avatar, persona) {
  const { data } = await apiClient.patch("/wizbot/config", { conversationId, avatar, persona });
  return data;
}

// DELETE /api/v1/wizbot/conversations/:id
export async function deleteConversation(id) {
  const { data } = await apiClient.delete(`/wizbot/conversations/${id}`);
  return data;
}

// ---- Automation agents (real scanning/matching/auto-apply bots) ----

// GET /api/v1/wizbot/agents
export async function listAgents() {
  const { data } = await apiClient.get("/wizbot/agents");
  return data;
}

// POST /api/v1/wizbot/agents
export async function createAgent(payload) {
  const { data } = await apiClient.post("/wizbot/agents", payload);
  return data;
}

// GET /api/v1/wizbot/agents/:id - includes real funnel/performance metrics
export async function getAgent(id) {
  const { data } = await apiClient.get(`/wizbot/agents/${id}`);
  return data;
}

// PATCH /api/v1/wizbot/agents/:id
export async function updateAgent(id, payload) {
  const { data } = await apiClient.patch(`/wizbot/agents/${id}`, payload);
  return data;
}

// PATCH /api/v1/wizbot/agents/:id/status - "running" | "paused" | "terminated"
export async function updateAgentStatus(id, status) {
  const { data } = await apiClient.patch(`/wizbot/agents/${id}/status`, { status });
  return data;
}

// DELETE /api/v1/wizbot/agents/:id
export async function deleteAgent(id) {
  const { data } = await apiClient.delete(`/wizbot/agents/${id}`);
  return data;
}

// POST /api/v1/wizbot/agents/:id/scan - triggers one real scan cycle now
export async function triggerScan(id) {
  const { data } = await apiClient.post(`/wizbot/agents/${id}/scan`);
  return data;
}

// GET /api/v1/wizbot/agents/:id/activity - real live activity log entries
export async function getAgentActivity(id, limit = 50) {
  const { data } = await apiClient.get(`/wizbot/agents/${id}/activity`, { params: { limit } });
  return data;
}
