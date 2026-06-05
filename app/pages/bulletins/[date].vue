<template>
  <div class="min-h-screen p-8">
    <div
      v-if="errorStatus === 404"
      role="alert"
      class="rounded border border-warning/25 bg-warning/10 p-4 text-warning"
    >
      <h2 class="text-2xl font-bold">Erro 404</h2>
      <p>Boletim não encontrado.</p>
      <UButton
        to="/"
        variant="link"
        class="p-0 text-sm"
        >&larr; Ir para a home</UButton
      >
    </div>
    <div
      v-else-if="errorStatus"
      role="alert"
      class="rounded border border-error/25 bg-error/10 p-4 text-error"
    >
      <p>Não foi possível carregar o boletim.</p>
      <UButton
        variant="link"
        class="mt-2 p-0 text-sm"
        @click="refresh()"
      >
        Tentar novamente
      </UButton>
    </div>
    <template v-else-if="bulletin">
      <header class="mb-8 text-center">
        <h1 class="text-5xl font-bold text-highlighted">
          {{ bulletin.title ?? 'Boletim Semanal' }}
          <small class="block text-xl font-normal text-muted italic">{{ formatDate(bulletin.date) }}</small>
        </h1>
      </header>
      <div class="bulletin-content">
        <BulletinArticle :article="bulletin.article" />
        <BulletinWeeklyAgenda :agenda="bulletin.agenda" />
        <BulletinAnnouncements :announcements="bulletin.announcements" />
        <BulletinBirthdays :birthdays="bulletin.birthdays" />
        <BulletinLiturgy :liturgy="bulletin.liturgy" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
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
