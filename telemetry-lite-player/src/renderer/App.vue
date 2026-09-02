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
          :current-track="player.track.value"
          @select-track="playTrack"
        />
        <AutomationsView v-else :playlists="playlists" />
      </div>
    </div>

    <PlayerBar
      :track="player.track.value"
      :playlist="tracks"
      @next="playNext"
      @prev="playPrev"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import PlayerView from './components/PlayerView.vue';
import PlayerBar from './components/PlayerBar.vue';
import AutomationsView from './components/AutomationsView.vue';
import { usePlayerStore } from './stores/playerStore';

const player = usePlayerStore();
const view = ref('player');
const tracks = ref([]);
const playlists = ref([]);

const currentIndex = computed(() =>
  player.track.value ? tracks.value.findIndex((t) => t.id === player.track.value.id) : -1
);

async function pickFolder() {
  const result = await window.api.pickFolder();
  if (!result) return;

  tracks.value = result.tracks;
  if (player.track.value && !tracks.value.some((t) => t.id === player.track.value.id)) {
    player.selectTrack(null, { autoplay: false });
  }
}

function playTrack(track) {
  player.selectTrack(track, { autoplay: true });
}

function chooseNextIndex() {
  if (tracks.value.length <= 1) return currentIndex.value;

  if (player.shuffle.value) {
    const candidates = tracks.value
      .map((_, index) => index)
      .filter((index) => index !== currentIndex.value);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  return currentIndex.value + 1;
}

function playNext() {
  if (!player.track.value || tracks.value.length === 0 || currentIndex.value < 0) return;

  const nextIndex = chooseNextIndex();
  if (nextIndex >= tracks.value.length) {
    if (player.repeatMode.value !== 'all') {
      player.pause();
      return;
    }
    player.selectTrack(tracks.value[0], { autoplay: true });
    return;
  }

  player.selectTrack(tracks.value[nextIndex], { autoplay: true });
}

function playPrev() {
  if (!player.track.value || tracks.value.length === 0 || currentIndex.value < 0) return;

  if (player.currentTime.value > 3) {
    player.seekTo(0);
    return;
  }

  let prevIndex = currentIndex.value - 1;
  if (prevIndex < 0) {
    prevIndex = player.repeatMode.value === 'all' ? tracks.value.length - 1 : 0;
  }

  player.selectTrack(tracks.value[prevIndex], { autoplay: player.isPlaying.value });
}

onMounted(async () => {
  const restored = await window.api.rescanLast();
  if (restored) tracks.value = restored.tracks;
  playlists.value = await window.api.getPlaylists();
});
</script>
