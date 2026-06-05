<template>
  <article class="mx-auto min-h-screen max-w-3xl p-8">
    <UButton
      to="/"
      variant="link"
      class="mb-6 p-0 text-sm"
      >&larr; Voltar para a home</UButton
    >
    <div
      v-if="errorStatus === 404"
      role="alert"
      class="rounded border border-warning/25 bg-warning/10 p-4 text-warning"
    >
      <p>Liturgia não encontrada.</p>
    </div>
    <div
      v-else-if="errorStatus"
      role="alert"
      class="rounded border border-error/25 bg-error/10 p-4 text-error"
    >
      <p>Não foi possível carregar a liturgia.</p>
      <UButton
        variant="link"
        class="mt-2 p-0 text-sm"
        @click="refresh()"
      >
        Tentar novamente
      </UButton>
    </div>
    <template v-else-if="liturgyForDisplay">
      <header class="mb-8 text-center">
        <h1 class="text-4xl font-bold text-highlighted">
          Liturgia do Culto
          <small class="block text-xl font-normal text-muted italic">
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
