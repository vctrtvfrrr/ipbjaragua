<template>
  <section
    v-if="items.length > 0"
    data-sidebar-block="announcements"
  >
    <h2 class="mb-2 text-sm font-semibold tracking-wide text-mist-800 uppercase">Avisos</h2>
    <ul class="space-y-4">
      <li
        v-for="announcement in items"
        :key="announcement.id"
      >
        <h3 class="font-semibold text-green-900">{{ announcement.title }}</h3>
        <p
          v-if="announcement.description"
          class="text-sm text-mist-900"
        >
          {{ announcement.description }}
        </p>
        <a
          v-if="announcement.url"
          :href="announcement.url"
          class="text-sm text-blue-600 hover:underline"
        >
          Acesse
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { AnnouncementListResponse } from '~~/shared/announcement';

const { data } = await useAsyncData('active-announcements', () =>
  $fetch<AnnouncementListResponse>('/api/announcements', { query: { status: 'active' } }),
);

const items = computed(() => data.value?.data ?? []);
</script>
