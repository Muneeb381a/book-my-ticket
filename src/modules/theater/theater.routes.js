import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateTheaterDto from "./dto/create-theater.dto.js";
import CreateScreenDto from "./dto/create-screen.dto.js";
import * as controller from "./theater.controller.js";

const router = Router();

// Public
router.get("/", controller.listTheaters);
router.get("/:id", controller.getTheaterById);
router.get("/:theaterId/screens/:screenId", controller.getScreenById);

// Admin only
router.post("/",
  authenticate, authorize("admin"),
  validate(CreateTheaterDto),
  controller.createTheater,
);

router.post("/:theaterId/screens",
  authenticate, authorize("admin"),
  validate(CreateScreenDto),
  controller.createScreen,
);

export default router;
