import * as authService from "./auth.service.js";
import ApiResponse from "../../common/utils/api-response.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = async (req, res) => {
  const user = await authService.register(req.body);
  ApiResponse.created(res, "Registration successful. Please verify your email.", user);
};

const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  ApiResponse.ok(res, "Login successful", { user, accessToken });
};

const logout = async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  ApiResponse.ok(res, "Logout successful");
};

const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  const { accessToken } = await authService.refresh(token);
  ApiResponse.ok(res, "Token refreshed", { accessToken });
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.ok(res, "Password reset successful. Please log in with your new password.");
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always respond with 200 — don't reveal whether email exists
  ApiResponse.ok(res, "If that email is registered, a reset link has been sent");
};

const verifyEmail = async (req, res) => {
  await authService.verifyEmail(req.params.token);
  ApiResponse.ok(res, "Email verified successfully");
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ApiResponse.ok(res, "User profile", user);
};

export { register, login, logout, refresh, forgotPassword, resetPassword, verifyEmail, getMe };
