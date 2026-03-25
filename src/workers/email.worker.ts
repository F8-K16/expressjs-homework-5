import { Job } from "bullmq";
import { sendMailTemplate } from "../utils/mail";
import { createWorkerWithHandlers } from "./factory.worker";

const emailHandlers = {
  "send-email-verify": async (job: Job) => {
    const { to, subject, template, options } = job.data;
    await sendMailTemplate(to, subject, template, options);
  },
};

export const emailWorker = createWorkerWithHandlers("email", emailHandlers);
