import AuditLog from "../models/AuditLog.js";

export const auditAction = ({
  action,
  resourceType,
  description,
  getResourceId,
  getMetadata,
}) => {
  return (req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", async () => {
      try {
        // ==========================================
        // 1. AUTHENTICATED USER CHECK
        // ==========================================

        if (!req.user?._id) {
          return;
        }

        // ==========================================
        // 2. RESOLVE DESCRIPTION
        // ==========================================

        let resolvedDescription =
          typeof description === "function"
            ? description(req, res)
            : description || action;

        // ==========================================
        // 3. RESOLVE RESOURCE ID
        // ==========================================

        let resourceId =
          req.params?.id ||
          req.params?.documentId ||
          "";

        if (typeof getResourceId === "function") {
          const customResourceId =
            getResourceId(req, res);

          if (customResourceId) {
            resourceId = customResourceId;
          }
        }

        // ==========================================
        // 4. RESOLVE METADATA
        // ==========================================

        let metadata = {};

        if (typeof getMetadata === "function") {
          metadata =
            getMetadata(req, res) || {};
        }

        // ==========================================
        // 5. CREATE AUDIT LOG
        // ==========================================

        await AuditLog.create({
          user: req.user._id,

          companyName:
            req.user.companyName ||
            "AI-BOS Workspace",

          action,

          resourceType,

          resourceId: resourceId
            ? String(resourceId)
            : "",

          description:
            resolvedDescription,

          method: req.method,

          path: req.originalUrl,

          statusCode: res.statusCode,

          outcome:
            res.statusCode >= 400
              ? "failure"
              : "success",

          ipAddress:
            req.ip || "",

          userAgent:
            req.get("user-agent") || "",

          durationMs:
            Date.now() - startedAt,

          metadata,
        });

      } catch (error) {
        // ==========================================
        // AUDIT FAILURE MUST NOT BREAK API RESPONSE
        // ==========================================

        console.error(
          "Audit log creation failed:",
          error.message
        );
      }
    });

    // ==========================================
    // CONTINUE REQUEST
    // ==========================================

    next();
  };
};