import mongoose from "mongoose";
import User from "../models/User.js";
import Document from "../models/Document.js";
import Generation from "../models/Generation.js";
import DocumentChat from "../models/DocumentChat.js";
import AuditLog from "../models/AuditLog.js";

// ======================================================
// ADMIN ACCESS CHECK
// ======================================================

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });

    return false;
  }

  return true;
};

// ======================================================
// ADMIN DASHBOARD OVERVIEW
// ======================================================

export const getAdminOverview = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      managerUsers,
      regularUsers,
      totalDocuments,
      readyDocuments,
      processingDocuments,
      failedDocuments,
      totalGenerations,
      totalChats,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        role: "manager",
      }),

      User.countDocuments({
        role: "user",
      }),

      Document.countDocuments({
        isDeleted: false,
      }),

      Document.countDocuments({
        isDeleted: false,
        status: "ready",
      }),

      Document.countDocuments({
        isDeleted: false,
        status: "processing",
      }),

      Document.countDocuments({
        isDeleted: false,
        status: "failed",
      }),

      Generation.countDocuments(),

      DocumentChat.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers,

        adminUsers,
        managerUsers,
        regularUsers,

        totalDocuments,
        readyDocuments,
        processingDocuments,
        failedDocuments,

        totalGenerations,
        totalChats,

        totalRequests:
          totalGenerations + totalChats,
      },
    });
  } catch (error) {
    console.error(
      "Admin overview error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin overview",
    });
  }
};

// ======================================================
// ROLE DISTRIBUTION
// ======================================================

export const getAdminRoleDistribution = async (
  req,
  res
) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const roles = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error(
      "Admin role distribution error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load role distribution",
    });
  }
};

// ======================================================
// RECENT USERS
// ======================================================

export const getAdminUsers = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const users = await User.find({})
      .select(
        "_id fullName email companyName role avatarInitial isActive lastLogin createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Admin users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
};

// ======================================================
// UPDATE USER STATUS
// ======================================================

export const updateAdminUserStatus = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID",
  });
}

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    if (String(req.user._id) === String(id) && !isActive) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own admin account",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "_id fullName email companyName role avatarInitial isActive lastLogin createdAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user,
    });
  } catch (error) {
    console.error("Admin user status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// ======================================================
// UPDATE USER ROLE
// ======================================================

export const updateAdminUserRole = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID",
  });
}

    const allowedRoles = ["admin", "manager", "user"];

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (String(req.user._id) === String(id) && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove admin access from your own account",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "_id fullName email companyName role avatarInitial isActive lastLogin createdAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Admin user role update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

// ======================================================
// RECENT DOCUMENTS
// ======================================================

export const getAdminDocuments = async (
  req,
  res
) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const documents = await Document.find({
      isDeleted: false,
    })
      .populate(
        "user",
        "fullName email"
      )
      .select(
        "_id originalName fileName mimeType size category status pages wordCount language documentType user createdAt processedAt indexedAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error(
      "Admin documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load documents",
    });
  }
};

// ======================================================
// RECENT AI ACTIVITY
// ======================================================

export const getAdminActivity = async (
  req,
  res
) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const [generationActivity, chatActivity] =
      await Promise.all([
        Generation.find({})
          .populate(
            "user",
            "fullName email"
          )
          .select(
            "_id user type title createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .limit(15)
          .lean(),

        DocumentChat.find({})
          .populate(
            "user",
            "fullName email"
          )
          .populate(
            "document",
            "originalName"
          )
          .select(
            "_id user document question createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .limit(15)
          .lean(),
      ]);

    const activity = [
      ...generationActivity.map(
        (item) => ({
          id: item._id,
          type: "generation",
          user: item.user,
          title:
            item.title ||
            item.type ||
            "AI Generation",
          createdAt: item.createdAt,
        })
      ),

      ...chatActivity.map(
        (item) => ({
          id: item._id,
          type: "document-chat",
          user: item.user,
          title:
            item.document?.originalName ||
            "Document Chat",
          description:
            item.question || "",
          createdAt: item.createdAt,
        })
      ),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 20);

    return res.status(200).json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error(
      "Admin activity error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load admin activity",
    });
  }
};

// ======================================================
// AUDIT ACTIVITY
// ======================================================

export const getAdminAuditActivity = async (
  req,
  res
) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const logs = await AuditLog.find({})
      .populate(
        "user",
        "fullName email role"
      )
      .sort({
        createdAt: -1,
      })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error(
      "Admin audit activity error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load audit activity",
    });
  }
};

// ======================================================
// COMPLETE ADMIN INTELLIGENCE
// ======================================================

