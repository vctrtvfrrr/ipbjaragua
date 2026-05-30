<template>
  <div class="min-h-screen p-8">
    <NuxtLink
      to="/"
      class="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >&larr; Início</NuxtLink
    >
    <div
      v-if="status === 'error'"
      role="alert"
      class="rounded border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <p>Não foi possível carregar o boletim.</p>
      <button
        type="button"
        class="mt-2 text-sm text-blue-600 hover:underline"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </div>
    <template v-else-if="bulletin">
      <header class="mb-8 text-center">
        <h1 class="text-5xl font-bold text-green-900">
          {{ bulletin.title ?? 'Boletim Semanal' }}
          <small class="block text-xl font-normal text-mist-800 italic">{{ formatDate(bulletin.date) }}</small>
        </h1>
      </header>
      <div class="bulletin-content">
        <BulletinAnnouncements :announcements="bulletin.announcements" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData, useRoute } from '#app';
import { formatDate, useSeoMeta } from '#imports';
import { BulletinAnnouncements } from '#components';
import { defineOgImageComponent } from '~/utils/og';
import { bulletinSeo } from '~/utils/seo';
import type { BulletinDetail } from '~~/shared/bulletin';

const route = useRoute();
const date = route.params.date as string;

const {
  data: bulletin,
  status,
  refresh,
} = await useAsyncData(`bulletin-${date}`, () => $fetch<BulletinDetail>(`/api/bulletins/${date}`));

const seo = bulletinSeo({ date });
useSeoMeta(seo);
defineOgImageComponent('Default', { title: seo.title, description: seo.description });
</script>
