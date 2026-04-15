import { Router } from "express";
import * as controller from "./auth.controller.js";
import validate from "../../common/middleware/validate.middleware.js";
import RegisterDto from "./dto/register.dto.js";
import LoginDto from "./dto/login.dto.js";
import ResetPasswordDto from "./dto/reset-password.dto.js";
import { authenticate } from "./auth.middleware.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and account management
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Ahmed Khan }
 *               email:    { type: string, example: ahmed@example.com }
 *               password: { type: string, example: secret123 }
 *               role:     { type: string, enum: [customer, seller], default: customer }
 *     responses:
 *       201: { description: Registered. Verification email sent. }
 *       409: { description: Email already exists }
 */
router.post("/register", validate(RegisterDto), controller.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: ahmed@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200: { description: Returns accessToken. Refresh token set in cookie. }
 *       401: { description: Invalid credentials }
 *       403: { description: Email not verified }
 */
router.post("/login", validate(LoginDto), controller.login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authenticate, controller.logout);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using the refresh token cookie
 *     responses:
 *       200: { description: New accessToken returned }
 *       401: { description: Refresh token missing or invalid }
 */
router.post("/refresh", controller.refresh);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile }
 */
router.get("/me", authenticate, controller.getMe);

/**
 * @openapi
 * /api/auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email address
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Invalid or expired token }
 */
router.get("/verify-email/:token", controller.verifyEmail);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: ahmed@example.com }
 *     responses:
 *       200: { description: Reset link sent if email exists }
 */
router.post("/forgot-password", controller.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token from email
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, example: newpassword123 }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
router.post("/reset-password/:token", validate(ResetPasswordDto), controller.resetPassword);

export default router;