export const getAdminIntelligence = async (
  req,
  res
) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const [
      overviewResult,
      rolesResult,
      usersResult,
      documentsResult,
      activityResult,
    ] = await Promise.all([
      getAdminOverviewData(),
      getAdminRoleData(),
      getAdminUsersData(),
      getAdminDocumentsData(),
      getAdminActivityData(),
    ]);

    return res.status(200).json({
      success: true,

      overview: overviewResult,

      roles: rolesResult,

      users: usersResult,

      documents: documentsResult,

      activity: activityResult,
    });
  } catch (error) {
    console.error(
      "Admin intelligence error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load admin intelligence",
    });
  }
};

// ======================================================
// INTERNAL DATA HELPERS
// ======================================================

const getAdminOverviewData = async () => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    adminUsers,
    managerUsers,
    regularUsers,
    totalDocuments,
    readyDocuments,
    processingDocuments,
    failedDocuments,
    totalGenerations,
    totalChats,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      isActive: true,
    }),

    User.countDocuments({
      isActive: false,
    }),

    User.countDocuments({
      role: "admin",
    }),

    User.countDocuments({
      role: "manager",
    }),

    User.countDocuments({
      role: "user",
    }),

    Document.countDocuments({
      isDeleted: false,
    }),

    Document.countDocuments({
      isDeleted: false,
      status: "ready",
    }),

    Document.countDocuments({
      isDeleted: false,
      status: "processing",
    }),

    Document.countDocuments({
      isDeleted: false,
      status: "failed",
    }),

    Generation.countDocuments(),

    DocumentChat.countDocuments(),
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,

    adminUsers,
    managerUsers,
    regularUsers,

    totalDocuments,
    readyDocuments,
    processingDocuments,
    failedDocuments,

    totalGenerations,
    totalChats,

    totalRequests:
      totalGenerations + totalChats,
  };
};

