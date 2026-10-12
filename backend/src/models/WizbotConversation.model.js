import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true, _id: true }
);

const wizbotConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, default: "New conversation" },
    botConfig: {
      avatar: { type: String, default: "default" },
      persona: { type: String, default: "" },
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

wizbotConversationSchema.index({ userId: 1, updatedAt: -1 });

const WizbotConversation = mongoose.model("WizbotConversation", wizbotConversationSchema);

export default WizbotConversation;
