import { app } from "./app.js";
import { env } from "./lib/env.js";

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port http://localhost:${env.PORT}`);
});