const getAdminRoleData = async () => {
  return User.aggregate([
    {
      $group: {
        _id: "$role",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        label: "$_id",
        count: 1,
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);
};

const getAdminUsersData = async () => {
  return User.find({})
    .select(
      "_id fullName email companyName role avatarInitial isActive lastLogin createdAt"
    )
    .sort({
      createdAt: -1,
    })
    .limit(20)
    .lean();
};

const getAdminDocumentsData = async () => {
  return Document.find({
    isDeleted: false,
  })
    .populate(
      "user",
      "fullName email"
    )
    .select(
      "_id originalName fileName mimeType size category status pages wordCount language documentType user createdAt processedAt indexedAt"
    )
    .sort({
      createdAt: -1,
    })
    .limit(20)
    .lean();
};

const getAdminActivityData = async () => {
  const [generationActivity, chatActivity] =
    await Promise.all([
      Generation.find({})
        .populate(
          "user",
          "fullName email"
        )
        .select(
          "_id user type title createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(15)
        .lean(),

      DocumentChat.find({})
        .populate(
          "user",
          "fullName email"
        )
        .populate(
          "document",
          "originalName"
        )
        .select(
          "_id user document question createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(15)
        .lean(),
    ]);

  return [
    ...generationActivity.map(
      (item) => ({
        id: item._id,
        type: "generation",
        user: item.user,
        title:
          item.title ||
          item.type ||
          "AI Generation",
        createdAt: item.createdAt,
      })
    ),

    ...chatActivity.map(
      (item) => ({
        id: item._id,
        type: "document-chat",
        user: item.user,
        title:
          item.document?.originalName ||
          "Document Chat",
        description:
          item.question || "",
        createdAt: item.createdAt,
      })
    ),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, 20);
};

// ======================================================
// AI TOOL USAGE ANALYTICS
// ======================================================

export const getAdminToolUsage = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const toolUsage = await getAdminToolUsageData();

    return res.status(200).json({
      success: true,
      toolUsage,
    });
  } catch (error) {
    console.error(
      "Admin tool usage error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load AI tool usage",
    });
  }
};

const getAdminToolUsageData = async () => {
  const [generationUsage, documentChatUsage] =
    await Promise.all([
      Generation.aggregate([
        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            _id: 0,
            tool: "$_id",
            count: 1,
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      DocumentChat.countDocuments(),
    ]);

  const generationLabels = {
    resume: "Resume Generator",
    email: "Email Generator",
    report: "Report Generator",
  };

  const usage = generationUsage.map((item) => ({
    tool: item.tool,
    label:
      generationLabels[item.tool] ||
      `${item.tool || "AI"} Generator`,
    count: item.count,
  }));

  if (documentChatUsage > 0) {
    usage.push({
      tool: "document-chat",
      label: "Document Chat",
      count: documentChatUsage,
    });
  }

  usage.sort((a, b) => b.count - a.count);

  const totalUsage = usage.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const usageWithPercentage = usage.map((item) => ({
    ...item,
    percentage:
      totalUsage > 0
        ? Number(
            ((item.count / totalUsage) * 100).toFixed(1)
          )
        : 0,
  }));

  return {
    totalUsage,
    usage: usageWithPercentage,
  };
};

// ======================================================
// ADMIN INTELLIGENCE ANALYTICS
// ======================================================

export const getAdminAnalytics = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const analytics = await getAdminAnalyticsData();

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error(
      "Admin analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin analytics",
    });
  }
};


// ======================================================
// ADMIN ANALYTICS DATA
// ======================================================

const getAdminAnalyticsData = async () => {
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);


  const [
    generationTrend,
    chatTrend,
    topGenerationUsers,
    topChatUsers,
    toolUsage,
  ] = await Promise.all([
    // --------------------------------------------------
    // DAILY GENERATION TREND
    // --------------------------------------------------

    Generation.aggregate([
      {
        $match: {
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
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    ]),


    // --------------------------------------------------
    // DAILY DOCUMENT CHAT TREND
    // --------------------------------------------------

    DocumentChat.aggregate([
      {
        $match: {
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
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    ]),


    // --------------------------------------------------
    // MOST ACTIVE GENERATION USERS
    // --------------------------------------------------

    Generation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },
      {
        $group: {
          _id: "$user",
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
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          count: 1,
          fullName: {
            $ifNull: [
              "$user.fullName",
              "Unknown User",
            ],
          },
          email: {
            $ifNull: [
              "$user.email",
              "",
            ],
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),


    // --------------------------------------------------
    // MOST ACTIVE DOCUMENT CHAT USERS
    // --------------------------------------------------

    DocumentChat.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },
      {
        $group: {
          _id: "$user",
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
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          count: 1,
          fullName: {
            $ifNull: [
              "$user.fullName",
              "Unknown User",
            ],
          },
          email: {
            $ifNull: [
              "$user.email",
              "",
            ],
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),


    // --------------------------------------------------
    // TOOL USAGE - LAST 30 DAYS
    // --------------------------------------------------

    Generation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
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
        $project: {
          _id: 0,
          tool: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]),
  ]);


  // --------------------------------------------------
  // COMBINE DAILY TRENDS
  // --------------------------------------------------

  const trendMap = new Map();


  generationTrend.forEach((item) => {
    trendMap.set(item.date, {
      date: item.date,
      generations: item.count,
      chats: 0,
      total: item.count,
    });
  });


  chatTrend.forEach((item) => {
    const existing = trendMap.get(item.date);

    if (existing) {
      existing.chats = item.count;
      existing.total =
        existing.generations + item.count;
    } else {
      trendMap.set(item.date, {
        date: item.date,
        generations: 0,
        chats: item.count,
        total: item.count,
      });
    }
  });


  const trend = Array.from(
    trendMap.values()
  ).sort(
    (a, b) =>
      new Date(a.date) -
      new Date(b.date)
  );


  // --------------------------------------------------
  // COMBINE USER ACTIVITY
  // --------------------------------------------------

  const userMap = new Map();


  topGenerationUsers.forEach((item) => {
    const key = String(item.userId);

    userMap.set(key, {
      userId: item.userId,
      fullName: item.fullName,
      email: item.email,
      generations: item.count,
      chats: 0,
      total: item.count,
    });
  });


  topChatUsers.forEach((item) => {
    const key = String(item.userId);
    const existing = userMap.get(key);

    if (existing) {
      existing.chats = item.count;
      existing.total =
        existing.generations + item.count;
    } else {
      userMap.set(key, {
        userId: item.userId,
        fullName: item.fullName,
        email: item.email,
        generations: 0,
        chats: item.count,
        total: item.count,
      });
    }
  });


  const mostActiveUsers = Array.from(
    userMap.values()
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);


  // --------------------------------------------------
  // TOOL LABELS
  // --------------------------------------------------

  const toolLabels = {
    resume: "Resume Generator",
    email: "Email Generator",
    report: "Report Generator",
  };


  const formattedToolUsage = toolUsage.map(
    (item) => ({
      tool: item.tool,
      label:
        toolLabels[item.tool] ||
        `${item.tool || "AI"} Generator`,
      count: item.count,
    })
  );


  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------

  const totalGenerations =
    generationTrend.reduce(
      (sum, item) => sum + item.count,
      0
    );


  const totalChats =
    chatTrend.reduce(
      (sum, item) => sum + item.count,
      0
    );


  return {
    period: "last-30-days",

    summary: {
      totalActivity:
        totalGenerations + totalChats,

      totalGenerations,

      totalChats,
    },

    trend,

    mostActiveUsers,

    toolUsage: formattedToolUsage,
  };
};