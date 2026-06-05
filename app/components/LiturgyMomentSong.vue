<template>
  <strong>Cântico:</strong>
  <template v-if="song">
    <h4>
      {{ song.title }}
      <small v-if="song.reference">{{ song.reference }}</small>
    </h4>
    <template
      v-for="(stanza, i) in song.lyrics ?? []"
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
  <p v-if="description">{{ description }}</p>
</template>

<script setup lang="ts">
import type { SongData } from '~~/shared/liturgy';

defineProps<{ song: SongData | null; description: string | null }>();
</script>
