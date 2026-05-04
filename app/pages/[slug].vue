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
        <div
          v-if="bulletin.sections.article"
          class="bulletin-article"
          v-html="bulletin.sections.article"
        />

        <hr />

        <div v-if="bulletin.sections.weekly_agenda">
          <h2>Agenda Semanal</h2>
          <div
            class="bulletin-weekly-agenda"
            v-html="bulletin.sections.weekly_agenda"
          />
        </div>

        <div v-if="bulletin.sections.announcements">
          <h2>Avisos</h2>
          <div
            class="bulletin-announcements"
            v-html="bulletin.sections.announcements"
          />
        </div>

        <div v-if="bulletin.sections.birthdays">
          <h2>Aniversariantes</h2>
          <div
            class="bulletin-birthdays"
            v-html="bulletin.sections.birthdays"
          />
        </div>

        <hr />

        <div v-if="bulletin.sections.liturgy">
          <h2>Liturgia do Culto</h2>
          <div
            class="bulletin-liturgy"
            v-html="bulletin.sections.liturgy"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData, useRoute } from '#app';
import { formatDate } from '#imports';

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

const { data: bulletin } = await useAsyncData(`bulletin-${slug}`, () => $fetch<BulletinDetail>(`/api/content/${slug}`));
</script>
