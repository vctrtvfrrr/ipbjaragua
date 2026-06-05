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
      <p>Liturgia não encontrada.</p>
    </div>
    <div
      v-else-if="errorStatus"
      role="alert"
      class="rounded border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <p>Não foi possível carregar a liturgia.</p>
      <button
        type="button"
        class="mt-2 text-sm text-blue-600 hover:underline"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </div>
    <template v-else-if="liturgyForDisplay">
      <header class="mb-8 text-center">
        <h1 class="text-4xl font-bold text-green-900">
          Liturgia do Culto
          <small class="block text-xl font-normal text-mist-800 italic">
            <time :datetime="liturgyForDisplay.date">{{ formatDate(liturgyForDisplay.date) }}</time>
          </small>
        </h1>
      </header>
      <BulletinLiturgy :liturgy="liturgyForDisplay" />
    </template>
  </article>
</template>

<script setup lang="ts">
import type { LiturgyDetail } from '~~/shared/liturgy';

const route = useRoute();
const date = route.params.date as string;

const {
  data: liturgy,
  error,
  refresh,
} = await useAsyncData(`liturgy-${date}`, () => $fetch<LiturgyDetail>(`/api/liturgies/${date}`));

const errorStatus = computed(() => (error.value as { statusCode?: number } | null)?.statusCode ?? null);

const liturgyForDisplay = computed<LiturgyDetail | null>(() =>
  liturgy.value ? { ...liturgy.value, theme: liturgy.value.theme?.trim() || 'Liturgia do Culto' } : null,
);

const seo = liturgy.value ? liturgySeo(liturgy.value) : homeSeo();
useSeoMeta(seo);
defineOgImage('Default', { title: seo.title, description: seo.description });
</script>
