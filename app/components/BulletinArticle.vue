<template>
  <div
    v-if="article"
    class="bulletin-article"
  >
    <h2>{{ article.title }}</h2>
    <ArticleContent :markdown="article.content" />
    <p
      v-if="article.author"
      class="text-sm text-mist-600 italic"
    >
      &mdash; {{ article.author }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ArticleContent } from '#components';
import type { ArticleDetail } from '~~/shared/article';

defineProps<{ article: ArticleDetail | null }>();
</script>
