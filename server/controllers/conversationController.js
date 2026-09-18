import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const MAX_CONVERSATIONS_PER_PAGE = 100;
const MAX_MESSAGES_PER_REQUEST = 200;

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const getUserId = (req) => req.user?._id;

const conversationFilter = (req, id, { activeOnly = false } = {}) => ({
  _id: id,
  user: getUserId(req),
  ...(activeOnly ? { archived: false } : {}),
});

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const normalizeTitle = (value) =>
  typeof value === "string" ? value.trim() : "";

// ======================================================
// CREATE CONVERSATION
// ======================================================

export const createConversation = async (req, res) => {
  try {
    if (!getUserId(req)) {
      return sendError(res, 401, "Authentication required");
    }

    const conversation = await Conversation.create({
      user: getUserId(req),
      title: "New Chat",
      lastMessage: "",
      pinned: false,
      archived: false,
    });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create Conversation:", error);

    return sendError(
      res,
      500,
      "Failed to create conversation"
    );
  }
};

// ======================================================
// GET ACTIVE CONVERSATIONS
// ======================================================

export const getConversations = async (req, res) => {
  try {
    if (!getUserId(req)) {
      return sendError(res, 401, "Authentication required");
    }

    const requestedLimit = Number(req.query?.limit);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), MAX_CONVERSATIONS_PER_PAGE)
        : MAX_CONVERSATIONS_PER_PAGE;

    const conversations = await Conversation.find({
      user: getUserId(req),
      archived: false,
    })
      .sort({
        pinned: -1,
        updatedAt: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Conversations:", error);

    return sendError(
      res,
      500,
      "Failed to fetch conversations"
    );
  }
};

// ======================================================
// GET CONVERSATION + MESSAGES
// ======================================================

export const getArchivedConversations = async (req, res) => {
  try {
    if (!getUserId(req)) {
      return sendError(res, 401, "Authentication required");
    }

    const requestedLimit = Number(req.query?.limit);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), MAX_CONVERSATIONS_PER_PAGE)
        : MAX_CONVERSATIONS_PER_PAGE;

    const conversations = await Conversation.find({
      user: getUserId(req),
      archived: true,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Archived Conversations:", error);
    return sendError(
      res,
      500,
      "Failed to fetch archived conversations"
    );
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne(
      conversationFilter(req, id, { activeOnly: true })
    ).lean();

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const requestedLimit = Number(req.query?.limit);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), MAX_MESSAGES_PER_REQUEST)
        : MAX_MESSAGES_PER_REQUEST;

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error("Get Conversation Messages:", error);

    return sendError(
      res,
      500,
      "Failed to load conversation"
    );
  }
};


// ======================================================
// GET CONVERSATION STATISTICS
// ======================================================

