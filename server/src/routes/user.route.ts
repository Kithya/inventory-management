import { Router } from "express";
import {
  createInvite,
  getInvites,
  getUser,
  revokeInvite,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", getUser);
router.get("/invites", getInvites);
router.post("/invites", createInvite);
router.delete("/invites/:inviteId", revokeInvite);

export default router;
