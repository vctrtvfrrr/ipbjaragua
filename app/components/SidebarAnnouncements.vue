<template>
  <UCard
    v-if="items.length > 0"
    data-sidebar-block="announcements"
  >
    <template #header>
      <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Avisos</h2>
    </template>
    <ul class="space-y-4">
      <li
        v-for="announcement in items"
        :key="announcement.id"
      >
        <h3 class="font-semibold text-highlighted">{{ announcement.title }}</h3>
        <p
          v-if="announcement.description"
          class="text-sm text-muted"
        >
          {{ announcement.description }}
        </p>
        <UButton
          v-if="announcement.url"
          :to="announcement.url"
          variant="link"
          class="p-0 text-sm"
        >
          Acesse
        </UButton>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { AnnouncementListResponse } from '~~/shared/announcement';

const { data } = await useAsyncData('active-announcements', () =>
  $fetch<AnnouncementListResponse>('/api/announcements', { query: { status: 'active' } }),
);

const items = computed(() => data.value?.data ?? []);
</script>
