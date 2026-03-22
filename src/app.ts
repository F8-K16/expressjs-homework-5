import express from "express";
import "dotenv/config";
import indexRoute from "./routes/index.route";
import { errorHandlingMiddleware } from "./middlewares/errorHandling.middleware";

const PORT: number = 3000;
const app = express();

app.use(express.json()); //parse body là json
app.use(express.urlencoded()); //parse body là urlendcoded

app.use("/api", indexRoute);

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(`Start server: http://localhost:${PORT}`);
});
