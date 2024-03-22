import express from "express";
import vueMiddleWare from "../middleware/middleware.js";
const app = express();
app.use(vueMiddleWare());
const root = process.cwd();
app.use(express.static(root));
app.listen(3000, () => console.log("server running at http://localhost:3000"));
