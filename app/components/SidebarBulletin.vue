<template>
  <section
    v-if="date"
    data-sidebar-block="bulletin"
  >
    <h2 class="mb-2 text-sm font-semibold tracking-wide text-mist-800 uppercase">Boletim</h2>
    <NuxtLink
      :to="`/bulletins/${date}`"
      class="text-blue-600 hover:underline"
    >
      <time :datetime="date">{{ formatDate(date) }}</time>
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAsyncData } from '#app';
import { formatDate } from '#imports';
import { NuxtLink } from '#components';

const { data } = await useAsyncData('current-bulletin', () =>
  $fetch<{ date: string | null }>('/api/bulletins/current'),
);

const date = computed(() => data.value?.date ?? null);
</script>
