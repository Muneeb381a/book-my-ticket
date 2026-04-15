import ApiError from "../../common/utils/api-error.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import User from "./auth.model.js";

const authenticate = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) throw ApiError.unauthorized("Not authenticated");

  // verifyAccessToken throws JsonWebTokenError or TokenExpiredError on failure.
  // We catch both here and convert them to ApiError so the global handler
  // returns 401 JSON instead of 500.
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in again.";
    throw ApiError.unauthorized(message);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  req.user = {
    id:    user._id,
    role:  user.role,
    name:  user.name,
    email: user.email,
  };
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden("You do not have permission to perform this action");
    }
    next();
  };
};

export { authenticate, authorize };
