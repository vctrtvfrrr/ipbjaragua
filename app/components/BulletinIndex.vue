<template>
  <ul class="space-y-2">
    <li
      v-for="bulletin in bulletins"
      :key="bulletin"
    >
      <NuxtLink
        :to="`/bulletins/${bulletin}`"
        class="text-blue-600 hover:underline"
      >
        {{ formatDate(bulletin) }}
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { formatDate } from '#imports';

defineProps<{ bulletins: string[] }>();
</script>
