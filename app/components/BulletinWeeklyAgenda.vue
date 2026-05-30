<template>
  <div v-if="agenda !== null">
    <h2>Agenda Semanal</h2>
    <p
      v-if="agenda.length === 0"
      class="text-mist-600 italic"
    >
      Nenhum evento nesta semana.
    </p>
    <template v-else>
      <div
        v-for="group in agenda"
        :key="group.weekday"
        class="bulletin-agenda-group"
      >
        <h3>{{ group.weekday }}</h3>
        <ul>
          <li
            v-for="(event, i) in group.events"
            :key="i"
          >
            <strong v-if="event.time">{{ event.time }}</strong
            ><template v-if="event.time"> — </template>{{ event.title }}
            <em
              v-if="event.description"
              class="block text-sm"
              >{{ event.description }}</em
            >
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AgendaGroup } from '~~/shared/bulletin';

defineProps<{ agenda: AgendaGroup[] | null }>();
</script>
