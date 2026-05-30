<template>
  <div class="min-h-screen p-8">
    <div
      v-if="errorStatus === 404"
      role="alert"
      class="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800"
    >
      <h2 class="text-2xl font-bold">Erro 404</h2>
      <p>Boletim não encontrado.</p>
      <NuxtLink
        to="/"
        class="block text-sm text-blue-600 hover:underline"
        >&larr; Ir para a home</NuxtLink
      >
    </div>
    <div
      v-else-if="errorStatus"
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
        <BulletinArticle :article="bulletin.article" />
        <BulletinLiturgy :liturgy="bulletin.liturgy" />
        <BulletinWeeklyAgenda :agenda="bulletin.agenda" />
        <BulletinAnnouncements :announcements="bulletin.announcements" />
        <BulletinBirthdays :birthdays="bulletin.birthdays" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAsyncData, useRoute } from '#app';
import { defineOgImage, formatDate, useSeoMeta } from '#imports';
import {
  BulletinAnnouncements,
  BulletinArticle,
  BulletinBirthdays,
  BulletinLiturgy,
  BulletinWeeklyAgenda,
} from '#components';
import { bulletinSeo } from '~/utils/seo';
import type { BulletinDetail } from '~~/shared/bulletin';

const route = useRoute();
const date = route.params.date as string;

const {
  data: bulletin,
  error,
  refresh,
} = await useAsyncData(`bulletin-${date}`, () => $fetch<BulletinDetail>(`/api/bulletins/${date}`));

const errorStatus = computed(() => (error.value as { statusCode?: number } | null)?.statusCode ?? null);

const seo = bulletinSeo({ date });
useSeoMeta(seo);
defineOgImage('Default', { title: seo.title, description: seo.description });
</script>
