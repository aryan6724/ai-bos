import Generation from "../models/Generation.js";
import Document from "../models/Document.js";
import DocumentChat from "../models/DocumentChat.js";
import User from "../models/User.js";

/* ===========================
   Helpers
=========================== */

const getLastSevenDays = () => {
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();

    date.setDate(date.getDate() - index);
    date.setHours(0, 0, 0, 0);

    days.push(date);
  }

  return days;
};

const getDayLabel = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const getDateKey = (date) => {
  return date.toISOString().slice(0, 10);
};

/* ===========================
   Recent Activities
=========================== */

const buildRecentActivities = ({
  generations,
  documents,
  chats,
}) => {
  const generationActivities = generations.map((item) => ({
    type: "generation",
    title: "AI document generated",
    description: `${item.title || "Untitled"} was generated using ${
      item.type || "AI"
    } workflow.`,
    createdAt: item.createdAt,
  }));

  const documentActivities = documents.map((item) => ({
    type: "document",
    title: "Document uploaded",
    description: `${item.originalName} was uploaded under ${
      item.category || "general"
    } category.`,
    createdAt: item.createdAt,
  }));

  const chatActivities = chats.map((item) => ({
    type: "chat",
    title: "Document question answered",
    description: item.document?.originalName
      ? `Question answered from ${item.document.originalName}.`
      : item.question || "Document question answered.",
    createdAt: item.createdAt,
  }));

  return [
    ...generationActivities,
    ...documentActivities,
    ...chatActivities,
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 8);
};

/* ===========================
   Weekly Usage
=========================== */

const buildWeeklyUsage = async (userId) => {
  const sevenDays = getLastSevenDays();
  const startDate = sevenDays[0];

  const [weeklyGenerations, weeklyChats] =
    await Promise.all([
      Generation.aggregate([
        {
          $match: {
            user: userId,
            createdAt: {
              $gte: startDate,
            },
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
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      DocumentChat.aggregate([
        {
          $match: {
            user: userId,
            createdAt: {
              $gte: startDate,
            },
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
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

  const generationMap = weeklyGenerations.reduce(
    (acc, item) => {
      acc[item._id] = item.count;
      return acc;
    },
    {}
  );

  const chatMap = weeklyChats.reduce(
    (acc, item) => {
      acc[item._id] = item.count;
      return acc;
    },
    {}
  );

  return sevenDays.map((date) => {
    const key = getDateKey(date);

    const generations =
      generationMap[key] || 0;

    const chats = chatMap[key] || 0;

    return {
      label: getDayLabel(date),
      date: key,
      generations,
      chats,
      count: generations + chats,
    };
  });
};

/* ===========================
   Dashboard Overview
=========================== */

export const getDashboardOverview = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user._id;
    const companyName = req.user.companyName;

    const documentFilter = {
      user: userId,
      isDeleted: false,
    };

    const teamFilter = companyName
      ? { companyName }
      : { _id: req.user._id };

    const [
      totalGenerations,
      totalDocuments,
      totalChats,
      totalTeamMembers,
      recentGenerations,
      recentDocuments,
      recentChats,
      usageBars,
    ] = await Promise.all([
      Generation.countDocuments({
        user: userId,
      }),

      Document.countDocuments(
        documentFilter
      ),

      DocumentChat.countDocuments({
        user: userId,
      }),

      User.countDocuments(teamFilter),

      Generation.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .select("title type createdAt"),

      Document.find(documentFilter)
        .sort({ createdAt: -1 })
        .limit(4)
        .select(
          "originalName category createdAt"
        ),

      DocumentChat.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .select("question createdAt")
        .populate(
          "document",
          "originalName"
        ),

      buildWeeklyUsage(userId),
    ]);

    const recentActivities =
      buildRecentActivities({
        generations: recentGenerations,
        documents: recentDocuments,
        chats: recentChats,
      }).slice(0, 6);

    return res.status(200).json({
      success: true,

      stats: [
        {
          key: "generations",
          title: "AI Generations",
          value: totalGenerations,
          change: "Live",
        },
        {
          key: "documents",
          title: "Documents",
          value: totalDocuments,
          change: "Live",
        },
        {
          key: "team",
          title: "Team Members",
          value: totalTeamMembers,
          change: "Live",
        },
        {
          key: "chats",
          title: "Document Chats",
          value: totalChats,
          change: "Live",
        },
      ],

      usageBars,

      summary: {
        totalRequests:
          totalGenerations + totalChats,
      },

      recentActivities,
    });
  } catch (error) {
    console.error(
      "Dashboard Analytics Error:",
      error
    );

    next(error);
  }
};

/* ===========================
   Full Analytics
=========================== */

export const getFullAnalytics = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user._id;
    const companyName = req.user.companyName;

    const documentFilter = {
      user: userId,
      isDeleted: false,
    };

    const teamFilter = companyName
      ? { companyName }
      : { _id: req.user._id };

    const [
      totalGenerations,
      totalDocuments,
      totalChats,
      totalTeamMembers,
      activeTeamMembers,
      generationTypes,
      documentCategories,
      teamRoles,
      recentGenerations,
      recentDocuments,
      recentChats,
      weeklyUsage,
    ] = await Promise.all([
      /* AI generations */
      Generation.countDocuments({
        user: userId,
      }),

      /* Active documents only */
      Document.countDocuments(
        documentFilter
      ),

      /* Document chats */
      DocumentChat.countDocuments({
        user: userId,
      }),

      /* Company team */
      User.countDocuments(teamFilter),

      /* Active company team */
      User.countDocuments({
        ...teamFilter,
        isActive: true,
      }),

      /* Generation breakdown */
      Generation.aggregate([
        {
          $match: {
            user: userId,
          },
        },
        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* Document category breakdown */
      Document.aggregate([
        {
          $match: documentFilter,
        },
        {
          $group: {
            _id: "$category",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* Team role breakdown */
      User.aggregate([
        {
          $match: teamFilter,
        },
        {
          $group: {
            _id: "$role",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /* Recent generations */
      Generation.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "title type createdAt"
        ),

      /* Recent documents */
      Document.find(documentFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "originalName category createdAt"
        ),

      /* Recent chats */
      DocumentChat.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "question createdAt"
        )
        .populate(
          "document",
          "originalName"
        ),

      /* Last 7 days */
      buildWeeklyUsage(userId),
    ]);

    const recentActivities =
      buildRecentActivities({
        generations: recentGenerations,
        documents: recentDocuments,
        chats: recentChats,
      });

    const totalRequests =
      totalGenerations + totalChats;

    return res.status(200).json({
      success: true,

      overview: {
        totalGenerations,
        totalDocuments,
        totalChats,
        totalTeamMembers,
        activeTeamMembers,
        totalRequests,
      },

      weeklyUsage,

      generationTypes:
        generationTypes.map((item) => ({
          label:
            item._id || "Other",
          count: item.count,
        })),

      documentCategories:
        documentCategories.map(
          (item) => ({
            label:
              item._id || "General",
            count: item.count,
          })
        ),

      teamRoles:
        teamRoles.map((item) => ({
          label:
            item._id || "Employee",
          count: item.count,
        })),

      recentActivities,
    });
  } catch (error) {
    console.error(
      "Full Analytics Error:",
      error
    );

    next(error);
  }
};