export const getConversationStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne(
      conversationFilter(req, id, { activeOnly: true })
    ).lean();

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const [summary] = await Message.aggregate([
      {
        $match: {
          conversation: conversation._id,
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: {
            $sum: {
              $cond: [{ $eq: ["$role", "user"] }, 1, 0],
            },
          },
          assistantMessages: {
            $sum: {
              $cond: [{ $eq: ["$role", "assistant"] }, 1, 0],
            },
          },
          systemMessages: {
            $sum: {
              $cond: [{ $eq: ["$role", "system"] }, 1, 0],
            },
          },
          totalCharacters: {
            $sum: { $strLenCP: { $ifNull: ["$content", ""] } },
          },
          userCharacters: {
            $sum: {
              $cond: [
                { $eq: ["$role", "user"] },
                { $strLenCP: { $ifNull: ["$content", ""] } },
                0,
              ],
            },
          },
          assistantCharacters: {
            $sum: {
              $cond: [
                { $eq: ["$role", "assistant"] },
                { $strLenCP: { $ifNull: ["$content", ""] } },
                0,
              ],
            },
          },
          firstMessageAt: { $min: "$createdAt" },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
    ]);

    const stats = summary || {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      systemMessages: 0,
      totalCharacters: 0,
      userCharacters: 0,
      assistantCharacters: 0,
      firstMessageAt: null,
      lastMessageAt: null,
    };

    const estimatedWords = await Message.aggregate([
      {
        $match: {
          conversation: conversation._id,
        },
      },
      {
        $project: {
          wordCount: {
            $size: {
              $filter: {
                input: {
                  $split: [
                    { $trim: { input: { $ifNull: ["$content", ""] } } },
                    " ",
                  ],
                },
                as: "word",
                cond: { $ne: ["$$word", ""] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: "$wordCount" },
        },
      },
    ]);

    const totalWords = estimatedWords[0]?.totalWords || 0;

    const totalMessages = stats.totalMessages || 0;
    const userMessages = stats.userMessages || 0;
    const assistantMessages = stats.assistantMessages || 0;
    const totalCharacters = stats.totalCharacters || 0;
    const userCharacters = stats.userCharacters || 0;
    const assistantCharacters = stats.assistantCharacters || 0;

    const firstMessageAt = stats.firstMessageAt || null;
    const lastMessageAt = stats.lastMessageAt || null;

    const durationMs =
      firstMessageAt && lastMessageAt
        ? Math.max(0, new Date(lastMessageAt).getTime() - new Date(firstMessageAt).getTime())
        : 0;

    const durationMinutes = durationMs / 60000;
    const durationHours = durationMs / 3600000;

    const averageMessageCharacters = totalMessages
      ? Math.round(totalCharacters / totalMessages)
      : 0;

    const averageUserMessageCharacters = userMessages
      ? Math.round(userCharacters / userMessages)
      : 0;

    const averageAssistantMessageCharacters = assistantMessages
      ? Math.round(assistantCharacters / assistantMessages)
      : 0;

    const userToAssistantRatio = assistantMessages
      ? Number((userMessages / assistantMessages).toFixed(2))
      : userMessages > 0
        ? null
        : 0;

    const messageFrequencyPerHour = durationHours > 0
      ? Number((totalMessages / durationHours).toFixed(2))
      : 0;

    let activityStatus = "new";

    if (lastMessageAt) {
      const ageMinutes = Math.max(
        0,
        (Date.now() - new Date(lastMessageAt).getTime()) / 60000
      );

      if (ageMinutes < 60) {
        activityStatus = "active";
      } else if (ageMinutes < 1440) {
        activityStatus = "recent";
      } else {
        activityStatus = "idle";
      }
    }

    const isLongConversation = totalMessages >= 50;
    const isLongFormConversation = totalCharacters >= 20000;

    return res.status(200).json({
      success: true,
      stats: {
        conversationId: conversation._id,
        title: conversation.title,
        pinned: conversation.pinned,
        archived: conversation.archived,
        totalMessages,
        userMessages,
        assistantMessages,
        systemMessages: stats.systemMessages || 0,
        totalCharacters,
        userCharacters,
        assistantCharacters,
        estimatedWords: totalWords,
        firstMessageAt,
        lastMessageAt,
        conversationDurationMs: durationMs,
        conversationDurationMinutes: Number(durationMinutes.toFixed(2)),
        averageMessageCharacters,
        averageUserMessageCharacters,
        averageAssistantMessageCharacters,
        userToAssistantRatio,
        messageFrequencyPerHour,
        activityStatus,
        isLongConversation,
        isLongFormConversation,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Conversation Stats:", error);

    return sendError(
      res,
      500,
      "Failed to fetch conversation statistics"
    );
  }
};

// ======================================================
// GET USER CONVERSATION ANALYTICS
// ======================================================

export const getConversationAnalytics = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, "Authentication required");
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      conversationSummary,
      messageSummary,
      recentActivity,
      dailyActivity,
      topConversations,
    ] = await Promise.all([
      Conversation.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            activeConversations: {
              $sum: { $cond: [{ $eq: ["$archived", false] }, 1, 0] },
            },
            archivedConversations: {
              $sum: { $cond: [{ $eq: ["$archived", true] }, 1, 0] },
            },
            pinnedConversations: {
              $sum: { $cond: [{ $eq: ["$pinned", true] }, 1, 0] },
            },
            conversationsCreatedLast24Hours: {
              $sum: { $cond: [{ $gte: ["$createdAt", last24Hours] }, 1, 0] },
            },
            conversationsCreatedLast7Days: {
              $sum: { $cond: [{ $gte: ["$createdAt", last7Days] }, 1, 0] },
            },
            conversationsCreatedLast30Days: {
              $sum: { $cond: [{ $gte: ["$createdAt", last30Days] }, 1, 0] },
            },
          },
        },
      ]),

      Message.aggregate([
        {
          $lookup: {
            from: "conversations",
            localField: "conversation",
            foreignField: "_id",
            as: "conversationData",
          },
        },
        { $unwind: "$conversationData" },
        { $match: { "conversationData.user": userId } },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            userMessages: {
              $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
            },
            assistantMessages: {
              $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] },
            },
            systemMessages: {
              $sum: { $cond: [{ $eq: ["$role", "system"] }, 1, 0] },
            },
            totalCharacters: {
              $sum: { $strLenCP: { $ifNull: ["$content", ""] } },
            },
            firstMessageAt: { $min: "$createdAt" },
            lastMessageAt: { $max: "$createdAt" },
          },
        },
      ]),

      Message.aggregate([
        {
          $lookup: {
            from: "conversations",
            localField: "conversation",
            foreignField: "_id",
            as: "conversationData",
          },
        },
        { $unwind: "$conversationData" },
        {
          $match: {
            "conversationData.user": userId,
            createdAt: { $gte: last30Days },
          },
        },
        {
          $group: {
            _id: null,
            messagesLast24Hours: {
              $sum: { $cond: [{ $gte: ["$createdAt", last24Hours] }, 1, 0] },
            },
            messagesLast7Days: {
              $sum: { $cond: [{ $gte: ["$createdAt", last7Days] }, 1, 0] },
            },
            messagesLast30Days: { $sum: 1 },
            activeConversationsLast24Hours: { $addToSet: {
              $cond: [
                { $gte: ["$createdAt", last24Hours] },
                "$conversation",
                null,
              ],
            } },
            activeConversationsLast7Days: { $addToSet: {
              $cond: [
                { $gte: ["$createdAt", last7Days] },
                "$conversation",
                null,
              ],
            } },
            activeConversationsLast30Days: { $addToSet: "$conversation" },
          },
        },
      ]),

      Message.aggregate([
        {
          $lookup: {
            from: "conversations",
            localField: "conversation",
            foreignField: "_id",
            as: "conversationData",
          },
        },
        { $unwind: "$conversationData" },
        {
          $match: {
            "conversationData.user": userId,
            createdAt: { $gte: last30Days },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            messages: { $sum: 1 },
            userMessages: {
              $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
            },
            assistantMessages: {
              $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            messages: 1,
            userMessages: 1,
            assistantMessages: 1,
          },
        },
      ]),

      Message.aggregate([
        {
          $lookup: {
            from: "conversations",
            localField: "conversation",
            foreignField: "_id",
            as: "conversationData",
          },
        },
        { $unwind: "$conversationData" },
        { $match: { "conversationData.user": userId } },
        {
          $group: {
            _id: "$conversation",
            totalMessages: { $sum: 1 },
            totalCharacters: {
              $sum: { $strLenCP: { $ifNull: ["$content", ""] } },
            },
            firstMessageAt: { $min: "$createdAt" },
            lastMessageAt: { $max: "$createdAt" },
          },
        },
        { $sort: { totalMessages: -1, lastMessageAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "conversations",
            localField: "_id",
            foreignField: "_id",
            as: "conversation",
          },
        },
        { $unwind: "$conversation" },
        {
          $project: {
            _id: 0,
            conversationId: "$_id",
            title: "$conversation.title",
            pinned: "$conversation.pinned",
            archived: "$conversation.archived",
            totalMessages: 1,
            totalCharacters: 1,
            firstMessageAt: 1,
            lastMessageAt: 1,
          },
        },
      ]),
    ]);

    const conversations = conversationSummary[0] || {
      totalConversations: 0,
      activeConversations: 0,
      archivedConversations: 0,
      pinnedConversations: 0,
      conversationsCreatedLast24Hours: 0,
      conversationsCreatedLast7Days: 0,
      conversationsCreatedLast30Days: 0,
    };

    const messages = messageSummary[0] || {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      systemMessages: 0,
      totalCharacters: 0,
      firstMessageAt: null,
      lastMessageAt: null,
    };

    const activity = recentActivity[0] || {
      messagesLast24Hours: 0,
      messagesLast7Days: 0,
      messagesLast30Days: 0,
      activeConversationsLast24Hours: [],
      activeConversationsLast7Days: [],
      activeConversationsLast30Days: [],
    };

    const totalMessages = messages.totalMessages || 0;
    const totalConversations = conversations.totalConversations || 0;
    const totalCharacters = messages.totalCharacters || 0;

    const firstMessageAt = messages.firstMessageAt || null;
    const lastMessageAt = messages.lastMessageAt || null;
    const durationMs =
      firstMessageAt && lastMessageAt
        ? Math.max(
            0,
            new Date(lastMessageAt).getTime() -
              new Date(firstMessageAt).getTime()
          )
        : 0;

    const durationHours = durationMs / 3600000;
    const averageMessagesPerConversation = totalConversations
      ? Number((totalMessages / totalConversations).toFixed(2))
      : 0;

    const averageCharactersPerMessage = totalMessages
      ? Math.round(totalCharacters / totalMessages)
      : 0;

    const averageConversationDurationMinutes = totalConversations
      ? Number(
          ((durationMs / 60000) / totalConversations).toFixed(2)
        )
      : 0;

    const userToAssistantRatio = messages.assistantMessages
      ? Number(
          (messages.userMessages / messages.assistantMessages).toFixed(2)
        )
      : messages.userMessages > 0
        ? null
        : 0;

    const messageFrequencyPerHour = durationHours > 0
      ? Number((totalMessages / durationHours).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        generatedAt: now,
        overview: {
          totalConversations,
          activeConversations: conversations.activeConversations || 0,
          archivedConversations: conversations.archivedConversations || 0,
          pinnedConversations: conversations.pinnedConversations || 0,
          totalMessages,
          userMessages: messages.userMessages || 0,
          assistantMessages: messages.assistantMessages || 0,
          systemMessages: messages.systemMessages || 0,
          totalCharacters,
        },
        activity: {
          messagesLast24Hours: activity.messagesLast24Hours || 0,
          messagesLast7Days: activity.messagesLast7Days || 0,
          messagesLast30Days: activity.messagesLast30Days || 0,
          activeConversationsLast24Hours:
            (activity.activeConversationsLast24Hours || []).filter(Boolean).length,
          activeConversationsLast7Days:
            (activity.activeConversationsLast7Days || []).filter(Boolean).length,
          activeConversationsLast30Days:
            (activity.activeConversationsLast30Days || []).filter(Boolean).length,
          conversationsCreatedLast24Hours:
            conversations.conversationsCreatedLast24Hours || 0,
          conversationsCreatedLast7Days:
            conversations.conversationsCreatedLast7Days || 0,
          conversationsCreatedLast30Days:
            conversations.conversationsCreatedLast30Days || 0,
        },
        averages: {
          averageMessagesPerConversation,
          averageCharactersPerMessage,
          averageConversationDurationMinutes,
          messageFrequencyPerHour,
          userToAssistantRatio,
        },
        timeline: dailyActivity,
        topConversations,
      },
    });
  } catch (error) {
    console.error("Get Conversation Analytics:", error);

    return sendError(
      res,
      500,
      "Failed to fetch conversation analytics"
    );
  }
};

