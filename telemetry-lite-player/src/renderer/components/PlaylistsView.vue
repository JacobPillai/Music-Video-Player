<template>
  <div class="p-4" style="overflow-y: auto;">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Playlists</h5>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-light" @click="importJson">Import JSON</button>
        <button class="btn btn-sm btn-outline-light" :disabled="!playlists.length" @click="exportJson">Export JSON</button>
        <button class="btn btn-sm btn-primary" @click="create">New Playlist</button>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-4">
        <div v-if="!playlists.length" class="text-secondary">No playlists yet.</div>
        <div v-else class="list-group">
          <button
            v-for="playlist in playlists"
            :key="playlist.id"
            class="list-group-item list-group-item-action bg-dark text-light border-secondary text-start"
            :class="{ active: playlist.id === selectedPlaylistId }"
            @click="select(playlist.id)"
          >
            <div class="d-flex justify-content-between">
              <span>{{ playlist.name }}</span>
              <small>{{ playlist.tracks.length }}</small>
            </div>
          </button>
        </div>
      </div>

      <div class="col-md-8">
        <div v-if="selectedPlaylist" class="card bg-dark border-secondary">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <input v-model="nameDraft" class="form-control form-control-sm bg-dark text-light border-secondary" />
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-light" @click="rename">Rename</button>
                <button class="btn btn-sm btn-outline-danger" @click="remove">Delete</button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small">Add track from library</label>
              <select v-model="trackToAdd" class="form-select form-select-sm bg-dark text-light border-secondary">
                <option value="">Select track</option>
                <option v-for="track in libraryTracks" :key="track.id" :value="track.id">
                  {{ track.title }} — {{ track.artist }}
                </option>
              </select>
              <button class="btn btn-sm btn-primary mt-2" :disabled="!trackToAdd" @click="addSelectedTrack">Add track</button>
            </div>

            <div v-if="!selectedPlaylist.tracks.length" class="text-secondary">This playlist is empty.</div>
            <div v-else>
              <div
                v-for="(track, index) in selectedPlaylist.tracks"
                :key="track.id"
                class="d-flex align-items-center gap-2 border-bottom border-secondary py-2"
              >
                <span class="text-secondary small" style="width: 2rem;">{{ index + 1 }}</span>
                <span class="flex-grow-1">{{ track.title }} — {{ track.artist }}</span>
                <button class="btn btn-sm btn-outline-secondary" :disabled="index === 0" @click="move(index, index - 1)">↑</button>
                <button class="btn btn-sm btn-outline-secondary" :disabled="index === selectedPlaylist.tracks.length - 1" @click="move(index, index + 1)">↓</button>
                <button class="btn btn-sm btn-outline-danger" @click="removeTrack(track.id)">Remove</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-secondary">Select a playlist to manage it.</div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" class="d-none" @change="handleImport" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { usePlaylistStore } from '../services/playlistStore';

const props = defineProps({
  libraryTracks: { type: Array, default: () => [] }
});

const store = usePlaylistStore();
const fileInput = ref(null);
const nameDraft = ref('');
const trackToAdd = ref('');

const playlists = store.playlists;
const selectedPlaylistId = store.selectedPlaylistId;
const libraryTracks = computed(() => (Array.isArray(props.libraryTracks) ? props.libraryTracks : []));
const selectedPlaylist = computed(() => playlists.value.find((item) => item.id === selectedPlaylistId.value) || null);

watch(selectedPlaylist, (value) => {
  nameDraft.value = value?.name || '';
  trackToAdd.value = '';
}, { immediate: true });

function create() {
  store.createPlaylist('New Playlist');
}

function select(id) {
  store.selectPlaylist(id);
}

function rename() {
  store.renamePlaylist(selectedPlaylistId.value, nameDraft.value);
}

function remove() {
  if (!selectedPlaylist.value) return;
  store.deletePlaylist(selectedPlaylist.value.id);
}

function addSelectedTrack() {
  const track = libraryTracks.value.find((item) => item.id === trackToAdd.value);
  if (track) store.addTrack(selectedPlaylistId.value, track);
  trackToAdd.value = '';
}

function removeTrack(trackId) {
  store.removeTrack(selectedPlaylistId.value, trackId);
}

function move(fromIndex, toIndex) {
  store.moveTrack(selectedPlaylistId.value, fromIndex, toIndex);
}

function exportJson() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'playlists.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function importJson() {
  fileInput.value?.click();
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  if (!store.importJson(text)) {
    window.alert('Invalid playlist JSON file.');
  }
  event.target.value = '';
}
</script>
