<template>
  <div v-if="birthdays !== null">
    <h2>Aniversariantes</h2>
    <p
      v-if="birthdays.length === 0"
      class="text-muted italic"
    >
      Nenhum aniversariante esta semana.
    </p>
    <template v-else>
      <div
        v-for="group in birthdays"
        :key="group.date"
        class="bulletin-birthday-group"
      >
        <h3>{{ formatDayMonth(group.date) }} — {{ group.weekday }}</h3>
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
import type { BirthdayGroup } from '~~/shared/bulletin';

defineProps<{ birthdays: BirthdayGroup[] | null }>();

// Birthday dates use a short day/month form (e.g. "23/04"); the year is irrelevant here. This format is
// local to this component, unlike the long-form formatDate used elsewhere.
function formatDayMonth(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}
</script>
