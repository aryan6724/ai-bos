import AuditLog from "../models/AuditLog.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_PAGE = 100000;
const MAX_SEARCH_LENGTH = 100;

const isValidDate = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const page = Number.isFinite(requestedPage)
      ? Math.min(Math.max(requestedPage, 1), MAX_PAGE)
      : 1;

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    // Never fall back to a shared/default workspace for a tenant-scoped query.
    const companyName =
      typeof req.user?.companyName === "string"
        ? req.user.companyName.trim()
        : "";

    if (!companyName) {
      return res.status(403).json({
        success: false,
        message: "Workspace access is not configured.",
      });
    }

    const query = { companyName };

    if (typeof req.query.search === "string") {
      const search = req.query.search.trim().slice(0, MAX_SEARCH_LENGTH);

      if (search) {
        // Escape regex metacharacters so search input is treated literally.
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        query.$or = [
          { action: { $regex: escapedSearch, $options: "i" } },
          { description: { $regex: escapedSearch, $options: "i" } },
        ];
      }
    }

    // AuditLog.action is intentionally a free string in the current model.
    // Validate length/type here, but do not impose an artificial enum.
    if (req.query.action !== undefined) {
      if (
        typeof req.query.action !== "string" ||
        !req.query.action.trim() ||
        req.query.action.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid audit action filter.",
        });
      }

      query.action = req.query.action.trim();
    }

    // AuditLog.resourceType is also a free string in the current model.
    if (req.query.resourceType !== undefined) {
      if (
        typeof req.query.resourceType !== "string" ||
        !req.query.resourceType.trim() ||
        req.query.resourceType.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid resource type filter.",
        });
      }

      query.resourceType = req.query.resourceType.trim();
    }

    if (
      req.query.outcome !== undefined &&
      req.query.outcome !== "success" &&
      req.query.outcome !== "failure"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit outcome filter.",
      });
    }

    if (req.query.outcome) {
      query.outcome = req.query.outcome;
    }

    const hasStartDate = req.query.startDate !== undefined;
    const hasEndDate = req.query.endDate !== undefined;

    if (hasStartDate !== hasEndDate) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required.",
      });
    }

    if (hasStartDate && hasEndDate) {
      if (
        !isValidDate(req.query.startDate) ||
        !isValidDate(req.query.endDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date range.",
        });
      }

      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before end date.",
        });
      }

      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("user", "fullName email role avatarInitial")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasPrevious: page > 1,
        hasNext: page < pages,
      },
    });
  } catch (error) {
    next(error);
  }
};
