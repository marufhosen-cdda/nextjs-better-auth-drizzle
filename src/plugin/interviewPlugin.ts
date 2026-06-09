import { BetterAuthPlugin } from "better-auth"
import { createAuthEndpoint } from "better-auth/api"
import * as z from "zod"

const interviewPlugin = () => {
    return {
        id: "interview-plugin",
        schema: {
            // user: {
            //     fields: {
            //         role: {
            //             type: "string",
            //             defaultValue: "candidate",
            //         },
            //         department: {
            //             type: "string",
            //         },
            //         phone: {
            //             type: "string",
            //         },
            //     },
            // },
            interview: {
                modelName: "Interview",
                fields: {
                    title: {
                        type: "string",
                        required: true,
                    },
                    description: {
                        type: "string",
                    },
                    status: {
                        type: "string",
                        defaultValue: "scheduled",
                    },
                    scheduledAt: {
                        type: "date",
                    },
                    endedAt: {
                        type: "date",
                    },
                    createdAt: {
                        type: "date",
                        defaultValue: () => new Date(),
                        required: true,
                    },
                    updatedAt: {
                        type: "date",
                        defaultValue: () => new Date(),
                        onUpdate: () => new Date(),
                        required: true,
                    },
                    userId: {
                        type: "string",
                        required: true,
                        references: {
                            model: "user",
                            field: "id",
                            onDelete: "cascade",
                        },
                    },
                },
            },
            interviewQuestion: {
                modelName: "InterviewQuestion",
                fields: {
                    questionText: {
                        type: "string",
                        required: true,
                    },
                    category: {
                        type: "string",
                    },
                    weight: {
                        type: "number",
                        defaultValue: 1,
                    },
                    order: {
                        type: "number",
                        defaultValue: 0,
                    },
                    interviewId: {
                        type: "string",
                        required: true,
                        references: {
                            model: "Interview",
                            field: "id",
                            onDelete: "cascade",
                        },
                    },
                    createdAt: {
                        type: "date",
                        defaultValue: () => new Date(),
                        required: true,
                    },
                },
            },
            interviewAnswer: {
                modelName: "InterviewAnswer",
                fields: {
                    answerText: {
                        type: "string",
                        required: true,
                    },
                    score: {
                        type: "number",
                    },
                    notes: {
                        type: "string",
                    },
                    questionId: {
                        type: "string",
                        required: true,
                        references: {
                            model: "InterviewQuestion",
                            field: "id",
                            onDelete: "cascade",
                        },
                    },
                    userId: {
                        type: "string",
                        required: true,
                        references: {
                            model: "user",
                            field: "id",
                            onDelete: "cascade",
                        },
                    },
                    createdAt: {
                        type: "date",
                        defaultValue: () => new Date(),
                        required: true,
                    },
                },
            },
        },
        endpoints: {
            // List all interviews for the authenticated user
            getInterviews: createAuthEndpoint(
                "/interviews",
                {
                    method: "GET",
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }
                    const interviews = await ctx.context.adapter.findMany({
                        model: "Interview",
                        where: [
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                    })
                    return ctx.json({ interviews })
                }
            ),

            // Create a new interview
            createInterview: createAuthEndpoint(
                "/interviews/create",
                {
                    method: "POST",
                    body: z.object({
                        title: z.string(),
                        description: z.string().optional(),
                        scheduledAt: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }
                    const interview = await ctx.context.adapter.create({
                        model: "Interview",
                        data: {
                            title: ctx.body.title,
                            description: ctx.body.description ?? null,
                            scheduledAt: ctx.body.scheduledAt ? new Date(ctx.body.scheduledAt) : null,
                            status: "scheduled",
                            userId: ctx.context.session.user.id,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    })
                    return ctx.json({ interview }, { status: 201 })
                }
            ),

            // Get a single interview by ID
            getInterview: createAuthEndpoint(
                "/interviews/:id",
                {
                    method: "GET",
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }
                    const interview = await ctx.context.adapter.findOne({
                        model: "Interview",
                        where: [
                            { field: "id", operator: "eq", value: ctx.params.id },
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                    })
                    if (!interview) {
                        return ctx.json({ error: "Interview not found" }, { status: 404 })
                    }
                    return ctx.json({ interview })
                }
            ),

            // Update an interview
            updateInterview: createAuthEndpoint(
                "/interviews/:id",
                {
                    method: "PATCH",
                    body: z.object({
                        title: z.string().optional(),
                        description: z.string().optional(),
                        status: z.string().optional(),
                        scheduledAt: z.string().optional(),
                        endedAt: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }
                    const updateData: Record<string, any> = { updatedAt: new Date() }
                    if (ctx.body.title !== undefined) updateData.title = ctx.body.title
                    if (ctx.body.description !== undefined) updateData.description = ctx.body.description
                    if (ctx.body.status !== undefined) updateData.status = ctx.body.status
                    if (ctx.body.scheduledAt !== undefined) updateData.scheduledAt = new Date(ctx.body.scheduledAt)
                    if (ctx.body.endedAt !== undefined) updateData.endedAt = new Date(ctx.body.endedAt)

                    const interview = await ctx.context.adapter.update({
                        model: "Interview",
                        where: [
                            { field: "id", operator: "eq", value: ctx.params.id },
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                        update: updateData,
                    })
                    if (!interview) {
                        return ctx.json({ error: "Interview not found" }, { status: 404 })
                    }
                    return ctx.json({ interview })
                }
            ),

            // Delete an interview
            deleteInterview: createAuthEndpoint(
                "/interviews/:id",
                {
                    method: "DELETE",
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }
                    const interview = await ctx.context.adapter.findOne({
                        model: "Interview",
                        where: [
                            { field: "id", operator: "eq", value: ctx.params.id },
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                    })
                    if (!interview) {
                        return ctx.json({ error: "Interview not found" }, { status: 404 })
                    }
                    await ctx.context.adapter.delete({
                        model: "Interview",
                        where: [{ field: "id", operator: "eq", value: ctx.params.id }],
                    })
                    return ctx.json({ message: "Interview deleted" })
                }
            ),

            // Add questions to an interview
            addQuestions: createAuthEndpoint(
                "/interviews/:id/questions",
                {
                    method: "POST",
                    body: z.object({
                        questions: z.array(z.object({
                            questionText: z.string(),
                            category: z.string().optional(),
                            weight: z.number().optional(),
                            order: z.number().optional(),
                        })),
                    }),
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }

                    // Verify interview belongs to user
                    const interview = await ctx.context.adapter.findOne({
                        model: "Interview",
                        where: [
                            { field: "id", operator: "eq", value: ctx.params.id },
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                    })
                    if (!interview) {
                        return ctx.json({ error: "Interview not found" }, { status: 404 })
                    }

                    const now = new Date()
                    const createdQuestions = []
                    for (const q of ctx.body.questions) {
                        const question = await ctx.context.adapter.create({
                            model: "InterviewQuestion",
                            data: {
                                questionText: q.questionText,
                                category: q.category ?? null,
                                weight: q.weight ?? 1,
                                order: q.order ?? 0,
                                interviewId: ctx.params.id,
                                createdAt: now,
                            },
                        })
                        createdQuestions.push(question)
                    }

                    return ctx.json({ questions: createdQuestions }, { status: 201 })
                }
            ),

            // Get questions for an interview
            getQuestions: createAuthEndpoint(
                "/interviews/:id/questions",
                {
                    method: "GET",
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }

                    // Verify interview belongs to user
                    const interview = await ctx.context.adapter.findOne({
                        model: "Interview",
                        where: [
                            { field: "id", operator: "eq", value: ctx.params.id },
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                    })
                    if (!interview) {
                        return ctx.json({ error: "Interview not found" }, { status: 404 })
                    }

                    const questions = await ctx.context.adapter.findMany({
                        model: "InterviewQuestion",
                        where: [{ field: "interviewId", operator: "eq", value: ctx.params.id }],
                        limit: 100,
                        sortBy: { field: "order", direction: "asc" },
                    })

                    return ctx.json({ questions })
                }
            ),

            // Submit an answer to a question
            submitAnswer: createAuthEndpoint(
                "/answers",
                {
                    method: "POST",
                    body: z.object({
                        questionId: z.string(),
                        answerText: z.string(),
                        score: z.number().optional(),
                        notes: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }

                    const answer = await ctx.context.adapter.create({
                        model: "InterviewAnswer",
                        data: {
                            questionId: ctx.body.questionId,
                            userId: ctx.context.session.user.id,
                            answerText: ctx.body.answerText,
                            score: ctx.body.score ?? null,
                            notes: ctx.body.notes ?? null,
                            createdAt: new Date(),
                        },
                    })

                    return ctx.json({ answer }, { status: 201 })
                }
            ),

            // Get answers for an interview
            getAnswers: createAuthEndpoint(
                "/interviews/:id/answers",
                {
                    method: "GET",
                },
                async (ctx) => {
                    if (!ctx.context.session) {
                        return ctx.json({ error: "Unauthorized" }, { status: 401 })
                    }

                    // Verify interview belongs to user
                    const interview = await ctx.context.adapter.findOne({
                        model: "Interview",
                        where: [
                            { field: "id", operator: "eq", value: ctx.params.id },
                            { field: "userId", operator: "eq", value: ctx.context.session.user.id }
                        ],
                    })
                    if (!interview) {
                        return ctx.json({ error: "Interview not found" }, { status: 404 })
                    }

                    const answers = await ctx.context.adapter.findMany({
                        model: "InterviewAnswer",
                        where: [{ field: "userId", operator: "eq", value: ctx.context.session.user.id }],
                        join: {
                            InterviewQuestion: true,
                        },
                    })

                    // Filter to only answers for questions in this interview
                    const filteredAnswers = (answers as any[]).filter(
                        (a) => (a.InterviewQuestion as any)?.interviewId === ctx.params.id
                    )

                    return ctx.json({ answers: filteredAnswers })
                }
            ),
        },
    } satisfies BetterAuthPlugin
}

export { interviewPlugin }
