<template>
  <div v-if="announcements !== null">
    <h2>Avisos</h2>
    <p
      v-if="announcements.length === 0"
      class="text-mist-600 italic"
    >
      Nenhum aviso para esta semana.
    </p>
    <template v-else>
      <div
        v-for="item in announcements"
        :key="item.id"
        class="bulletin-announcement"
      >
        <h3>{{ item.title }}</h3>
        <p v-if="item.description">
          {{ item.description }}
          <a
            v-if="item.url"
            :href="item.url"
            class="text-blue-600 hover:underline"
            >Mais informações</a
          >
        </p>
        <p v-else-if="item.url">
          <a
            :href="item.url"
            class="text-blue-600 hover:underline"
            >Mais informações</a
          >
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AnnouncementItem } from '~~/shared/announcement';

defineProps<{ announcements: AnnouncementItem[] | null }>();
</script>
