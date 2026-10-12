import WizbotAgent from "../models/WizbotAgent.model.js";
import WizbotActivity from "../models/WizbotActivity.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { runScanCycle, computeMetrics } from "../services/wizbotAgent.service.js";

// GET /api/v1/wizbot/agents
export const listAgents = asyncHandler(async (req, res) => {
  const agents = await WizbotAgent.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { agents }));
});

// POST /api/v1/wizbot/agents
export const createAgent = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.create({ ...req.body, userId: req.user._id });
  await WizbotActivity.create({
    agentId: agent._id,
    userId: req.user._id,
    type: "status_changed",
    message: `Agent "${agent.name}" created and set to running.`,
  });
  res.status(201).json(new ApiResponse(201, { agent }, "Wizbot agent created."));
});

// GET /api/v1/wizbot/agents/:id
export const getAgent = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!agent) throw ApiError.notFound("Agent not found.");
  res.status(200).json(new ApiResponse(200, { agent, metrics: computeMetrics(agent) }));
});

// PATCH /api/v1/wizbot/agents/:id
export const updateAgent = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!agent) throw ApiError.notFound("Agent not found.");

  const { criteria, ...rest } = req.body;
  Object.assign(agent, rest);
  if (criteria) agent.criteria = { ...agent.criteria.toObject(), ...criteria };
  await agent.save();

  res.status(200).json(new ApiResponse(200, { agent }, "Agent updated."));
});

// PATCH /api/v1/wizbot/agents/:id/status
export const updateAgentStatus = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!agent) throw ApiError.notFound("Agent not found.");

  agent.status = req.body.status;
  await agent.save();

  await WizbotActivity.create({
    agentId: agent._id,
    userId: req.user._id,
    type: "status_changed",
    message: `Agent "${agent.name}" set to ${agent.status}.`,
  });

  res.status(200).json(new ApiResponse(200, { agent }, "Agent status updated."));
});

// DELETE /api/v1/wizbot/agents/:id
export const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!agent) throw ApiError.notFound("Agent not found.");
  await WizbotActivity.deleteMany({ agentId: agent._id });
  res.status(200).json(new ApiResponse(200, null, "Agent deleted."));
});

// POST /api/v1/wizbot/agents/:id/scan
// Triggers one real scan cycle on demand (in addition to the background scheduler).
export const triggerScan = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!agent) throw ApiError.notFound("Agent not found.");
  if (agent.status !== "running") {
    throw ApiError.badRequest("Agent must be running to scan. Resume it first.");
  }

  const result = await runScanCycle(agent._id);
  const refreshed = await WizbotAgent.findById(agent._id);
  const metrics = computeMetrics(refreshed);

  // runScanCycle returns null when it couldn't actually claim the agent (a
  // scan - manual or scheduled - was already in progress at the moment this
  // request landed). Report that honestly instead of claiming success for a
  // scan that never ran.
  if (result === null) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { result, agent: refreshed, metrics, skipped: true },
          "A scan was already in progress for this agent - nothing new to run yet."
        )
      );
  }

  res.status(200).json(
    new ApiResponse(200, { result, agent: refreshed, metrics, skipped: false }, "Scan complete.")
  );
});

// GET /api/v1/wizbot/agents/:id/activity
export const getAgentActivity = asyncHandler(async (req, res) => {
  const agent = await WizbotAgent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!agent) throw ApiError.notFound("Agent not found.");

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const activity = await WizbotActivity.find({ agentId: agent._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("jobId", "title company");

  res.status(200).json(new ApiResponse(200, { activity }));
});
