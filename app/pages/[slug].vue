<template>
  <div class="min-h-screen p-8">
    <NuxtLink
      to="/"
      class="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >&larr; Todos os boletins</NuxtLink
    >
    <template v-if="bulletin">
      <header class="mb-8 text-center">
        <h1 class="text-5xl font-bold text-green-900">
          {{ bulletin.title }}
          <small class="block text-xl font-normal text-mist-600 italic">Igreja Presbiteriana de jaraguá do Sul</small>
        </h1>
        <p class="text-sm text-mist-800">
          {{ formatDate(bulletin.date) }} &middot; N° {{ bulletin.index }} &middot; Ano {{ bulletin.year }}
        </p>
      </header>
      <div class="bulletin-content">
        <BulletinArticle :html="bulletin.sections.article" />
        <hr />
        <BulletinWeeklyAgenda :html="bulletin.sections.weekly_agenda" />
        <BulletinAnnouncements :html="bulletin.sections.announcements" />
        <BulletinBirthdays :html="bulletin.sections.birthdays" />
        <hr />
        <BulletinLiturgy :html="bulletin.sections.liturgy" />
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

type BulletinSections = {
  article?: string;
  weekly_agenda?: string;
  announcements?: string;
  birthdays?: string;
  liturgy?: string;
};

type BulletinDetail = {
  title: string;
  date: string;
  index: number;
  year: number;
  sections: BulletinSections;
};

const route = useRoute();
const slug = route.params.slug as string;

const { data: bulletin } = await useAsyncData(`bulletin-${slug}`, () =>
  $fetch<BulletinDetail>(`/api/bulletins/${slug}`),
);
</script>
