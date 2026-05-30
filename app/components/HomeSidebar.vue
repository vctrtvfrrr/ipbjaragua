<template>
  <aside class="home-sidebar space-y-8">
    <SidebarBulletin />
    <SidebarAnnouncements />
    <section data-sidebar-block="liturgies" />
  </aside>
</template>

<script setup lang="ts">
import { SidebarBulletin, SidebarAnnouncements } from '#components';
</script>
