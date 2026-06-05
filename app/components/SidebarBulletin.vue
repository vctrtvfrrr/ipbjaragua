<template>
  <UCard
    v-if="date"
    data-sidebar-block="bulletin"
  >
    <template #header>
      <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Boletim</h2>
    </template>
    <UButton
      :to="`/bulletins/${date}`"
      variant="link"
      class="p-0"
    >
      <time :datetime="date">{{ formatDate(date) }}</time>
    </UButton>
  </UCard>
</template>

<script setup lang="ts">
const { data } = await useAsyncData('current-bulletin', () =>
  $fetch<{ date: string | null }>('/api/bulletins/current'),
);

const date = computed(() => data.value?.date ?? null);
</script>
