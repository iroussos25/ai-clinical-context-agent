import { z } from "zod";

export const AnalyzeRequestSchema = z.object({
  prompt: z.string().trim().min(2).max(3000),
  context: z.string().trim().min(10).max(180000),
});

const ExternalEvidenceSchema = z.object({
  title: z.string().max(500).optional(),
  abstractSnippet: z.string().max(10000).optional(),
  journal: z.string().max(300).optional(),
  publishedAt: z.string().max(100).optional(),
  sourceLabel: z.string().max(100).optional(),
});

const ClinicalReviewMessageSchema = z.object({
  role: z.union([z.literal("user"), z.literal("assistant")]),
  content: z.string().trim().min(1).max(12000),
});

export const ClinicalReviewRequestSchema = z.object({
  noteContext: z.string().trim().min(10).max(180000),
  externalEvidence: z.array(ExternalEvidenceSchema).max(16).default([]),
  messages: z.array(ClinicalReviewMessageSchema).min(1).max(20),
});

export const ClinicalReviewSourceRequestSchema = z.object({
  prompt: z.string().trim().min(2).max(3000),
  context: z.string().trim().min(10).max(180000),
});

export const RetrievalIndexRequestSchema = z.object({
  context: z.string().trim().min(10).max(180000),
  fileName: z.string().trim().min(1).max(255).nullable().optional(),
  sourceType: z.string().trim().min(1).max(60).optional(),
});

export const RetrievalQueryRequestSchema = z.object({
  query: z.string().trim().min(1).max(3000),
  docId: z.string().trim().min(1).max(80).nullable().optional(),
  topK: z.number().int().min(1).max(12).optional(),
});
