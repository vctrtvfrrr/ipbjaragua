<template>
  <div class="min-h-screen p-8">
    <NuxtLink
      to="/"
      class="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >&larr; Todos os boletins</NuxtLink
    >
    <template v-if="bulletin">
      <header class="mb-8">
        <p class="text-sm text-gray-500">{{ formatDate(bulletin.date) }} &middot; Boletim #{{ bulletin.index }}</p>
        <h1 class="text-2xl font-bold">{{ bulletin.title }}</h1>
      </header>
      <div
        class="bulletin-content"
        v-html="bulletin.content"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData, useRoute } from '#app';

type BulletinDetail = {
  title: string;
  date: string;
  index: number;
  year: number;
  content: string;
};

const route = useRoute();
const slug = route.params.slug as string;

const { data: bulletin } = await useAsyncData(`bulletin-${slug}`, () => $fetch<BulletinDetail>(`/api/content/${slug}`));

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
</script>
