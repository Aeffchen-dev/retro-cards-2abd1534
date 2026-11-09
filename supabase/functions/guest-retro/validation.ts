import { z } from 'npm:zod@3.25.76';
export const capability = z.string().regex(/^[a-f0-9]{64}$/);
export const requestSchema = z.discriminatedUnion('action', [
 z.object({action:z.literal('create'),name:z.string().trim().min(1).max(80)}),
 z.object({action:z.literal('join'),name:z.string().trim().min(1).max(80),invite:capability}),
 z.object({action:z.literal('read'),token:capability}),
 z.object({action:z.literal('update'),token:capability,answers:z.record(z.unknown()).refine(v=>JSON.stringify(v).length<=200000)}),
 z.object({action:z.literal('leave'),token:capability}),
]);
