<template>
  <div class="min-h-screen p-8">
    <h1 class="mb-8 text-2xl font-bold">Boletins Dominicais</h1>
    <BulletinIndex :bulletins="bulletins" />
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from '#app';
import { BulletinIndex } from '#components';

const { data: bulletins } = await useAsyncData('bulletins', () => $fetch<string[]>('/api/bulletins'));
</script>
