process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test-secret-please-change";
process.env.COOKIE_SECURE ??= "false";
process.env.RATE_LIMIT_ENABLED ??= "false";
process.env.REQUIRE_EMAIL_VERIFICATION ??= "false";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.RUN_SEED ??= "false";
process.env.UPLOAD_ROOT ??= "uploads-test";
