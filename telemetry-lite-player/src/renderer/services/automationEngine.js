export function createAutomationEngine({ player, getPlaylists = () => [] } = {}) {
  let unsubscribeSystemEvent = null;
  let scheduledTimer = null;
  let rules = [];
  let lastScheduleKey = null;

  function setRules(value) {
    rules = Array.isArray(value) ? value : [];
  }

  function executeAction(rule) {
    if (!rule || rule.enabled === false) return false;

    switch (rule.action) {
      case 'pause':
        player.pause();
        return true;
      case 'play':
        if (!player.track.value) return false;
        player.play();
        return true;
      case 'playPlaylist': {
        const playlists = getPlaylists();
        const playlist = playlists.find((item) => item?.id === rule.playlistId);
        const firstTrack = playlist?.tracks?.[0];
        if (!firstTrack) return false;
        player.selectTrack(firstTrack, { autoplay: true });
        return true;
      }
      default:
        return false;
    }
  }

  function handleSystemEvent(eventName) {
    rules
      .filter(
        (rule) =>
          rule.enabled !== false &&
          rule.triggerType === 'system' &&
          rule.systemEvent === eventName
      )
      .forEach(executeAction);
  }

  function getCurrentScheduleKey(date = new Date()) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  }

  function pollScheduledRules() {
    const now = new Date();
    const minuteKey = getCurrentScheduleKey(now);
    if (minuteKey === lastScheduleKey) return;
    lastScheduleKey = minuteKey;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    rules
      .filter(
        (rule) =>
          rule.enabled !== false &&
          rule.triggerType === 'schedule' &&
          rule.time === currentTime
      )
      .forEach(executeAction);
  }

  function start() {
    if (scheduledTimer) return;
    pollScheduledRules();
    scheduledTimer = window.setInterval(pollScheduledRules, 1000);

    if (window.api?.onSystemEvent) {
      unsubscribeSystemEvent = window.api.onSystemEvent(handleSystemEvent) || null;
    }
  }

  function stop() {
    if (scheduledTimer) {
      window.clearInterval(scheduledTimer);
      scheduledTimer = null;
    }
    unsubscribeSystemEvent?.();
    unsubscribeSystemEvent = null;
    lastScheduleKey = null;
  }

  return {
    setRules,
    executeAction,
    handleSystemEvent,
    start,
    stop
  };
}
