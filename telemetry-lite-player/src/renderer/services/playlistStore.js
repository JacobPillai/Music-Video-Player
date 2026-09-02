import { ref } from 'vue';

let state;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePlaylistStore() {
  if (state) return state;

  const playlists = ref([]);
  const selectedPlaylistId = ref(null);

  function normalizePlaylist(playlist) {
    return {
      id: playlist?.id || createId(),
      name: String(playlist?.name || 'Untitled Playlist').trim() || 'Untitled Playlist',
      tracks: Array.isArray(playlist?.tracks) ? playlist.tracks : []
    };
  }

  function setPlaylists(value) {
    playlists.value = Array.isArray(value) ? value.map(normalizePlaylist) : [];
    if (!playlists.value.some((item) => item.id === selectedPlaylistId.value)) {
      selectedPlaylistId.value = playlists.value[0]?.id || null;
    }
  }

  function createPlaylist(name) {
    const playlist = normalizePlaylist({ name, tracks: [] });
    playlists.value.push(playlist);
    selectedPlaylistId.value = playlist.id;
    return playlist;
  }

  function renamePlaylist(id, name) {
    const playlist = playlists.value.find((item) => item.id === id);
    if (!playlist) return false;
    const nextName = String(name || '').trim();
    if (!nextName) return false;
    playlist.name = nextName;
    return true;
  }

  function deletePlaylist(id) {
    const index = playlists.value.findIndex((item) => item.id === id);
    if (index < 0) return false;
    playlists.value.splice(index, 1);
    if (selectedPlaylistId.value === id) {
      selectedPlaylistId.value = playlists.value[index]?.id || playlists.value[index - 1]?.id || null;
    }
    return true;
  }

  function addTrack(playlistId, track) {
    const playlist = playlists.value.find((item) => item.id === playlistId);
    if (!playlist || !track) return false;
    if (playlist.tracks.some((item) => item.id === track.id)) return false;
    playlist.tracks.push(track);
    return true;
  }

  function removeTrack(playlistId, trackId) {
    const playlist = playlists.value.find((item) => item.id === playlistId);
    if (!playlist) return false;
    const index = playlist.tracks.findIndex((item) => item.id === trackId);
    if (index < 0) return false;
    playlist.tracks.splice(index, 1);
    return true;
  }

  function moveTrack(playlistId, fromIndex, toIndex) {
    const playlist = playlists.value.find((item) => item.id === playlistId);
    if (!playlist) return false;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= playlist.tracks.length || toIndex >= playlist.tracks.length) {
      return false;
    }
    const [item] = playlist.tracks.splice(fromIndex, 1);
    playlist.tracks.splice(toIndex, 0, item);
    return true;
  }

  function selectPlaylist(id) {
    selectedPlaylistId.value = playlists.value.some((item) => item.id === id) ? id : null;
  }

  function exportJson() {
    return JSON.stringify(playlists.value, null, 2);
  }

  function importJson(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return false;
    }
    if (!Array.isArray(parsed)) return false;
    setPlaylists(parsed);
    return true;
  }

  state = {
    playlists,
    selectedPlaylistId,
    setPlaylists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    moveTrack,
    selectPlaylist,
    exportJson,
    importJson
  };

  return state;
}
