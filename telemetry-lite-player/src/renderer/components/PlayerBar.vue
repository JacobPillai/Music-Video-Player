<template>
  <div class="player-bar">
    <div class="text-center mb-1" style="min-height: 20px;">
      <strong v-if="track">{{ track.title }}</strong>
      <span v-if="track" class="text-secondary"> — {{ track.artist }}</span>
      <span v-else class="text-secondary">Nothing playing</span>
    </div>

    <div class="seek-row">
      <span>{{ formatTime(player.currentTime.value) }}</span>
      <input
        type="range"
        class="form-range flex-grow-1"
        min="0"
        :max="player.duration.value || 0"
        step="0.1"
        :value="player.currentTime.value"
        @input="seek"
      />
      <span>{{ formatTime(player.duration.value) }}</span>
    </div>

    <div class="transport-controls">
      <button @click="toggleShuffle" :style="{ opacity: player.shuffle.value ? 1 : 0.4 }" title="Shuffle">🔀</button>
      <button @click="$emit('prev')" title="Previous">⏮</button>
      <button class="play-btn" @click="togglePlay" title="Play/Pause">
        {{ player.isPlaying.value ? '⏸' : '▶️' }}
      </button>
      <button @click="$emit('next')" title="Next">⏭</button>
      <button @click="player.cycleRepeat()" :style="{ opacity: player.repeatMode.value !== 'off' ? 1 : 0.4 }" :title="`Repeat: ${player.repeatMode.value}`">
        {{ player.repeatMode.value === 'one' ? '🔂' : '🔁' }}
      </button>
    </div>

    <div class="d-flex justify-content-center align-items-center gap-2">
      <span style="font-size: 0.85rem;">🔉</span>
      <input
        type="range"
        class="form-range"
        style="width: 120px;"
        min="0"
        max="1"
        step="0.01"
        :value="player.volume.value"
        @input="setVolume"
      />
    </div>

    <audio
      ref="audioEl"
      :src="track ? toFileUrl(track.path) : ''"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @play="player.setPlaying(true)"
      @pause="player.setPlaying(false)"
      @ended="onEnded"
      @error="onError"
    ></audio>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { usePlayerStore } from '../stores/playerStore';

const props = defineProps({
  track: { type: Object, default: null },
  playlist: { type: Array, default: () => [] }
});
const emit = defineEmits(['next', 'prev']);
const player = usePlayerStore();
const audioEl = ref(null);
let commandWatcherStop;

function toFileUrl(filePath) {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/\\/g, '/');
  const pathPart = normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)
    ? normalized
    : `/${normalized}`;
  return `file://${encodeURI(pathPart)}`;
}

async function togglePlay() {
  const audio = audioEl.value;
  if (!audio || !props.track) return;

  if (!audio.paused) {
    audio.pause();
    return;
  }

  try {
    await audio.play();
  } catch (error) {
    console.error('Unable to start playback:', error);
    player.setPlaying(false);
  }
}

async function applyPlaybackState() {
  await nextTick();
  const audio = audioEl.value;
  if (!audio || !props.track) return;

  audio.volume = player.volume.value;
  if (player.isPlaying.value) {
    try {
      await audio.play();
    } catch (error) {
      console.error('Unable to start playback:', error);
      player.setPlaying(false);
    }
  } else if (!audio.paused) {
    audio.pause();
  }
}

function seek(event) {
  if (!audioEl.value) return;
  const value = Number(event.target.value);
  if (!Number.isFinite(value)) return;
  audioEl.value.currentTime = value;
  player.setCurrentTime(value);
}

function setVolume(event) {
  player.setVolume(Number(event.target.value));
}

function onTimeUpdate() {
  if (audioEl.value) player.setCurrentTime(audioEl.value.currentTime);
}

function onLoadedMetadata() {
  if (audioEl.value) player.setDuration(audioEl.value.duration);
}

function onEnded() {
  if (player.repeatMode.value === 'one') {
    audioEl.value.currentTime = 0;
    audioEl.value.play().catch((error) => {
      console.error('Unable to repeat track:', error);
      player.setPlaying(false);
    });
    return;
  }

  player.setPlaying(false);
  emit('next');
}

function onError(event) {
  console.error('Audio playback error:', event?.target?.error || event);
  player.setPlaying(false);
}

function toggleShuffle() {
  player.setShuffle(!player.shuffle.value);
}

watch(
  () => props.track,
  async () => {
    player.setCurrentTime(0);
    player.setDuration(0);
    await applyPlaybackState();
  }
);

watch(() => player.isPlaying.value, applyPlaybackState);
watch(
  () => player.volume.value,
  (value) => {
    if (audioEl.value) audioEl.value.volume = value;
  }
);

onMounted(() => {
  if (audioEl.value) audioEl.value.volume = player.volume.value;

  commandWatcherStop = watch(
    () => player.command.value,
    (command) => {
      if (command?.type !== 'seek' || !audioEl.value) return;
      const value = Number(command.payload?.time);
      if (Number.isFinite(value)) audioEl.value.currentTime = value;
    }
  );
});

onBeforeUnmount(() => {
  commandWatcherStop?.();
});

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}
</script>
