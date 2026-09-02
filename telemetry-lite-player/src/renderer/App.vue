<template>
  <div class="app-shell">
    <div class="d-flex flex-grow-1" style="min-height: 0;">
      <div class="sidebar">
        <div
          class="nav-link"
          :class="{ active: view === 'player' }"
          @click="view = 'player'"
        >
          🎵 Player
        </div>
        <div
          class="nav-link"
          :class="{ active: view === 'automations' }"
          @click="view = 'automations'"
        >
          ⚙️ Automations
        </div>
        <hr style="border-color: #262626;" />
        <button class="btn btn-sm btn-outline-light w-100" @click="pickFolder">
          Open Folder
        </button>
      </div>

      <div class="flex-grow-1 d-flex flex-column" style="min-height: 0;">
        <PlayerView
          v-if="view === 'player'"
          :tracks="tracks"
          :current-track="player.track"
          @select-track="playTrack"
        />
        <AutomationsView v-else :playlists="playlists" />
      </div>
    </div>

    <PlayerBar
      :track="player.track"
      :playlist="tracks"
      @next="playNext"
      @prev="playPrev"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import PlayerView from './components/PlayerView.vue';
import PlayerBar from './components/PlayerBar.vue';
import AutomationsView from './components/AutomationsView.vue';
import { usePlayerStore } from './stores/playerStore';

const player = usePlayerStore();
const view = ref('player');
const tracks = ref([]);
const playlists = ref([]);

async function pickFolder() {
  const result = await window.api.pickFolder();
  if (result) tracks.value = result.tracks;
}

function playTrack(track) {
  player.selectTrack(track, { autoplay: true });
}

function playNext() {
  if (!player.track || tracks.value.length === 0) return;
  const idx = tracks.value.findIndex((t) => t.id === player.track.id);
  if (idx < 0) return;
  const next = tracks.value[(idx + 1) % tracks.value.length];
  player.selectTrack(next, { autoplay: player.isPlaying.value });
}

function playPrev() {
  if (!player.track || tracks.value.length === 0) return;
  const idx = tracks.value.findIndex((t) => t.id === player.track.id);
  if (idx < 0) return;
  const prev = tracks.value[(idx - 1 + tracks.value.length) % tracks.value.length];
  player.selectTrack(prev, { autoplay: player.isPlaying.value });
}

onMounted(async () => {
  const restored = await window.api.rescanLast();
  if (restored) tracks.value = restored.tracks;
  playlists.value = await window.api.getPlaylists();
});
</script>
