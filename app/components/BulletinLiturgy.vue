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
          <template v-if="moment.type === 'prayer' || moment.type === 'pastoral_act' || moment.type === 'other'">
            <strong>{{ moment.description }}</strong>
          </template>

          <template v-else-if="moment.type === 'song'">
            <strong>Cântico:</strong>
            <template v-if="moment.song">
              <h4>
                {{ moment.song.title }}
                <small v-if="moment.song.reference">{{ moment.song.reference }}</small>
              </h4>
              <template
                v-for="(stanza, i) in moment.song.lyrics ?? []"
                :key="i"
              >
                <p
                  v-if="stanza.type === 'verse'"
                  class="song-verse"
                >
                  {{ stanza.number }}.
                  <NewlineToBr :text="stanza.content" />
                </p>
                <p
                  v-else
                  class="song-chorus"
                >
                  <NewlineToBr :text="stanza.content" />
                </p>
              </template>
            </template>
            <p v-if="moment.description">{{ moment.description }}</p>
          </template>

          <template v-else-if="moment.type === 'bible_reading'">
            <p v-if="moment.description">{{ moment.description }}</p>
            <BiblePassageBlock
              v-for="(p, i) in moment.scripture_passages ?? []"
              :key="i"
              :passage="p"
            />
          </template>

          <template v-else-if="moment.type === 'sermon'">
            <strong v-if="moment.sermon_theme">{{ moment.sermon_theme }}</strong>
            <p v-if="moment.sermon_speaker">{{ moment.sermon_speaker }}</p>
            <BiblePassageBlock
              v-for="(p, i) in moment.scripture_passages ?? []"
              :key="i"
              :passage="p"
            />
            <p v-if="moment.description">{{ moment.description }}</p>
          </template>

          <template v-else-if="moment.type === 'sacrament'">
            <strong>{{ SACRAMENT_LABELS[moment.sacrament_type] }}</strong>
            <p v-if="moment.description">{{ moment.description }}</p>
          </template>
        </li>
      </ul>
    </article>
    <NuxtLink
      :to="`/liturgies/${liturgy.date}`"
      class="mt-4 inline-block text-sm text-blue-600 hover:underline"
      >Ver liturgia completa &rarr;</NuxtLink
    >
  </section>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';
import type { LiturgyDetail } from '~~/shared/liturgy';
import { SACRAMENT_LABELS } from '~/utils/liturgy-labels';
import BiblePassageBlock from './BiblePassageBlock.vue';
import NewlineToBr from './NewlineToBr.vue';

defineProps<{ liturgy: LiturgyDetail | null }>();
</script>
