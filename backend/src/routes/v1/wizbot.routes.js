import { Router } from "express";
import * as wizbotController from "../../controllers/wizbot.controller.js";
import * as agentController from "../../controllers/wizbotAgent.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { sendMessageSchema, botConfigSchema } from "../../validators/wizbot.validator.js";
import {
  createAgentSchema,
  updateAgentSchema,
  updateAgentStatusSchema,
} from "../../validators/wizbotAgent.validator.js";

const router = Router();

router.use(protect);

// Chat assistant
router.get("/conversations", wizbotController.listConversations);
router.get("/conversations/:id", wizbotController.getConversation);
router.delete("/conversations/:id", wizbotController.deleteConversation);

// :id can be "new" to start a fresh conversation in one call
router.post(
  "/conversations/:id/messages",
  validate(sendMessageSchema),
  wizbotController.sendMessage
);

router.patch("/config", validate(botConfigSchema), wizbotController.updateBotConfig);

// Automation agents (real scanning/matching/auto-apply bots)
router.get("/agents", agentController.listAgents);
router.post("/agents", validate(createAgentSchema), agentController.createAgent);
router.get("/agents/:id", agentController.getAgent);
router.patch("/agents/:id", validate(updateAgentSchema), agentController.updateAgent);
router.patch(
  "/agents/:id/status",
  validate(updateAgentStatusSchema),
  agentController.updateAgentStatus
);
router.delete("/agents/:id", agentController.deleteAgent);
router.post("/agents/:id/scan", agentController.triggerScan);
router.get("/agents/:id/activity", agentController.getAgentActivity);

export default router;
