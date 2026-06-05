<template>
  <article class="mx-auto min-h-screen max-w-3xl p-8">
    <UButton
      to="/"
      variant="link"
      class="mb-6 p-0 text-sm"
      >&larr; Voltar para a home</UButton
    >
    <div
      v-if="errorStatus === 404"
      role="alert"
      class="rounded border border-warning/25 bg-warning/10 p-4 text-warning"
    >
      <p>Artigo não encontrado.</p>
    </div>
    <div
      v-else-if="errorStatus === 410"
      role="alert"
      class="rounded border border-warning/25 bg-warning/10 p-4 text-warning"
    >
      <p>Este artigo foi removido.</p>
    </div>
    <div
      v-else-if="errorStatus"
      role="alert"
      class="rounded border border-error/25 bg-error/10 p-4 text-error"
    >
      <p>Não foi possível carregar o artigo.</p>
      <UButton
        variant="link"
        class="mt-2 p-0 text-sm"
        @click="refresh()"
      >
        Tentar novamente
      </UButton>
    </div>
    <template v-else-if="article">
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-highlighted">{{ article.title }}</h1>
        <p class="mt-2 text-sm text-muted">
          <span v-if="article.author">{{ article.author }} &middot; </span>
          <time :datetime="article.date">{{ formatDate(article.date) }}</time>
        </p>
      </header>
      <ArticleContent :markdown="article.content" />
    </template>
  </article>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '~~/shared/article';

const route = useRoute();
const slug = route.params.slug as string;

const {
  data: article,
  error,
  refresh,
} = await useAsyncData(`article-${slug}`, () => $fetch<ArticleDetail>(`/api/articles/${slug}`));

const errorStatus = computed(() => (error.value as { statusCode?: number } | null)?.statusCode ?? null);

const seo = article.value ? articleSeo(article.value) : homeSeo();
useSeoMeta(seo);
defineOgImage('Default', { title: seo.title, description: seo.description });
</script>
