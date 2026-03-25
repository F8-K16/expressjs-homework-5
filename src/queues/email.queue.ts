import { bullMq } from "../utils/bullmq";
export const emailQueue = bullMq.createQueue("email");
