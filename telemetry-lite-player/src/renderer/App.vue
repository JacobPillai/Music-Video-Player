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
          :current-track="currentTrack"
          @select-track="playTrack"
        />
        <AutomationsView v-else :playlists="playlists" />
      </div>
    </div>

    <PlayerBar
      :track="currentTrack"
      :playlist="tracks"
      @next="playNext"
      @prev="playPrev"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PlayerView from './components/PlayerView.vue';
import PlayerBar from './components/PlayerBar.vue';
import AutomationsView from './components/AutomationsView.vue';

const view = ref('player');
const tracks = ref([]);
const currentTrack = ref(null);
const playlists = ref([]);

async function pickFolder() {
  const result = await window.api.pickFolder();
  if (result) tracks.value = result.tracks;
}

function playTrack(track) {
  currentTrack.value = track;
}

function playNext() {
  if (!currentTrack.value || tracks.value.length === 0) return;
  const idx = tracks.value.findIndex((t) => t.id === currentTrack.value.id);
  const next = tracks.value[(idx + 1) % tracks.value.length];
  currentTrack.value = next;
}

function playPrev() {
  if (!currentTrack.value || tracks.value.length === 0) return;
  const idx = tracks.value.findIndex((t) => t.id === currentTrack.value.id);
  const prev = tracks.value[(idx - 1 + tracks.value.length) % tracks.value.length];
  currentTrack.value = prev;
}

onMounted(async () => {
  const restored = await window.api.rescanLast();
  if (restored) tracks.value = restored.tracks;
  playlists.value = await window.api.getPlaylists();
});
</script>
