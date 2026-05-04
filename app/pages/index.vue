<template>
  <div class="min-h-screen p-8">
    <h1 class="mb-8 text-2xl font-bold">Boletins Dominicais</h1>
    <ul class="space-y-2">
      <li
        v-for="slug in slugs"
        :key="slug"
      >
        <NuxtLink
          :to="`/${slug}`"
          class="text-blue-600 hover:underline"
        >
          {{ formatDate(slug) }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from '#app';
import { formatDate } from '#imports';

const { data: slugs } = await useAsyncData('bulletins', () => $fetch<string[]>('/api/content'));
</script>
