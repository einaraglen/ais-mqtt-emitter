// @ts-ignore
import dotenv from "dotenv";
dotenv.config();

import("./client").then((server) => server.run());