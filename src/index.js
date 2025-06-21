import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `Server is running on port http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((err) => {
    console.log("mongodb connection failed : ", err);
  });
