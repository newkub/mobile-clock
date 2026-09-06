import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { router } from "./orpc";
import type { Env } from "./db/env";

const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
});

export default {
  async fetch(request: Request, env: Env) {
    const { matched, response } = await handler.handle(request, {
      prefix: "/rpc",
      context: { env },
    });

    if (matched) return response;
    return env.ASSETS.fetch(request);
  },
};
