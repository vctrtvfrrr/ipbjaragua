<template>
  <div class="mx-auto max-w-6xl gap-8 p-8 lg:grid lg:grid-cols-[1fr_20rem]">
    <main>
      <h1 class="mb-8 text-3xl font-bold text-green-900">Artigos</h1>

      <p
        v-if="articles.length === 0"
        class="text-mist-800"
      >
        Nenhum artigo publicado ainda.
      </p>

      <ul
        v-else
        class="space-y-8"
      >
        <li
          v-for="article in articles"
          :key="article.id"
        >
          <NuxtLink
            :to="`/articles/${article.slug}`"
            class="block hover:underline"
          >
            <h2 class="text-xl font-semibold text-green-900">{{ article.title }}</h2>
            <p class="mt-1 text-sm text-mist-800">
              <time :datetime="article.date">{{ formatDate(article.date) }}</time>
              <template v-if="article.author"> &middot; {{ article.author }}</template>
            </p>
          </NuxtLink>
          <p
            v-if="article.excerpt"
            class="mt-2 text-mist-900"
          >
            {{ article.excerpt }}
          </p>
        </li>
      </ul>

      <nav
        v-if="totalPages > 1"
        aria-label="Paginação"
        class="mt-10 flex flex-wrap gap-2"
      >
        <NuxtLink
          v-for="n in totalPages"
          :key="n"
          :to="{ query: { page: n } }"
          :aria-current="n === currentPage ? 'page' : undefined"
          class="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50 aria-[current=page]:bg-green-900 aria-[current=page]:text-white"
        >
          {{ n }}
        </NuxtLink>
      </nav>
    </main>

    <HomeSidebar />
  </div>
</template>

<script setup lang="ts">
import type { ArticleListResponse } from '~~/shared/article';

const seo = homeSeo();
useSeoMeta(seo);
defineOgImage('Default', { title: seo.title, description: seo.description });

const route = useRoute();
const currentPage = computed(() => Number(route.query.page) || 1);

const { data } = await useAsyncData(
  'articles-list',
  () => $fetch<ArticleListResponse>('/api/articles', { query: { page: currentPage.value } }),
  { watch: [currentPage] },
);

const articles = computed(() => data.value?.data ?? []);
const totalPages = computed(() => {
  const pagination = data.value?.pagination;
  return pagination ? Math.ceil(pagination.total / pagination.limit) : 0;
});
</script>