// ======================================================
// RENAME CONVERSATION
// ======================================================

export const renameConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const title = normalizeTitle(req.body?.title);

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    if (!title) {
      return sendError(
        res,
        400,
        "Conversation title is required"
      );
    }

    if (title.length > 100) {
      return sendError(
        res,
        400,
        "Conversation title must be 100 characters or less"
      );
    }

    const conversation =
      await Conversation.findOneAndUpdate(
        conversationFilter(req, id, { activeOnly: true }),
        {
          $set: {
            title,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Rename Conversation:", error);

    return sendError(res, 500, "Rename failed");
  }
};

// ======================================================
// DELETE CONVERSATION
// ======================================================

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne(
      conversationFilter(req, id)
    );

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    // Delete child messages first so no orphaned messages remain.
    await Message.deleteMany({
      conversation: conversation._id,
    });

    await conversation.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Conversation deleted",
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Delete Conversation:", error);

    return sendError(res, 500, "Delete failed");
  }
};

// ======================================================
// PIN / UNPIN CONVERSATION
// ======================================================

export const togglePinConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne(
      conversationFilter(req, id, { activeOnly: true })
    );

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    conversation.pinned = !conversation.pinned;
    await conversation.save();

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Toggle Pin Conversation:", error);

    return sendError(
      res,
      500,
      "Failed to update pin status"
    );
  }
};

// ======================================================
// ARCHIVE CONVERSATION
// ======================================================

export const archiveConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne(
      conversationFilter(req, id, { activeOnly: true })
    );

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    conversation.archived = true;
    conversation.pinned = false;

    await conversation.save();

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Archive Conversation:", error);

    return sendError(
      res,
      500,
      "Failed to archive conversation"
    );
  }
};

export const unarchiveConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne(
      conversationFilter(req, id)
    );

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    if (!conversation.archived) {
      return sendError(res, 400, "Conversation is already active");
    }

    conversation.archived = false;
    await conversation.save();

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Unarchive Conversation:", error);
    return sendError(
      res,
      500,
      "Failed to unarchive conversation"
    );
  }
};

