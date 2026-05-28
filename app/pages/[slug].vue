<template>
  <div class="min-h-screen p-8">
    <NuxtLink
      to="/"
      class="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >&larr; Todos os boletins</NuxtLink
    >
    <div
      v-if="bulletinStatus === 'error'"
      role="alert"
      class="rounded border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <p>Não foi possível carregar o boletim.</p>
      <button
        type="button"
        class="mt-2 text-sm text-blue-600 hover:underline"
        @click="refreshBulletin()"
      >
        Tentar novamente
      </button>
    </div>
    <template v-else-if="bulletin">
      <header class="mb-8 text-center">
        <h1 class="text-5xl font-bold text-green-900">
          Boletim Dominical
          <small class="block text-xl font-normal text-mist-800 italic">{{ formatDate(bulletin.date) }}</small>
        </h1>
      </header>
      <div class="bulletin-content">
        <BulletinArticle :html="bulletin.sections.article" />
        <hr />
        <BulletinWeeklyAgenda :html="bulletin.sections.weekly_agenda" />
        <BulletinAnnouncements :html="bulletin.sections.announcements" />
        <BulletinBirthdays :html="bulletin.sections.birthdays" />
        <hr />
        <div
          v-if="liturgyStatus === 'error'"
          role="alert"
          class="rounded border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <p>Não foi possível carregar a liturgia.</p>
          <button
            type="button"
            class="mt-2 text-sm text-blue-600 hover:underline"
            @click="refreshLiturgy()"
          >
            Tentar novamente
          </button>
        </div>
        <BulletinLiturgy
          v-else
          :liturgy="liturgy ?? null"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData, useRoute } from '#app';
import { formatDate } from '#imports';
import {
  BulletinArticle,
  BulletinAnnouncements,
  BulletinBirthdays,
  BulletinLiturgy,
  BulletinWeeklyAgenda,
} from '#components';
import type { LiturgyDetail } from '~~/shared/liturgy';

type BulletinSections = {
  article?: string;
  weekly_agenda?: string;
  announcements?: string;
  birthdays?: string;
};

type BulletinDetail = {
  title: string;
  date: string;
  sections: BulletinSections;
};

const route = useRoute();
const slug = route.params.slug as string;

const {
  data: bulletin,
  status: bulletinStatus,
  refresh: refreshBulletin,
} = await useAsyncData(`bulletin-${slug}`, () => $fetch<BulletinDetail>(`/api/bulletins/${slug}`));

const {
  data: liturgy,
  status: liturgyStatus,
  refresh: refreshLiturgy,
} = await useAsyncData(`liturgy-${slug}`, () =>
  $fetch<LiturgyDetail>(`/api/liturgies/${slug}`).catch((err: { statusCode?: number }) => {
    if (err?.statusCode === 404) return null;
    throw err;
  }),
);
</script>
