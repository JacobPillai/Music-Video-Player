<template>
  <div class="p-4" style="overflow-y: auto;">
    <h5>Automations</h5>
    <p class="text-secondary small">
      Simple rule-based automations. Rules are checked every minute (for scheduled) or
      reacted to instantly (for system events).
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

          <div class="col-md-3">
            <button class="btn btn-sm btn-primary w-100" @click="addRule">Add</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rules.length === 0" class="text-secondary">No automations yet.</div>

    <div
      v-for="(rule, idx) in rules"
      :key="idx"
      class="d-flex justify-content-between align-items-center border-bottom border-secondary py-2"
    >
      <div>
        <span class="badge bg-secondary me-2">{{ describeTrigger(rule) }}</span>
        <span>→ {{ describeAction(rule) }}</span>
      </div>
      <button class="btn btn-sm btn-outline-danger" @click="removeRule(idx)">Remove</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const rules = ref([]);
const draft = ref({
  triggerType: 'schedule',
  time: '09:00',
  systemEvent: 'resume',
  action: 'pause'
});

function addRule() {
  const rule = { ...draft.value, id: Date.now() };
  rules.value.push(rule);
}

function removeRule(idx) {
  rules.value.splice(idx, 1);
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
  const labels = {
    pause: 'Pause playback',
    play: 'Resume playback',
    playPlaylist: 'Play a playlist'
  };
  return labels[rule.action] || rule.action;
}

// Persist rules whenever they change
watch(
  rules,
  async (val) => {
    await window.api.saveAutomations(val);
  },
  { deep: true }
);

// React to system events sent from the main process
window.api.onSystemEvent((eventName) => {
  const matching = rules.value.filter(
    (r) => r.triggerType === 'system' && r.systemEvent === eventName
  );
  matching.forEach((r) => {
    // Hook this up to your actual PlayerBar controls via a shared store/emitter.
    console.log('Automation fired:', r);
  });
});

onMounted(async () => {
  const saved = await window.api.getAutomations();
  if (saved) rules.value = saved;
});
</script>
