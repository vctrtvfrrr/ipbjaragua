import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createArticle,
  softDeleteArticle,
  updateArticle,
  type Article,
  type CreateArticleInput,
} from '@/db/queries/articles'
import { defineEntityAction } from '@/lib/entity-action'
import { slugify } from '@/lib/slug'

const requiredSlug = z.string().min(1, 'Slug é obrigatório')

const articleFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  slug: z.string().trim().transform(slugify).pipe(requiredSlug),
  author_id: z.coerce.number().int().positive('Autor é obrigatório'),
  date: z.coerce.date(),
  excerpt: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  content: z.string().trim().min(1, 'Conteúdo é obrigatório'),
})

const updateArticleSchema = articleFieldsSchema.extend({
  id: z.coerce.number().int().positive('ID é obrigatório'),
  oldSlug: z.string().trim().min(1, 'Slug antigo é obrigatório'),
})

const deleteArticleSchema = z.object({
  id: z.coerce.number().int().positive('ID é obrigatório'),
})

export const createArticleAction = defineEntityAction({
  entity: 'articles',
  action: 'create',
  schema: articleFieldsSchema,
  write: ({ data, db }) => createArticle(data satisfies CreateArticleInput, db),
  revalidate: (row) => {
    revalidateArticlePaths(['/', '/articles', articlePath(row)])
  },
})

export const updateArticleAction = defineEntityAction({
  entity: 'articles',
  action: 'update',
  schema: updateArticleSchema,
  write: ({ data, db }) => {
    return updateArticle(
      data.id,
      {
        title: data.title,
        slug: data.slug,
        author_id: data.author_id,
        date: data.date,
        excerpt: data.excerpt,
        content: data.content,
      },
      db
    )
  },
  revalidate: (row, { data }) => {
    revalidateArticlePaths(['/', '/articles', `/articles/${data.oldSlug}`, articlePath(row), '/admin/articles'])
  },
})

export const deleteArticleAction = defineEntityAction({
  entity: 'articles',
  action: 'delete',
  schema: deleteArticleSchema,
  write: ({ data, db }) => softDeleteArticle(data.id, db),
  revalidate: (row) => {
    revalidateArticlePaths(['/', '/articles', articlePath(row), '/admin/articles'])
  },
})

function articlePath(article: Pick<Article, 'slug'>): string {
  return `/articles/${article.slug}`
}

function revalidateArticlePaths(paths: string[]) {
  for (const path of paths) revalidatePath(path)
}
