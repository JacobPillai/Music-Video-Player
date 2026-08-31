<template>
  <div class="track-list p-3">
    <div v-if="tracks.length === 0" class="text-secondary text-center mt-5">
      No folder loaded yet. Click <strong>Open Folder</strong> to load your music.
    </div>

    <div
      v-for="track in tracks"
      :key="track.id"
      class="track-row"
      :class="{ active: currentTrack && currentTrack.id === track.id }"
      @click="$emit('select-track', track)"
    >
      <div class="meta">
        <div>{{ track.title }}</div>
        <small>{{ track.artist }}<span v-if="track.album"> — {{ track.album }}</span></small>
      </div>
      <div class="text-secondary small align-self-center">
        {{ formatDuration(track.duration) }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tracks: { type: Array, default: () => [] },
  currentTrack: { type: Object, default: null }
});
defineEmits(['select-track']);

function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}
</script>
