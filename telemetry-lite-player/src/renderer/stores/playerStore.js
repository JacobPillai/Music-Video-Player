import { computed, ref } from 'vue';

let store;

export function usePlayerStore() {
  if (store) return store;

  const track = ref(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.8);
  const shuffle = ref(false);
  const repeatMode = ref('off');
  const command = ref(null);

  function emitCommand(type, payload = null) {
    command.value = { id: Date.now() + Math.random(), type, payload };
  }

  async function play() {
    isPlaying.value = true;
    emitCommand('play');
  }

  function pause() {
    isPlaying.value = false;
    emitCommand('pause');
  }

  function togglePlay() {
    isPlaying.value ? pause() : play();
  }

  function selectTrack(nextTrack, { autoplay = true } = {}) {
    track.value = nextTrack || null;
    currentTime.value = 0;
    duration.value = 0;
    isPlaying.value = autoplay && Boolean(nextTrack);
    emitCommand('track', { track: nextTrack || null, autoplay });
  }

  function setPlaying(value) {
    isPlaying.value = Boolean(value);
  }

  function setCurrentTime(value) {
    currentTime.value = Number.isFinite(value) ? value : 0;
  }

  function setDuration(value) {
    duration.value = Number.isFinite(value) ? value : 0;
  }

  function setVolume(value) {
    volume.value = Math.max(0, Math.min(1, Number(value) || 0));
  }

  function setShuffle(value) {
    shuffle.value = Boolean(value);
  }

  function cycleRepeat() {
    repeatMode.value =
      repeatMode.value === 'off'
        ? 'all'
        : repeatMode.value === 'all'
          ? 'one'
          : 'off';
  }

  const hasTrack = computed(() => Boolean(track.value));

  store = {
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    command,
    hasTrack,
    play,
    pause,
    togglePlay,
    selectTrack,
    setPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setShuffle,
    cycleRepeat
  };

  return store;
}
