<template>
  <UCard
    v-if="items.length > 0"
    data-sidebar-block="liturgies"
  >
    <template #header>
      <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Liturgias</h2>
    </template>
    <ul class="space-y-2">
      <li
        v-for="liturgy in items"
        :key="liturgy.id"
      >
        <UButton
          :to="`/liturgies/${liturgy.date}`"
          variant="link"
          class="p-0"
        >
          <span>
            <time :datetime="liturgy.date">{{ formatDate(liturgy.date) }}</time>
            &mdash; {{ liturgy.theme?.trim() || 'Liturgia do Culto' }}
          </span>
        </UButton>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { LiturgyListResponse } from '~~/shared/liturgy';

const { data } = await useAsyncData('recent-liturgies', () =>
  $fetch<LiturgyListResponse>('/api/liturgies', { query: { limit: 5 } }),
);

const items = computed(() => data.value?.data ?? []);
</script>
