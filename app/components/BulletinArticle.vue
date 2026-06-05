<template>
  <div
    v-if="article"
    class="bulletin-article"
  >
    <h2>{{ article.title }}</h2>
    <ArticleContent :markdown="article.content" />
    <p
      v-if="article.author"
      class="text-sm text-muted italic"
    >
      &mdash; {{ article.author }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '~~/shared/article';

defineProps<{ article: ArticleDetail | null }>();
</script>
