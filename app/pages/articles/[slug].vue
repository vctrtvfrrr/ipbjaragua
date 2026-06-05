<template>
  <article class="mx-auto min-h-screen max-w-3xl p-8">
    <NuxtLink
      to="/"
      class="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >&larr; Voltar para a home</NuxtLink
    >
    <div
      v-if="errorStatus === 404"
      role="alert"
      class="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800"
    >
      <p>Artigo não encontrado.</p>
    </div>
    <div
      v-else-if="errorStatus === 410"
      role="alert"
      class="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800"
    >
      <p>Este artigo foi removido.</p>
    </div>
    <div
      v-else-if="errorStatus"
      role="alert"
      class="rounded border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <p>Não foi possível carregar o artigo.</p>
      <button
        type="button"
        class="mt-2 text-sm text-blue-600 hover:underline"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </div>
    <template v-else-if="article">
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-green-900">{{ article.title }}</h1>
        <p class="mt-2 text-sm text-mist-800">
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
