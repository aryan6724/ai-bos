export const notFound = (req, res, next) => {
  res.status(404);

  next(
    new Error(`Route not found: ${req.originalUrl}`)
  );
};

export const errorHandler = (err, req, res, next) => {
  let statusCode =
    res.statusCode === 200
      ? 500
      : res.statusCode;

  let message =
    err.message || "Server error";

  // ==========================================
  // INVALID MONGODB OBJECT ID
  // ==========================================
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // ==========================================
  // DUPLICATE MONGODB FIELD
  // ==========================================
  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate field value entered";
  }

  // ==========================================
  // MONGOOSE VALIDATION ERROR
  // ==========================================
  if (err.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // ==========================================
  // PRODUCTION ERROR MESSAGE PROTECTION
  // ==========================================
  if (
    process.env.NODE_ENV === "production" &&
    statusCode >= 500
  ) {
    message = "Internal server error";
  }

  // ==========================================
  // ERROR RESPONSE
  // ==========================================
  res.status(statusCode).json({
    success: false,
    message,
    stack:
      process.env.NODE_ENV === "production"
        ? null
        : err.stack,
  });
};