"use strict";

// Only catalog values cross into CSS; model names and hook payloads never do.
(function (root) {
  const FAMILIES = Object.freeze({
    opus: { color: "#c49aff", tint: "hue-rotate(255deg) saturate(1.4)" },
    sonnet: { color: "#67dcff", tint: "hue-rotate(160deg) saturate(1.3)" },
    haiku: { color: "#8ee99a", tint: "hue-rotate(75deg) saturate(1.2)" },
    gpt: { color: "#77aaff", tint: "hue-rotate(190deg) saturate(1.3)" },
  });
  const EFFORTS = Object.freeze({ none: 0, minimal: 1, low: 1, medium: 2, high: 3, xhigh: 4, max: 4, ultra: 4 });
  const ACTIVE_STATES = new Set(["thinking", "working", "juggling"]);

  function normalizeEffort(value) {
    return typeof value === "string" && Object.hasOwn(EFFORTS, value.toLowerCase())
      ? value.toLowerCase() : null;
  }

  function modelFamily(model) {
    if (typeof model !== "string") return null;
    return ["opus", "sonnet", "haiku", "gpt"].find((family) =>
      new RegExp(`(?:^|[-_/])${family}(?:$|[-_/.0-9])`, "i").test(model)) || null;
  }

  function resolvePowerUp(snapshot, enabled, displayedState) {
    const neutral = { family: null, tier: 0 };
    if (enabled !== true || (displayedState && !ACTIVE_STATES.has(displayedState))) return neutral;
    const sessions = Array.isArray(snapshot && snapshot.sessions) ? snapshot.sessions : [];
    const active = sessions.filter((session) => session && !session.headless
      && !session.hiddenFromHud && ACTIVE_STATES.has(session.state)
      && (!displayedState || session.state === displayedState));
    // A stable tie break prevents the aura from flickering between parallel agents.
    active.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
      || String(a.id).localeCompare(String(b.id)));
    const session = active[0];
    if (!session) return neutral;
    const effort = normalizeEffort(session.effort);
    return { family: modelFamily(session.model), tier: effort === null ? 0 : EFFORTS[effort] };
  }

  function appearance(payload) {
    const family = payload && Object.hasOwn(FAMILIES, payload.family) ? payload.family : null;
    const tier = payload && Number.isInteger(payload.tier) && payload.tier >= 0 && payload.tier <= 4 ? payload.tier : 0;
    return { family, tier, color: family ? FAMILIES[family].color : "#ffd66b", tint: family ? FAMILIES[family].tint : "" };
  }

  const api = { normalizeEffort, modelFamily, resolvePowerUp, appearance };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ClawdPowerUp = api;
})(globalThis);
