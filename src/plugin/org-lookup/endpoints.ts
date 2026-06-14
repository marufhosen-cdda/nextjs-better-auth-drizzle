import { createAuthEndpoint } from "better-auth/api";
import * as z from "zod";

export const orgLookupEndpoints = {
  checkOrganizationExists: createAuthEndpoint(
    "/org-lookup/check",
    {
      method: "GET",
      query: z.object({ slug: z.string().min(1) }),
    },
    async (ctx) => {
      const org = await ctx.context.adapter.findOne<{
        id: string;
        name: string;
        slug: string;
        tenantType: string | null;
        domain: string | null;
      }>({
        model: "organization",
        where: [{ field: "slug", value: ctx.query.slug.toLowerCase().trim() }],
      });

      if (!org) {
        return ctx.json({ exists: false, organization: null });
      }

      return ctx.json({
        exists: true,
        organization: {
          name: org.name,
          slug: org.slug,
          tenantType: org.tenantType,
          domain: org.domain,
        },
      });
    },
  ),
};
