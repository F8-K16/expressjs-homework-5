/* eslint-disable no-unused-vars */
import { Job } from "bullmq";
import { bullMq } from "../utils/bullmq";

export const createWorkerWithHandlers = (
  queueName: string,
  handlers: Record<string, (job: Job) => Promise<void> | void>,
) => {
  return bullMq.createWorker(queueName, async (job: Job) => {
    const handler = handlers[job.name];

    console.log(`[${queueName}] Processing job: ${job.name}`);

    if (!handler) {
      throw new Error(`No handler for job: ${job.name}`);
    }

    await handler(job);
  });
};
