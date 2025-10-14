import { Job, Worker } from "bullmq";
import { redisConfig } from "../config/redis";
import Database from './../DB/db';
import { emailHelper } from "../helpers/emailHelper";
import { io } from "socket.io-client"
import config from "../config";
import { messageSend } from "../helpers/fireBaseHelper";
import { redisDB } from "../redis/connectedUsers";

// DB Connection
;( async () => {
  await Database.connect();
  console.log("MongoDB connected successfully");
})()

// Connect Socket
const socket = io(`http://${config.ip_address}:${config.port}`);
socket.on("connect", () => {
  console.log(`Socket connected on ${config.ip_address}:${config.port}`);
  socket.emit("email-worker", "Email worker connected with socket id: ", socket.id);
});

const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    console.log(`Processing job ${job.id} with name: ${job.name}`);

    if (job.name === "email-send") {
      await emailHelper.sendEmail(job.data);
    };

    if(job.name === "socket-notification") {
      socket.emit("notification", job.data);
    };

    if(job.name === "push-notification") {
      await messageSend(job.data);
    };

    if(job.name === "socket-message") {
      socket.emit("message", job.data);
    };
    
  },
  { connection: redisConfig }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});