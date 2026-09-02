<template>
  <div class="p-4" style="overflow-y: auto;">
    <h5>Automations</h5>
    <p class="text-secondary small">
      Rule-based automations. Scheduled rules are checked every second and fire once per matching minute;
      system-event rules react immediately.
    </p>

    <div class="card bg-dark border-secondary mb-3">
      <div class="card-body">
        <h6 class="card-title">Add Rule</h6>
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small">Trigger Type</label>
            <select class="form-select form-select-sm" v-model="draft.triggerType">
              <option value="schedule">Time of day</option>
              <option value="system">System event</option>
            </select>
          </div>

          <div class="col-md-3" v-if="draft.triggerType === 'schedule'">
            <label class="form-label small">Time</label>
            <input type="time" class="form-control form-control-sm" v-model="draft.time" />
          </div>

          <div class="col-md-3" v-else>
            <label class="form-label small">Event</label>
            <select class="form-select form-select-sm" v-model="draft.systemEvent">
              <option value="suspend">Laptop sleeps</option>
              <option value="resume">Laptop wakes</option>
              <option value="lock-screen">Screen locks</option>
              <option value="unlock-screen">Screen unlocks</option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label small">Action</label>
            <select class="form-select form-select-sm" v-model="draft.action">
              <option value="pause">Pause playback</option>
              <option value="play">Resume playback</option>
              <option value="playPlaylist">Play a playlist</option>
            </select>
          </div>

          <div class="col-md-3" v-if="draft.action === 'playPlaylist'">
            <label class="form-label small">Playlist</label>
            <select class="form-select form-select-sm" v-model="draft.playlistId">
              <option value="">Select playlist</option>
              <option v-for="playlist in normalizedPlaylists" :key="playlist.id" :value="playlist.id">
                {{ playlist.name }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <button class="btn btn-sm btn-primary w-100" @click="addRule" :disabled="!canAddRule">Add</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rules.length === 0" class="text-secondary">No automations yet.</div>

    <div
      v-for="(rule, idx) in rules"
      :key="rule.id"
      class="d-flex justify-content-between align-items-center border-bottom border-secondary py-2"
    >
      <div>
        <button
          class="btn btn-sm me-2"
          :class="rule.enabled === false ? 'btn-outline-secondary' : 'btn-outline-success'"
          @click="toggleRule(idx)"
        >
          {{ rule.enabled === false ? 'Off' : 'On' }}
        </button>
        <span class="badge bg-secondary me-2">{{ describeTrigger(rule) }}</span>
        <span>→ {{ describeAction(rule) }}</span>
      </div>
      <button class="btn btn-sm btn-outline-danger" @click="removeRule(idx)">Remove</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createAutomationEngine } from '../services/automationEngine';
import { usePlayerStore } from '../stores/playerStore';

const props = defineProps({
  playlists: { type: Array, default: () => [] }
});

const player = usePlayerStore();
const rules = ref([]);
const draft = ref({
  triggerType: 'schedule',
  time: '09:00',
  systemEvent: 'resume',
  action: 'pause',
  playlistId: ''
});

const normalizedPlaylists = computed(() => (Array.isArray(props.playlists) ? props.playlists : []));
const canAddRule = computed(() => {
  if (draft.value.triggerType === 'schedule') {
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.value.time);
    return validTime && (draft.value.action !== 'playPlaylist' || Boolean(draft.value.playlistId));
  }
  return draft.value.triggerType === 'system' && Boolean(draft.value.systemEvent);
});

const engine = createAutomationEngine({
  player,
  getPlaylists: () => normalizedPlaylists.value
});

function addRule() {
  if (!canAddRule.value) return;
  rules.value.push({
    triggerType: draft.value.triggerType,
    time: draft.value.time,
    systemEvent: draft.value.systemEvent,
    action: draft.value.action,
    playlistId: draft.value.playlistId,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    enabled: true
  });
}

function removeRule(idx) {
  rules.value.splice(idx, 1);
}

function toggleRule(idx) {
  const rule = rules.value[idx];
  if (rule) rule.enabled = rule.enabled === false;
}

function describeTrigger(rule) {
  if (rule.triggerType === 'schedule') return `At ${rule.time}`;
  const labels = {
    suspend: 'On sleep',
    resume: 'On wake',
    'lock-screen': 'On lock',
    'unlock-screen': 'On unlock'
  };
  return labels[rule.systemEvent] || rule.systemEvent;
}

function describeAction(rule) {
  if (rule.action === 'playPlaylist') {
    const playlist = normalizedPlaylists.value.find((item) => item?.id === rule.playlistId);
    return playlist ? `Play ${playlist.name}` : 'Play playlist';
  }
  const labels = {
    pause: 'Pause playback',
    play: 'Resume playback'
  };
  return labels[rule.action] || rule.action;
}

async function persistRules() {
  try {
    await window.api.saveAutomations(rules.value);
  } catch (error) {
    console.error('Unable to save automations:', error);
  }
}

watch(
  rules,
  (value) => {
    engine.setRules(value);
    void persistRules();
  },
  { deep: true }
);

onMounted(async () => {
  try {
    const saved = await window.api.getAutomations();
    if (Array.isArray(saved)) {
      rules.value = saved.map((rule) => ({
        ...rule,
        id: rule.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        enabled: rule.enabled !== false
      }));
    }
  } catch (error) {
    console.error('Unable to load automations:', error);
  }

  engine.setRules(rules.value);
  engine.start();
});

onBeforeUnmount(() => {
  engine.stop();
});
</script>
