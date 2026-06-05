<template>
  <section
    v-if="liturgy"
    class="bulletin-liturgy"
  >
    <h2>{{ liturgy.theme }}</h2>
    <article
      v-for="act in liturgy.acts"
      :key="act.position"
    >
      <h3>{{ act.name }}</h3>
      <ul>
        <li
          v-for="moment in act.moments"
          :key="moment.position"
        >
          <LiturgyMomentPrayer
            v-if="moment.type === 'prayer'"
            :description="moment.description"
          />
          <LiturgyMomentPastoralAct
            v-else-if="moment.type === 'pastoral_act'"
            :description="moment.description"
          />
          <LiturgyMomentOther
            v-else-if="moment.type === 'other'"
            :description="moment.description"
          />
          <LiturgyMomentSong
            v-else-if="moment.type === 'song'"
            :song="moment.song"
            :description="moment.description"
          />
          <LiturgyMomentBibleReading
            v-else-if="moment.type === 'bible_reading'"
            :description="moment.description"
            :scripture-passages="moment.scripture_passages"
          />
          <LiturgyMomentSermon
            v-else-if="moment.type === 'sermon'"
            :description="moment.description"
            :sermon-speaker="moment.sermon_speaker"
            :scripture-passages="moment.scripture_passages"
          />
          <LiturgyMomentSacrament
            v-else-if="moment.type === 'sacrament'"
            :sacrament-type="moment.sacrament_type"
            :description="moment.description"
          />
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { LiturgyDetail } from '~~/shared/liturgy';

defineProps<{ liturgy: LiturgyDetail | null }>();
</script>
