export const StorageManager = {
  getActiveSession() {
    const session = localStorage.getItem("activeSession");
    return session ? JSON.parse(session) : null;
  },
  setActiveSession(session) {
    localStorage.setItem("activeSession", JSON.stringify(session));
  },
  removeActiveSession() {
    localStorage.removeItem("activeSession");
  },
  getSessions() {
    return JSON.parse(localStorage.getItem("sessions") || "[]");
  },
  setSessions(sessions) {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  },
  clearAll() {
    localStorage.clear();
  },
  getLastCategory() {
    return localStorage.getItem("lastCategory") || "other";
  },
  setLastCategory(category) {
    localStorage.setItem("lastCategory", category);
  },
};
