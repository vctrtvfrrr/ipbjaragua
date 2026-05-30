<template>
  <div v-if="birthdays !== null">
    <h2>Aniversariantes</h2>
    <p
      v-if="birthdays.length === 0"
      class="text-mist-600 italic"
    >
      Nenhum aniversariante esta semana.
    </p>
    <template v-else>
      <div
        v-for="group in birthdays"
        :key="group.date"
        class="bulletin-birthday-group"
      >
        <h3>{{ formatDate(group.date) }} — {{ group.weekday }}</h3>
        <ul>
          <li
            v-for="name in group.names"
            :key="name"
          >
            {{ name }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '#imports';
import type { BirthdayGroup } from '~~/shared/bulletin';

defineProps<{ birthdays: BirthdayGroup[] | null }>();
</script>
