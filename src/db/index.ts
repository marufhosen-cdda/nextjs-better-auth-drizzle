import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
	try {
		const { env } = getCloudflareContext();
		return drizzle(env.DB, { schema });
	} catch {
		// No Cloudflare runtime (CLI codegen, build scripts, etc.).
		// The better-auth `generate` CLI only reads adapter config — it
		// never invokes DB methods — so an empty stub is sufficient.
		return {} as ReturnType<typeof drizzle>;
	}
}
