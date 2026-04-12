export function renderSessionsList(sessions, container, helpers) {
  const {
    formatTime,
    formatCurrentTime,
    getDayformatDate,
    getCollapsedState,
    setCollapsedState,
    groupSessionsByDay,
    getTotal,
  } = helpers;

  container.innerHTML = "";

  const collapsedState = getCollapsedState();

  // if you get started or clear all the sessions:
  const emptyState = document.getElementById("empty-state");

  if (!Array.isArray(sessions) || sessions.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("show");
    return;
  } else {
    emptyState.classList.remove("show");
    emptyState.classList.add("hidden");
  }

  const grouped = groupSessionsByDay(sessions);

  const sortedDays = Object.keys(grouped).sort().reverse();

  sortedDays.forEach((day) => {
    const dayGroup = document.createElement("div");
    dayGroup.className = "day-group";

    // 📂 wrapper for sessions:
    const wrapper = document.createElement("div");
    wrapper.className = "day-sessions";

    // 📅 header of the day:
    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    dayHeader.onclick = () => {
      const state = getCollapsedState();

      wrapper.classList.toggle("collapsed");

      const isNowCollapsed = wrapper.classList.contains("collapsed");

      state[day] = isNowCollapsed;
      setCollapsedState(state);

      const label = dayHeader.querySelector(".day-label");
      label.textContent = isNowCollapsed ? "▶ " + day : "▼ " + day;
    };

    // 📊 total for the day:
    const total = getTotal(grouped[day] || []);

    const today = getDayformatDate(Date.now());

    let isCollapsed;

    if (collapsedState[day] !== undefined) {
      isCollapsed = collapsedState[day];
    } else {
      isCollapsed = day !== today;
    }
    dayHeader.innerHTML = `
  <span class="day-label">${isCollapsed ? "▶" : "▼"} ${day}</span>
  <span class="day-total">${formatTime(total)}</span>
`;

    if (isCollapsed) {
      wrapper.classList.add("collapsed");
    }

    [...(grouped[day] || [])]
      // .sort((a, b) => b.start - a.start)
      .forEach((item) => {
        const sessionItem = document.createElement("div");
        sessionItem.className = "session-item";
        sessionItem.dataset.id = item.start;

        const topRow = document.createElement("div");
        topRow.className = "session-item__top";

        const divCategory = document.createElement("div");
        divCategory.innerHTML = `${item.category}:`;
        divCategory.className = "session-item__category";

        const divDur = document.createElement("div");
        divDur.innerHTML = `${formatTime(item.duration)}`;
        divDur.className = "session-item__duration";

        topRow.appendChild(divCategory);
        topRow.appendChild(divDur);

        const divInfo = document.createElement("div");
        divInfo.innerHTML = `${formatCurrentTime(item.start)} - ${formatCurrentTime(item.end)}`;
        divInfo.className = "session-item__info";

        sessionItem.appendChild(divCategory);
        sessionItem.appendChild(divInfo);
        sessionItem.appendChild(topRow);

        wrapper.appendChild(sessionItem);
      });

    dayGroup.appendChild(dayHeader);
    dayGroup.appendChild(wrapper);
    container.appendChild(dayGroup);
  });
}
