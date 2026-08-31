<template>
  <div class="player-bar">
    <div class="text-center mb-1" style="min-height: 20px;">
      <strong v-if="track">{{ track.title }}</strong>
      <span v-if="track" class="text-secondary"> — {{ track.artist }}</span>
      <span v-else class="text-secondary">Nothing playing</span>
    </div>

    <div class="seek-row">
      <span>{{ formatTime(currentTime) }}</span>
      <input
        type="range"
        class="form-range flex-grow-1"
        min="0"
        :max="duration || 0"
        step="0.1"
        v-model.number="currentTime"
        @input="seek"
      />
      <span>{{ formatTime(duration) }}</span>
    </div>

    <div class="transport-controls">
      <button @click="toggleShuffle" :style="{ opacity: shuffle ? 1 : 0.4 }" title="Shuffle">🔀</button>
      <button @click="$emit('prev')" title="Previous">⏮</button>
      <button class="play-btn" @click="togglePlay" title="Play/Pause">
        {{ isPlaying ? '⏸' : '▶️' }}
      </button>
      <button @click="$emit('next')" title="Next">⏭</button>
      <button @click="cycleRepeat" :style="{ opacity: repeatMode !== 'off' ? 1 : 0.4 }" title="Repeat">
        {{ repeatMode === 'one' ? '🔂' : '🔁' }}
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
        v-model.number="volume"
      />
    </div>

    <audio
      ref="audioEl"
      :src="track ? toFileUrl(track.path) : ''"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    ></audio>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  track: { type: Object, default: null },
  playlist: { type: Array, default: () => [] }
});
const emit = defineEmits(['next', 'prev']);

const audioEl = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.8);
const shuffle = ref(false);
const repeatMode = ref('off'); // 'off' | 'all' | 'one'

function toFileUrl(path) {
  // Convert a Windows/Unix absolute path to a file:// URL the <audio> tag can load
  const normalized = path.replace(/\\/g, '/');
  return `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}

function togglePlay() {
  if (!audioEl.value.src) return;
  if (isPlaying.value) {
    audioEl.value.pause();
  } else {
    audioEl.value.play();
  }
  isPlaying.value = !isPlaying.value;
}

function seek() {
  audioEl.value.currentTime = currentTime.value;
}

function onTimeUpdate() {
  currentTime.value = audioEl.value.currentTime;
}

function onLoadedMetadata() {
  duration.value = audioEl.value.duration;
}

function onEnded() {
  if (repeatMode.value === 'one') {
    audioEl.value.currentTime = 0;
    audioEl.value.play();
    return;
  }
  emit('next');
}

function toggleShuffle() {
  shuffle.value = !shuffle.value;
}

function cycleRepeat() {
  repeatMode.value =
    repeatMode.value === 'off' ? 'all' : repeatMode.value === 'all' ? 'one' : 'off';
}

watch(volume, (v) => {
  if (audioEl.value) audioEl.value.volume = v;
});

watch(
  () => props.track,
  async () => {
    if (!props.track) return;
    await nextTickPlay();
  }
);

async function nextTickPlay() {
  // Wait for the src binding to update, then autoplay the new track
  setTimeout(() => {
    if (audioEl.value) {
      audioEl.value.play();
      isPlaying.value = true;
    }
  }, 50);
}

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

onMounted(() => {
  if (audioEl.value) audioEl.value.volume = volume.value;
});
</script>
