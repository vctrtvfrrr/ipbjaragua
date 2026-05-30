<template>
  <section
    v-if="items.length > 0"
    data-sidebar-block="liturgies"
  >
    <h2 class="mb-2 text-sm font-semibold tracking-wide text-mist-800 uppercase">Liturgias</h2>
    <ul class="space-y-2">
      <li
        v-for="liturgy in items"
        :key="liturgy.id"
      >
        <NuxtLink
          :to="`/liturgies/${liturgy.date}`"
          class="text-blue-600 hover:underline"
        >
          <time :datetime="liturgy.date">{{ formatDate(liturgy.date) }}</time>
          &mdash; {{ liturgy.theme?.trim() || 'Liturgia do Culto' }}
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAsyncData } from '#app';
import { formatDate } from '#imports';
import { NuxtLink } from '#components';
import type { LiturgyListResponse } from '~~/shared/liturgy';

const { data } = await useAsyncData('recent-liturgies', () =>
  $fetch<LiturgyListResponse>('/api/liturgies', { query: { limit: 5 } }),
);

const items = computed(() => data.value?.data ?? []);
</script>
