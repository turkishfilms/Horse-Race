import express from "express";
import { join } from "path";

const router = express.Router();

router.get("/train", (req, res) => {
  console.log("entered training");
  res.sendFile(join(process.cwd(), "public/train.html"));
});

router.get("/race", (req, res) => {
  console.log("off to the races");
  res.sendFile(join(process.cwd(), "public/race.html"));
});

router.get("/end", (req, res) => {
  console.log("Race has concluded");
  res.sendFile(join(process.cwd(), "public/finale.html"));
});

router.get("*", (req, res) => {
  console.log("wildcard activated");
});

export default router;
