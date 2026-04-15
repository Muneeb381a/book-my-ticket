import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateShowDto from "./dto/create-show.dto.js";
import * as controller from "./show.controller.js";

const router = Router();

// Public — anyone can browse shows
router.get("/", controller.listShows);

// Authenticated — seat map reveals lock state, so we require login
router.get("/:id/seats", authenticate, controller.getShowSeatMap);

// Admin only
router.post("/",
  authenticate, authorize("admin"),
  validate(CreateShowDto),
  controller.createShow,
);

router.patch("/:id/cancel",
  authenticate, authorize("admin"),
  controller.cancelShow,
);

export default router;
