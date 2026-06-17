// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    // Hacemos title opcional porque lo tenemos en post.json
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    // Añadimos campos que vienen de post.json
    id: z.string().optional(),
    heroImage: z.string().optional(),
    images: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };