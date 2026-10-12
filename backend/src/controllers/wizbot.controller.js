import WizbotConversation from "../models/WizbotConversation.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getWizbotReply } from "../services/wizbot.service.js";

// GET /api/v1/wizbot/conversations
export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await WizbotConversation.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .select("title botConfig updatedAt createdAt");

  res.status(200).json(new ApiResponse(200, { conversations }));
});

// GET /api/v1/wizbot/conversations/:id
export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await WizbotConversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!conversation) throw ApiError.notFound("Conversation not found.");
  res.status(200).json(new ApiResponse(200, { conversation }));
});

// POST /api/v1/wizbot/conversations/:id/messages
// If :id is "new", creates a fresh conversation first.
export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  let conversation;
  if (req.params.id === "new") {
    conversation = await WizbotConversation.create({
      userId: req.user._id,
      title: message.slice(0, 60),
    });
  } else {
    conversation = await WizbotConversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!conversation) throw ApiError.notFound("Conversation not found.");
  }

  conversation.messages.push({ role: "user", content: message });

  const reply = await getWizbotReply(conversation.messages, conversation.botConfig);

  conversation.messages.push({ role: "assistant", content: reply });
  await conversation.save();

    res.status(200).json(
    new ApiResponse(200, {
      conversation,
      reply,
      messages: conversation.messages,
    })
  );
});

// PATCH /api/v1/wizbot/config
// Updates avatar/persona for a specific conversation (creates one if none exists yet).
export const updateBotConfig = asyncHandler(async (req, res) => {
  const { conversationId, avatar, persona } = req.body;

  if (!conversationId) {
    throw ApiError.badRequest("conversationId is required to update bot config.");
  }

  const conversation = await WizbotConversation.findOneAndUpdate(
    { _id: conversationId, userId: req.user._id },
    { $set: { "botConfig.avatar": avatar, "botConfig.persona": persona } },
    { new: true }
  );

  if (!conversation) throw ApiError.notFound("Conversation not found.");

  res.status(200).json(new ApiResponse(200, { conversation }, "Bot configuration updated."));
});

// DELETE /api/v1/wizbot/conversations/:id
export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await WizbotConversation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!conversation) throw ApiError.notFound("Conversation not found.");
  res.status(200).json(new ApiResponse(200, null, "Conversation deleted."));
});
