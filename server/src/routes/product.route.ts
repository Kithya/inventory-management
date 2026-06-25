import { Router } from "express";
import { requireAdmin } from "../lib/auth.js";
import { createProduct, getProducts } from './../controllers/product.controller.js';

const router = Router();

router.get("/", getProducts);
router.post("/", requireAdmin, createProduct);

export default router;
