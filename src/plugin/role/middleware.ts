import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

export const adminMiddleware = createAuthMiddleware(async (ctx) => {
    const session = await getSessionFromCtx(ctx);
    if (!session) throw APIError.fromStatus("UNAUTHORIZED");
    if ((session.user as { role?: string }).role !== "ADMIN") {
        throw APIError.fromStatus("FORBIDDEN", { message: "Only ADMIN users can manage roles" });
    }
    return { session };
});