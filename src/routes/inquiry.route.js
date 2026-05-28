import express from "express";
import { 
    createInquiry,
    getAllInquiryList,
    getInquiryById,
    updateInquiry,
    deleteInquiry,
    getInquiryListByUserId,
 } from "../controllers/inquiry.controller.js";

const router = express.Router();

router.post("/create", createInquiry);

router.get("/list", getAllInquiryList);

router.get("/:id", getInquiryById);

router.put("/update/:id", updateInquiry);

router.delete("/delete/:id", deleteInquiry);

router.get("/user/:userid", getInquiryListByUserId);

export default router;