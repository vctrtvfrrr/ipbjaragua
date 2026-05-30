<template>
  <div
    v-if="article"
    class="bulletin-article"
  >
    <h2>{{ article.title }}</h2>
    <p
      v-if="article.author"
      class="text-sm text-mist-600 italic"
    >
      {{ article.author }}
    </p>
    <ArticleContent :markdown="article.content" />
    <NuxtLink
      :to="`/articles/${article.slug}`"
      class="mt-4 inline-block text-sm text-blue-600 hover:underline"
      >Ver artigo completo &rarr;</NuxtLink
    >
  </div>
</template>

<script setup lang="ts">
import { ArticleContent, NuxtLink } from '#components';
import type { ArticleDetail } from '~~/shared/article';

defineProps<{ article: ArticleDetail | null }>();
</script>
