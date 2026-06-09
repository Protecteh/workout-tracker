(() => {
  "use strict";

  const STORAGE_KEY = "personal-workout-tracker-v1";
  const PUSHUP_GOAL = 100;

  const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];
  const EXERCISE_TYPES = ["strength", "bodyweight", "cardio", "mobility"];

  const DEFAULT_EXERCISES = [
    { id: "default-pushups", name: "Pushups", muscleGroup: "Chest", type: "bodyweight" },
    { id: "default-bench-press", name: "Bench press", muscleGroup: "Chest", type: "strength" },
    { id: "default-incline-press", name: "Incline press", muscleGroup: "Chest", type: "strength" },
    { id: "default-dips", name: "Dips", muscleGroup: "Chest", type: "bodyweight" },
    { id: "default-cable-fly", name: "Cable fly", muscleGroup: "Chest", type: "strength" },
    { id: "default-pullups", name: "Pullups", muscleGroup: "Back", type: "bodyweight" },
    { id: "default-chinups", name: "Chinups", muscleGroup: "Back", type: "bodyweight" },
    { id: "default-rows", name: "Rows", muscleGroup: "Back", type: "strength" },
    { id: "default-lat-pulldown", name: "Lat pulldown", muscleGroup: "Back", type: "strength" },
    { id: "default-overhead-press", name: "Overhead press", muscleGroup: "Shoulders", type: "strength" },
    { id: "default-lateral-raises", name: "Lateral raises", muscleGroup: "Shoulders", type: "strength" },
    { id: "default-rear-delt-fly", name: "Rear delt fly", muscleGroup: "Shoulders", type: "strength" },
    { id: "default-curls", name: "Curls", muscleGroup: "Arms", type: "strength" },
    { id: "default-triceps-pushdown", name: "Triceps pushdown", muscleGroup: "Arms", type: "strength" },
    { id: "default-skull-crushers", name: "Skull crushers", muscleGroup: "Arms", type: "strength" },
    { id: "default-squats", name: "Squats", muscleGroup: "Legs", type: "strength" },
    { id: "default-leg-press", name: "Leg press", muscleGroup: "Legs", type: "strength" },
    { id: "default-lunges", name: "Lunges", muscleGroup: "Legs", type: "bodyweight" },
    { id: "default-calf-raises", name: "Calf raises", muscleGroup: "Legs", type: "strength" },
    { id: "default-plank", name: "Plank", muscleGroup: "Core", type: "bodyweight" },
    { id: "default-hanging-leg-raises", name: "Hanging leg raises", muscleGroup: "Core", type: "bodyweight" },
    { id: "default-crunches", name: "Crunches", muscleGroup: "Core", type: "bodyweight" },
    { id: "default-walking", name: "Walking", muscleGroup: "Cardio", type: "cardio" },
    { id: "default-running", name: "Running", muscleGroup: "Cardio", type: "cardio" },
    { id: "default-cycling", name: "Cycling", muscleGroup: "Cardio", type: "cardio" }
  ];

  const els = {};
  let state = loadState();
  let activeTab = "today";
  let selectedHistoryDate = "";
  let selectedLibraryGroup = "";
  let deferredInstallPrompt = null;
  let toastTimer = 0;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    seedStaticSelects();
    bindEvents();
    syncSettingsInputs();

    const hashTab = window.location.hash.replace("#", "");
    if (hashTab && document.getElementById(hashTab)) {
      setActiveTab(hashTab, false);
    }

    renderAll();
    setupInstallPrompt();
    registerServiceWorker();
  }

  function cacheElements() {
    els.currentDateLabel = document.getElementById("currentDateLabel");
    els.installButton = document.getElementById("installButton");
    els.addExerciseToggle = document.getElementById("addExerciseToggle");
    els.todayForm = document.getElementById("todayForm");
    els.targetMuscleSelect = document.getElementById("targetMuscleSelect");
    els.exerciseSelect = document.getElementById("exerciseSelect");
    els.setsInput = document.getElementById("setsInput");
    els.repsInput = document.getElementById("repsInput");
    els.weightInput = document.getElementById("weightInput");
    els.durationInput = document.getElementById("durationInput");
    els.distanceInput = document.getElementById("distanceInput");
    els.notesInput = document.getElementById("notesInput");
    els.pushupFields = document.getElementById("pushupFields");
    els.pushupMaxInput = document.getElementById("pushupMaxInput");
    els.emomMinutesInput = document.getElementById("emomMinutesInput");
    els.emomRepsInput = document.getElementById("emomRepsInput");
    els.emomTotalBadge = document.getElementById("emomTotalBadge");
    els.clearTodayForm = document.getElementById("clearTodayForm");
    els.todayTitle = document.getElementById("todayTitle");
    els.todayTotalSets = document.getElementById("todayTotalSets");
    els.todayTotalReps = document.getElementById("todayTotalReps");
    els.todayTotalPushups = document.getElementById("todayTotalPushups");
    els.todayEntryCount = document.getElementById("todayEntryCount");
    els.todayEntries = document.getElementById("todayEntries");
    els.exerciseForm = document.getElementById("exerciseForm");
    els.customExerciseId = document.getElementById("customExerciseId");
    els.customName = document.getElementById("customName");
    els.customGroup = document.getElementById("customGroup");
    els.customType = document.getElementById("customType");
    els.saveCustomExercise = document.getElementById("saveCustomExercise");
    els.cancelCustomEdit = document.getElementById("cancelCustomEdit");
    els.libraryList = document.getElementById("libraryList");
    els.librarySelectedGroup = document.getElementById("librarySelectedGroup");
    els.muscleMapChips = document.getElementById("muscleMapChips");
    els.historyExerciseFilter = document.getElementById("historyExerciseFilter");
    els.historyGroupFilter = document.getElementById("historyGroupFilter");
    els.historyList = document.getElementById("historyList");
    els.historyDetail = document.getElementById("historyDetail");
    els.monthTrainingDays = document.getElementById("monthTrainingDays");
    els.weekWorkoutDays = document.getElementById("weekWorkoutDays");
    els.bestPushupMax = document.getElementById("bestPushupMax");
    els.pushupGoalText = document.getElementById("pushupGoalText");
    els.pushupChart = document.getElementById("pushupChart");
    els.bodyweightChart = document.getElementById("bodyweightChart");
    els.bodyweightUnitLabel = document.getElementById("bodyweightUnitLabel");
    els.muscleGroupBars = document.getElementById("muscleGroupBars");
    els.settingsForm = document.getElementById("settingsForm");
    els.weightUnitSelect = document.getElementById("weightUnitSelect");
    els.bodyweightForm = document.getElementById("bodyweightForm");
    els.bodyweightDateInput = document.getElementById("bodyweightDateInput");
    els.bodyweightValueInput = document.getElementById("bodyweightValueInput");
    els.bodyweightList = document.getElementById("bodyweightList");
    els.exportJsonButton = document.getElementById("exportJsonButton");
    els.importFileInput = document.getElementById("importFileInput");
    els.exportCsvButton = document.getElementById("exportCsvButton");
    els.dataSummaryText = document.getElementById("dataSummaryText");
    els.toast = document.getElementById("toast");
    els.tabButtons = Array.from(document.querySelectorAll(".tab-button"));
    els.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
  }

  function seedStaticSelects() {
    fillSelect(els.targetMuscleSelect, MUSCLE_GROUPS.map((group) => ({ value: group, label: group })));
    fillSelect(els.setsInput, presetOptions("sets", 1, 10, 1, 3));
    fillSelect(els.repsInput, presetOptions("reps", 1, 50, 1, 10));
    els.setsInput.value = "3";
    els.repsInput.value = "10";
    fillSelect(els.customGroup, MUSCLE_GROUPS.map((group) => ({ value: group, label: group })));
    fillSelect(els.customType, EXERCISE_TYPES.map((type) => ({ value: type, label: titleCase(type) })));
    fillSelect(els.historyGroupFilter, [
      { value: "", label: "All muscle groups" },
      ...MUSCLE_GROUPS.map((group) => ({ value: group, label: group }))
    ]);
    els.bodyweightDateInput.value = todayISO();
  }

  function bindEvents() {
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });

    els.addExerciseToggle.addEventListener("click", () => {
      els.todayForm.classList.toggle("hidden");
      els.addExerciseToggle.textContent = els.todayForm.classList.contains("hidden")
        ? "Show quick log"
        : "Hide quick log";
      if (!els.todayForm.classList.contains("hidden")) {
        els.targetMuscleSelect.focus();
      }
    });

    els.todayForm.addEventListener("submit", handleTodaySubmit);
    els.clearTodayForm.addEventListener("click", () => {
      resetLogForm(true);
      showToast("Form cleared.");
    });

    els.targetMuscleSelect.addEventListener("change", () => {
      renderExerciseSelects();
      updatePushupFields();
    });

    [els.exerciseSelect, els.emomMinutesInput, els.emomRepsInput].forEach((input) => {
      input.addEventListener("input", updatePushupFields);
      input.addEventListener("change", updatePushupFields);
    });

    els.todayEntries.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-delete-entry]");
      if (!button) {
        return;
      }
      deleteEntry(button.dataset.date, button.dataset.deleteEntry);
    });

    els.exerciseForm.addEventListener("submit", handleExerciseSubmit);
    els.cancelCustomEdit.addEventListener("click", resetExerciseForm);
    els.libraryList.addEventListener("click", handleLibraryAction);
    els.muscleMapChips.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-map-group]");
      if (!button) {
        return;
      }
      selectLibraryGroup(button.dataset.mapGroup);
    });
    document.querySelector(".muscle-figure").addEventListener("click", (event) => {
      const zone = event.target.closest("[data-map-group]");
      if (!zone) {
        return;
      }
      selectLibraryGroup(zone.dataset.mapGroup);
    });
    document.querySelector(".muscle-figure").addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const zone = event.target.closest("[data-map-group]");
      if (!zone) {
        return;
      }
      event.preventDefault();
      selectLibraryGroup(zone.dataset.mapGroup);
    });

    els.historyExerciseFilter.addEventListener("change", () => {
      selectedHistoryDate = "";
      renderHistory();
    });
    els.historyGroupFilter.addEventListener("change", () => {
      selectedHistoryDate = "";
      renderHistory();
    });
    els.historyList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-history-date]");
      if (!button) {
        return;
      }
      selectedHistoryDate = button.dataset.historyDate;
      renderHistory();
    });

    els.weightUnitSelect.addEventListener("change", () => {
      state.settings.weightUnit = els.weightUnitSelect.value;
      persist();
      renderAll();
      showToast("Settings saved.");
    });

    els.bodyweightForm.addEventListener("submit", handleBodyweightSubmit);
    els.bodyweightList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-delete-bodyweight]");
      if (!button) {
        return;
      }
      deleteBodyweight(button.dataset.deleteBodyweight);
    });

    els.exportJsonButton.addEventListener("click", exportJsonBackup);
    els.importFileInput.addEventListener("change", importJsonBackup);
    els.exportCsvButton.addEventListener("click", exportHistoryCsv);

    window.addEventListener("resize", () => {
      if (activeTab === "dashboard") {
        renderDashboard();
      }
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return normalizeState({});
      }
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("Could not load workout data.", error);
      return normalizeState({});
    }
  }

  function normalizeState(input) {
    const source = input && typeof input === "object" ? input : {};
    const settings = source.settings && typeof source.settings === "object" ? source.settings : {};
    return {
      workouts: normalizeWorkouts(source.workouts),
      customExercises: Array.isArray(source.customExercises)
        ? source.customExercises.map(normalizeExercise).filter(Boolean)
        : [],
      bodyweights: Array.isArray(source.bodyweights)
        ? source.bodyweights.map(normalizeBodyweight).filter(Boolean)
        : [],
      settings: {
        weightUnit: settings.weightUnit === "lb" ? "lb" : "kg"
      }
    };
  }

  function normalizeWorkouts(workouts) {
    const normalized = {};
    if (!workouts || typeof workouts !== "object") {
      return normalized;
    }

    Object.entries(workouts).forEach(([date, workout]) => {
      if (!isISODate(date)) {
        return;
      }
      const entries = Array.isArray(workout && workout.entries)
        ? workout.entries
        : Array.isArray(workout)
          ? workout
          : [];
      normalized[date] = {
        date,
        entries: entries.map(normalizeEntry).filter(Boolean)
      };
    });

    return normalized;
  }

  function normalizeExercise(exercise) {
    if (!exercise || typeof exercise !== "object" || !exercise.name) {
      return null;
    }
    return {
      id: String(exercise.id || uid("custom")),
      name: String(exercise.name).trim(),
      muscleGroup: MUSCLE_GROUPS.includes(exercise.muscleGroup) ? exercise.muscleGroup : "Chest",
      type: EXERCISE_TYPES.includes(exercise.type) ? exercise.type : "strength",
      custom: true
    };
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object" || !entry.exerciseName) {
      return null;
    }
    return {
      id: String(entry.id || uid("entry")),
      exerciseId: String(entry.exerciseId || ""),
      exerciseName: String(entry.exerciseName),
      muscleGroup: MUSCLE_GROUPS.includes(entry.muscleGroup) ? entry.muscleGroup : "Chest",
      type: EXERCISE_TYPES.includes(entry.type) ? entry.type : "strength",
      sets: numberOrZero(entry.sets),
      reps: numberOrZero(entry.reps),
      weight: numberOrZero(entry.weight),
      duration: numberOrZero(entry.duration),
      distance: numberOrZero(entry.distance),
      notes: String(entry.notes || ""),
      pushupMax: numberOrZero(entry.pushupMax),
      emomMinutes: numberOrZero(entry.emomMinutes),
      emomRepsPerMinute: numberOrZero(entry.emomRepsPerMinute),
      createdAt: String(entry.createdAt || new Date().toISOString())
    };
  }

  function normalizeBodyweight(item) {
    if (!item || typeof item !== "object" || !isISODate(item.date)) {
      return null;
    }
    const weight = numberOrZero(item.weight);
    if (!weight) {
      return null;
    }
    return {
      id: String(item.id || uid("bodyweight")),
      date: item.date,
      weight
    };
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderAll() {
    renderDateLabels();
    renderExerciseSelects();
    renderToday();
    renderMuscleMap();
    renderLibrary();
    renderHistoryFilters();
    renderHistory();
    renderBodyweightList();
    renderDataSummary();
    syncSettingsInputs();

    if (activeTab === "dashboard") {
      renderDashboard();
    }
  }

  function renderDateLabels() {
    const today = todayISO();
    els.currentDateLabel.textContent = formatLongDate(today);
    els.todayTitle.textContent = `Log ${formatLongDate(today)}`;
  }

  function renderExerciseSelects() {
    const previousExercise = els.exerciseSelect.value;
    const selectedGroup = MUSCLE_GROUPS.includes(els.targetMuscleSelect.value)
      ? els.targetMuscleSelect.value
      : "Chest";
    const exercises = allExercises();
    const grouped = exercises.filter((exercise) => exercise.muscleGroup === selectedGroup);
    els.targetMuscleSelect.value = selectedGroup;
    els.exerciseSelect.innerHTML = "";

    grouped.forEach((exercise) => {
      const option = document.createElement("option");
      option.value = exercise.id;
      option.textContent = `${exercise.name} - ${titleCase(exercise.type)}`;
      els.exerciseSelect.append(option);
    });

    if (previousExercise && grouped.some((exercise) => exercise.id === previousExercise)) {
      els.exerciseSelect.value = previousExercise;
    } else if (selectedGroup === "Chest" && grouped.some((exercise) => exercise.id === "default-pushups")) {
      els.exerciseSelect.value = "default-pushups";
    } else if (grouped.length) {
      els.exerciseSelect.value = grouped[0].id;
    }
    updatePushupFields();
  }

  function renderToday() {
    const entries = todaysEntries();
    const totals = entries.reduce(
      (acc, entry) => {
        acc.sets += entryTotalSets(entry);
        acc.reps += entryTotalReps(entry);
        acc.pushups += pushupTotalForEntry(entry);
        return acc;
      },
      { sets: 0, reps: 0, pushups: 0 }
    );

    els.todayTotalSets.textContent = formatNumber(totals.sets);
    els.todayTotalReps.textContent = formatNumber(totals.reps);
    els.todayTotalPushups.textContent = formatNumber(totals.pushups);
    els.todayEntryCount.textContent = `${entries.length} ${entries.length === 1 ? "exercise" : "exercises"}`;

    els.todayEntries.innerHTML = entries
      .slice()
      .reverse()
      .map((entry) => renderEntryCard(entry, todayISO(), true))
      .join("");
  }

  function renderLibrary() {
    const exercises = allExercises();
    const groupsToShow = selectedLibraryGroup ? [selectedLibraryGroup] : MUSCLE_GROUPS;
    els.libraryList.innerHTML = groupsToShow.map((group) => {
      const grouped = exercises.filter((exercise) => exercise.muscleGroup === group);
      if (!grouped.length) {
        return "";
      }

      const cards = grouped
        .map((exercise) => {
          const isCustom = Boolean(exercise.custom);
          return `
            <article class="exercise-card ${isCustom ? "custom" : "default"}">
              <div>
                <div class="item-top">
                  <h4 class="item-title">${escapeHtml(exercise.name)}</h4>
                  <span class="tag ${isCustom ? "accent" : ""}">${isCustom ? "Custom" : "Default"}</span>
                </div>
                <p class="exercise-meta">${escapeHtml(group)} | ${escapeHtml(titleCase(exercise.type))}</p>
              </div>
              ${isCustom ? `
                <div class="exercise-actions">
                  <button class="ghost-button" type="button" data-action="edit" data-id="${escapeHtml(exercise.id)}">Edit</button>
                  <button class="danger-button" type="button" data-action="delete" data-id="${escapeHtml(exercise.id)}">Delete</button>
                </div>
              ` : ""}
            </article>
          `;
        })
        .join("");

      return `
        <section class="library-group">
          <h3>${escapeHtml(group)}</h3>
          <div class="library-grid">${cards}</div>
        </section>
      `;
    }).join("");
  }

  function renderMuscleMap() {
    const chipGroups = ["", ...MUSCLE_GROUPS];
    els.librarySelectedGroup.textContent = selectedLibraryGroup || "All groups";
    els.muscleMapChips.innerHTML = chipGroups.map((group) => {
      const label = group || "All groups";
      const active = group === selectedLibraryGroup ? " active" : "";
      return `<button class="map-chip${active}" type="button" data-map-group="${escapeHtml(group)}">${escapeHtml(label)}</button>`;
    }).join("");

    document.querySelectorAll(".svg-button[data-map-group]").forEach((zone) => {
      zone.classList.toggle("active", Boolean(selectedLibraryGroup) && zone.dataset.mapGroup === selectedLibraryGroup);
    });
  }

  function selectLibraryGroup(group) {
    selectedLibraryGroup = MUSCLE_GROUPS.includes(group) ? group : "";
    if (selectedLibraryGroup) {
      els.customGroup.value = selectedLibraryGroup;
    }
    renderMuscleMap();
    renderLibrary();
    showToast(selectedLibraryGroup ? `Showing ${selectedLibraryGroup} exercises.` : "Showing all exercise groups.");
    els.libraryList.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderHistoryFilters() {
    const selectedExercise = els.historyExerciseFilter.value;
    const exerciseNames = new Set(allExercises().map((exercise) => exercise.name));

    Object.values(state.workouts).forEach((workout) => {
      workout.entries.forEach((entry) => exerciseNames.add(entry.exerciseName));
    });

    const options = [
      { value: "", label: "All exercises" },
      ...Array.from(exerciseNames)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name }))
    ];
    fillSelect(els.historyExerciseFilter, options);
    els.historyExerciseFilter.value = options.some((option) => option.value === selectedExercise)
      ? selectedExercise
      : "";
  }

  function renderHistory() {
    const filtered = filteredHistory();
    if (!filtered.some((item) => item.date === selectedHistoryDate)) {
      selectedHistoryDate = filtered.length ? filtered[0].date : "";
    }

    els.historyList.innerHTML = filtered
      .map(({ date, entries }) => {
        const totalReps = entries.reduce((sum, entry) => sum + entryTotalReps(entry), 0);
        const groups = Array.from(new Set(entries.map((entry) => entry.muscleGroup))).join(", ");
        const active = selectedHistoryDate === date ? " active" : "";
        const exerciseCount = `${entries.length} ${entries.length === 1 ? "exercise" : "exercises"}`;
        return `
          <button class="history-card${active}" type="button" data-history-date="${escapeHtml(date)}">
            <div class="history-title">${escapeHtml(formatLongDate(date))}</div>
            <div class="history-meta">${exerciseCount} | ${formatNumber(totalReps)} reps | ${escapeHtml(groups || "No group")}</div>
          </button>
        `;
      })
      .join("");

    if (!selectedHistoryDate || !state.workouts[selectedHistoryDate]) {
      els.historyDetail.classList.add("hidden");
      els.historyDetail.innerHTML = "";
      return;
    }

    renderHistoryDetail(selectedHistoryDate);
  }

  function renderHistoryDetail(date) {
    const entries = state.workouts[date].entries;
    const totalSets = entries.reduce((sum, entry) => sum + entryTotalSets(entry), 0);
    const totalReps = entries.reduce((sum, entry) => sum + entryTotalReps(entry), 0);

    els.historyDetail.classList.remove("hidden");
    const exerciseCount = `${entries.length} ${entries.length === 1 ? "exercise" : "exercises"}`;
    els.historyDetail.innerHTML = `
      <div class="subhead no-margin">
        <div>
          <h3>${escapeHtml(formatLongDate(date))}</h3>
          <p class="muted">${exerciseCount} | ${formatNumber(totalSets)} sets | ${formatNumber(totalReps)} reps</p>
        </div>
      </div>
      ${entries.map((entry) => renderEntryCard(entry, date, false)).join("")}
    `;
  }

  function renderDashboard() {
    const now = new Date();
    const dates = workoutDates();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const monthDays = dates.filter((date) => {
      const value = dateFromISO(date);
      return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
    }).length;

    const weekDays = dates.filter((date) => {
      const value = dateFromISO(date);
      return value >= weekStart && value < weekEnd;
    }).length;

    const bestPushups = bestEverPushupMax();
    const progress = Math.min(100, Math.round((bestPushups / PUSHUP_GOAL) * 100));

    els.monthTrainingDays.textContent = formatNumber(monthDays);
    els.weekWorkoutDays.textContent = formatNumber(weekDays);
    els.bestPushupMax.textContent = formatNumber(bestPushups);
    els.pushupGoalText.textContent = bestPushups >= PUSHUP_GOAL
      ? "100%+"
      : `${progress}%`;
    els.bodyweightUnitLabel.textContent = state.settings.weightUnit;

    drawLineChart(els.pushupChart, pushupProgressSeries(), {
      color: "#35d07f",
      label: "Best set",
      empty: "No pushup max data yet.",
      target: PUSHUP_GOAL
    });

    drawLineChart(els.bodyweightChart, bodyweightSeries(), {
      color: "#6cb8ff",
      label: `Bodyweight (${state.settings.weightUnit})`,
      empty: "No bodyweight entries yet."
    });

    renderMuscleGroupBars();
  }

  function renderMuscleGroupBars() {
    const counts = {};
    Object.values(state.workouts).forEach((workout) => {
      workout.entries.forEach((entry) => {
        counts[entry.muscleGroup] = (counts[entry.muscleGroup] || 0) + 1;
      });
    });

    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!rows.length) {
      els.muscleGroupBars.innerHTML = `<p class="muted">No training data yet.</p>`;
      return;
    }

    const max = Math.max(...rows.map((row) => row[1]));
    els.muscleGroupBars.innerHTML = rows
      .map(([group, count]) => `
        <div class="bar-row">
          <div class="bar-label">
            <span>${escapeHtml(group)}</span>
            <strong>${formatNumber(count)}</strong>
          </div>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width: ${Math.max(8, (count / max) * 100)}%"></div>
          </div>
        </div>
      `)
      .join("");
  }

  function renderBodyweightList() {
    const sorted = state.bodyweights.slice().sort((a, b) => b.date.localeCompare(a.date));
    els.bodyweightList.innerHTML = sorted.slice(0, 6).map((item) => `
      <div class="bodyweight-row">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(formatLongDate(item.date))}</strong>
            <p class="item-meta">${formatNumber(item.weight)} ${escapeHtml(state.settings.weightUnit)}</p>
          </div>
          <button class="danger-button" type="button" data-delete-bodyweight="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
    `).join("");
  }

  function renderDataSummary() {
    const entryCount = Object.values(state.workouts).reduce((sum, workout) => sum + workout.entries.length, 0);
    const dayCount = workoutDates().length;
    els.dataSummaryText.textContent = `${plural(dayCount, "training day")}, ${plural(entryCount, "logged exercise")}, ${plural(state.customExercises.length, "custom exercise")}, ${plural(state.bodyweights.length, "bodyweight entry", "bodyweight entries")}.`;
  }

  function syncSettingsInputs() {
    const currentWeight = els.weightInput.value || "0";
    els.weightUnitSelect.value = state.settings.weightUnit;
    fillSelect(els.weightInput, weightOptions(currentWeight));
    if (Array.from(els.weightInput.options).some((option) => option.value === currentWeight)) {
      els.weightInput.value = currentWeight;
    }
    if (!els.bodyweightDateInput.value) {
      els.bodyweightDateInput.value = todayISO();
    }
  }

  function handleTodaySubmit(event) {
    event.preventDefault();
    const exercise = findExercise(els.exerciseSelect.value);
    if (!exercise) {
      showToast("Pick an exercise first.");
      return;
    }

    const entry = {
      id: uid("entry"),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      type: exercise.type,
      sets: readNumber(els.setsInput),
      reps: readNumber(els.repsInput),
      weight: readNumber(els.weightInput),
      duration: readNumber(els.durationInput),
      distance: readNumber(els.distanceInput),
      notes: els.notesInput.value.trim(),
      pushupMax: isPushup(exercise.name) ? readNumber(els.pushupMaxInput) : 0,
      emomMinutes: isPushup(exercise.name) ? readNumber(els.emomMinutesInput) : 0,
      emomRepsPerMinute: isPushup(exercise.name) ? readNumber(els.emomRepsInput) : 0,
      createdAt: new Date().toISOString()
    };

    if (!hasEntryData(entry)) {
      showToast("Add at least one number or note before saving.");
      return;
    }

    const date = todayISO();
    ensureWorkout(date).entries.push(entry);
    persist();
    resetLogForm(true);
    renderAll();
    showToast(`${entry.exerciseName} saved for today.`);
  }

  function handleExerciseSubmit(event) {
    event.preventDefault();
    const name = els.customName.value.trim();
    const muscleGroup = els.customGroup.value;
    const type = els.customType.value;

    if (!name || !MUSCLE_GROUPS.includes(muscleGroup) || !EXERCISE_TYPES.includes(type)) {
      showToast("Complete the custom exercise fields.");
      return;
    }

    const existingId = els.customExerciseId.value;
    if (existingId) {
      const exercise = state.customExercises.find((item) => item.id === existingId);
      if (exercise) {
        exercise.name = name;
        exercise.muscleGroup = muscleGroup;
        exercise.type = type;
        showToast("Custom exercise updated.");
      }
    } else {
      state.customExercises.push({
        id: uid("custom"),
        name,
        muscleGroup,
        type,
        custom: true
      });
      showToast("Custom exercise added.");
    }

    persist();
    resetExerciseForm();
    renderAll();
  }

  function handleLibraryAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const id = button.dataset.id;
    const exercise = state.customExercises.find((item) => item.id === id);
    if (!exercise) {
      return;
    }

    if (button.dataset.action === "edit") {
      els.customExerciseId.value = exercise.id;
      els.customName.value = exercise.name;
      els.customGroup.value = exercise.muscleGroup;
      els.customType.value = exercise.type;
      els.saveCustomExercise.textContent = "Save changes";
      els.cancelCustomEdit.classList.remove("hidden");
      els.customName.focus();
      showToast("Editing custom exercise.");
      return;
    }

    if (button.dataset.action === "delete") {
      const ok = window.confirm(`Delete "${exercise.name}" from custom exercises? Existing workout logs will keep their saved name.`);
      if (!ok) {
        return;
      }
      state.customExercises = state.customExercises.filter((item) => item.id !== id);
      persist();
      renderAll();
      showToast("Custom exercise deleted.");
    }
  }

  function handleBodyweightSubmit(event) {
    event.preventDefault();
    const date = els.bodyweightDateInput.value;
    const weight = readNumber(els.bodyweightValueInput);
    if (!isISODate(date) || !weight) {
      showToast("Add a date and bodyweight.");
      return;
    }

    const existing = state.bodyweights.find((item) => item.date === date);
    if (existing) {
      existing.weight = weight;
    } else {
      state.bodyweights.push({ id: uid("bodyweight"), date, weight });
    }
    state.bodyweights.sort((a, b) => a.date.localeCompare(b.date));
    els.bodyweightValueInput.value = "";
    persist();
    renderAll();
    showToast("Bodyweight saved.");
  }

  function deleteBodyweight(id) {
    state.bodyweights = state.bodyweights.filter((item) => item.id !== id);
    persist();
    renderAll();
    showToast("Bodyweight entry deleted.");
  }

  function deleteEntry(date, id) {
    const workout = state.workouts[date];
    if (!workout) {
      return;
    }
    workout.entries = workout.entries.filter((entry) => entry.id !== id);
    if (!workout.entries.length) {
      delete state.workouts[date];
      if (selectedHistoryDate === date) {
        selectedHistoryDate = "";
      }
    }
    persist();
    renderAll();
    showToast("Workout entry deleted.");
  }

  function exportJsonBackup() {
    const payload = {
      schemaVersion: 1,
      app: "Personal Workout Tracker",
      exportedAt: new Date().toISOString(),
      data: state
    };
    downloadFile(`workout-tracker-backup-${todayISO()}.json`, JSON.stringify(payload, null, 2), "application/json");
    showToast("JSON backup exported.");
  }

  function importJsonBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = normalizeState(parsed.data || parsed);
        const ok = window.confirm("Import this backup and replace the data on this device?");
        if (!ok) {
          event.target.value = "";
          return;
        }
        state = imported;
        selectedHistoryDate = "";
        persist();
        renderAll();
        showToast("Backup imported.");
      } catch (error) {
        console.error(error);
        showToast("That JSON backup could not be imported.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
  }

  function exportHistoryCsv() {
    const headers = [
      "date",
      "exercise",
      "muscle_group",
      "type",
      "sets",
      "reps",
      "weight",
      "duration_minutes",
      "distance_km",
      "notes",
      "pushup_max",
      "emom_minutes",
      "emom_reps_per_minute",
      "total_reps"
    ];

    const rows = workoutDates().flatMap((date) => {
      const workout = state.workouts[date];
      return workout.entries.map((entry) => [
        date,
        entry.exerciseName,
        entry.muscleGroup,
        entry.type,
        entry.sets,
        entry.reps,
        entry.weight,
        entry.duration,
        entry.distance,
        entry.notes,
        entry.pushupMax,
        entry.emomMinutes,
        entry.emomRepsPerMinute,
        entryTotalReps(entry)
      ]);
    });

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadFile(`workout-history-${todayISO()}.csv`, csv, "text/csv");
    showToast("Workout history CSV exported.");
  }

  function setActiveTab(tabId, updateHash = true) {
    if (!document.getElementById(tabId)) {
      return;
    }
    activeTab = tabId;
    els.tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
    els.tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
    if (updateHash) {
      window.history.replaceState(null, "", `#${tabId}`);
    }
    if (tabId === "dashboard") {
      requestAnimationFrame(renderDashboard);
    }
  }

  function resetLogForm(keepExercise) {
    const selected = els.exerciseSelect.value;
    const selectedGroup = els.targetMuscleSelect.value;
    els.todayForm.reset();
    if (keepExercise) {
      els.targetMuscleSelect.value = selectedGroup;
      renderExerciseSelects();
      els.exerciseSelect.value = selected;
    }
    els.setsInput.value = "3";
    els.repsInput.value = "10";
    els.weightInput.value = "0";
    updatePushupFields();
  }

  function resetExerciseForm() {
    els.exerciseForm.reset();
    els.customExerciseId.value = "";
    els.customGroup.value = "Chest";
    els.customType.value = "strength";
    els.saveCustomExercise.textContent = "Add custom";
    els.cancelCustomEdit.classList.add("hidden");
  }

  function updatePushupFields() {
    const exercise = findExercise(els.exerciseSelect.value);
    const show = exercise ? isPushup(exercise.name) : false;
    els.pushupFields.classList.toggle("hidden", !show);
    const total = readNumber(els.emomMinutesInput) * readNumber(els.emomRepsInput);
    els.emomTotalBadge.textContent = `${formatNumber(total)} total`;
  }

  function filteredHistory() {
    const selectedExercise = els.historyExerciseFilter.value;
    const selectedGroup = els.historyGroupFilter.value;

    return workoutDates()
      .map((date) => {
        const entries = state.workouts[date].entries.filter((entry) => {
          const exerciseMatch = !selectedExercise || entry.exerciseName === selectedExercise;
          const groupMatch = !selectedGroup || entry.muscleGroup === selectedGroup;
          return exerciseMatch && groupMatch;
        });
        return { date, entries };
      })
      .filter((item) => item.entries.length)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function renderEntryCard(entry, date, canDelete) {
    const summary = entrySummary(entry);
    const notes = entry.notes ? `<p class="entry-notes">${escapeHtml(entry.notes)}</p>` : "";
    const deleteButton = canDelete
      ? `<button class="danger-button" type="button" data-delete-entry="${escapeHtml(entry.id)}" data-date="${escapeHtml(date)}">Delete</button>`
      : "";

    return `
      <article class="item-card">
        <div class="item-top">
          <div>
            <div class="item-title">${escapeHtml(entry.exerciseName)}</div>
            <div class="item-meta">${escapeHtml(entry.muscleGroup)} | ${escapeHtml(titleCase(entry.type))}</div>
          </div>
          <span class="pill">${formatNumber(entryTotalReps(entry))} reps</span>
        </div>
        <p class="item-meta">${escapeHtml(summary)}</p>
        ${notes}
        ${deleteButton ? `<div class="item-actions">${deleteButton}</div>` : ""}
      </article>
    `;
  }

  function entrySummary(entry) {
    const parts = [];
    if (entry.sets && entry.reps) {
      parts.push(`${formatNumber(entry.sets)} sets x ${formatNumber(entry.reps)} reps`);
    } else if (entry.sets) {
      parts.push(`${formatNumber(entry.sets)} sets`);
    } else if (entry.reps) {
      parts.push(`${formatNumber(entry.reps)} reps`);
    }
    if (entry.weight) {
      parts.push(`${formatNumber(entry.weight)} ${state.settings.weightUnit}`);
    }
    if (entry.duration) {
      parts.push(`${formatNumber(entry.duration)} min`);
    }
    if (entry.distance) {
      parts.push(`${formatNumber(entry.distance)} km`);
    }
    if (entry.pushupMax) {
      parts.push(`max set ${formatNumber(entry.pushupMax)}`);
    }
    if (entry.emomMinutes && entry.emomRepsPerMinute) {
      parts.push(`EMOM ${formatNumber(entry.emomMinutes)} min x ${formatNumber(entry.emomRepsPerMinute)} = ${formatNumber(entry.emomMinutes * entry.emomRepsPerMinute)}`);
    }
    return parts.join(" | ") || "Logged";
  }

  function allExercises() {
    return [
      ...DEFAULT_EXERCISES.map((exercise) => ({ ...exercise, custom: false })),
      ...state.customExercises.map((exercise) => ({ ...exercise, custom: true }))
    ].sort((a, b) => {
      const groupDelta = MUSCLE_GROUPS.indexOf(a.muscleGroup) - MUSCLE_GROUPS.indexOf(b.muscleGroup);
      if (groupDelta !== 0) {
        return groupDelta;
      }
      if (a.custom !== b.custom) {
        return a.custom ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  function findExercise(id) {
    return allExercises().find((exercise) => exercise.id === id);
  }

  function todaysEntries() {
    const workout = state.workouts[todayISO()];
    return workout ? workout.entries : [];
  }

  function ensureWorkout(date) {
    if (!state.workouts[date]) {
      state.workouts[date] = { date, entries: [] };
    }
    return state.workouts[date];
  }

  function workoutDates() {
    return Object.keys(state.workouts)
      .filter((date) => state.workouts[date] && state.workouts[date].entries && state.workouts[date].entries.length)
      .sort((a, b) => a.localeCompare(b));
  }

  function entryTotalSets(entry) {
    const emomSets = isPushup(entry.exerciseName) && entry.emomMinutes && entry.emomRepsPerMinute ? entry.emomMinutes : 0;
    return numberOrZero(entry.sets) + emomSets;
  }

  function entryTotalReps(entry) {
    if (isPushup(entry.exerciseName)) {
      return pushupTotalForEntry(entry);
    }
    if (entry.sets && entry.reps) {
      return entry.sets * entry.reps;
    }
    return numberOrZero(entry.reps);
  }

  function pushupTotalForEntry(entry) {
    if (!isPushup(entry.exerciseName)) {
      return 0;
    }
    const setTotal = entry.sets && entry.reps ? entry.sets * entry.reps : numberOrZero(entry.reps);
    const emomTotal = entry.emomMinutes && entry.emomRepsPerMinute
      ? entry.emomMinutes * entry.emomRepsPerMinute
      : 0;
    const total = setTotal + emomTotal;
    return total || numberOrZero(entry.pushupMax);
  }

  function singleSetPushupMax(entry) {
    if (!isPushup(entry.exerciseName)) {
      return 0;
    }
    return Math.max(numberOrZero(entry.pushupMax), numberOrZero(entry.reps), numberOrZero(entry.emomRepsPerMinute));
  }

  function bestEverPushupMax() {
    let best = 0;
    Object.values(state.workouts).forEach((workout) => {
      workout.entries.forEach((entry) => {
        best = Math.max(best, singleSetPushupMax(entry));
      });
    });
    return best;
  }

  function pushupProgressSeries() {
    return workoutDates()
      .map((date) => {
        const best = state.workouts[date].entries.reduce((max, entry) => Math.max(max, singleSetPushupMax(entry)), 0);
        return { date, value: best };
      })
      .filter((point) => point.value > 0);
  }

  function bodyweightSeries() {
    return state.bodyweights
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({ date: item.date, value: item.weight }));
  }

  function drawLineChart(canvas, points, options) {
    const ctx = canvas.getContext("2d");
    const cssWidth = Math.max(280, Math.round(canvas.getBoundingClientRect().width || canvas.parentElement.clientWidth || 320));
    const cssHeight = Math.max(180, Number(canvas.getAttribute("height")) || 190);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { top: 18, right: 18, bottom: 32, left: 42 };
    const plotWidth = cssWidth - padding.left - padding.right;
    const plotHeight = cssHeight - padding.top - padding.bottom;

    ctx.fillStyle = "#111617";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    drawGrid(ctx, padding, plotWidth, plotHeight);

    if (!points.length) {
      ctx.fillStyle = "#9aa7a3";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(options.empty, cssWidth / 2, cssHeight / 2);
      return;
    }

    const values = points.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values, options.target || 0);
    const range = Math.max(1, maxValue - minValue);
    const paddedMin = Math.max(0, minValue - range * 0.12);
    const paddedMax = maxValue + range * 0.12;
    const scaledRange = Math.max(1, paddedMax - paddedMin);

    const xFor = (index) => points.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (plotWidth * index) / (points.length - 1);
    const yFor = (value) => padding.top + plotHeight - ((value - paddedMin) / scaledRange) * plotHeight;

    if (options.target) {
      const targetY = yFor(options.target);
      ctx.strokeStyle = "rgba(255, 209, 102, 0.7)";
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(padding.left, targetY);
      ctx.lineTo(padding.left + plotWidth, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffd166";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${options.target}`, padding.left + plotWidth, targetY - 6);
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
    gradient.addColorStop(0, options.color);
    gradient.addColorStop(1, "rgba(53, 208, 127, 0.04)");

    ctx.strokeStyle = options.color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);
      ctx.fillStyle = "#101314";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = options.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    const first = points[0];
    const last = points[points.length - 1];
    ctx.fillStyle = "#9aa7a3";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(shortDate(first.date), padding.left, cssHeight - 10);
    ctx.textAlign = "right";
    ctx.fillText(shortDate(last.date), padding.left + plotWidth, cssHeight - 10);
    ctx.fillStyle = "#edf3f2";
    ctx.textAlign = "right";
    ctx.fillText(formatNumber(last.value), padding.left + plotWidth, Math.max(16, yFor(last.value) - 10));
  }

  function drawGrid(ctx, padding, plotWidth, plotHeight) {
    ctx.strokeStyle = "rgba(42, 50, 54, 0.75)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i += 1) {
      const y = padding.top + (plotHeight * i) / 3;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
    }
  }

  function hasEntryData(entry) {
    return [
      entry.sets,
      entry.reps,
      entry.weight,
      entry.duration,
      entry.distance,
      entry.pushupMax,
      entry.emomMinutes,
      entry.emomRepsPerMinute
    ].some((value) => numberOrZero(value) > 0) || Boolean(entry.notes);
  }

  function isPushup(name) {
    const normalized = normalizeName(name);
    return normalized === "pushup" || normalized === "pushups";
  }

  function normalizeName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function readNumber(input) {
    return numberOrZero(input.value);
  }

  function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function formatNumber(value) {
    const number = numberOrZero(value);
    if (Number.isInteger(number)) {
      return String(number);
    }
    return number.toFixed(2).replace(/\.?0+$/, "");
  }

  function plural(count, singular, pluralText) {
    return `${formatNumber(count)} ${count === 1 ? singular : (pluralText || `${singular}s`)}`;
  }

  function fillSelect(select, options) {
    select.innerHTML = "";
    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.append(option);
    });
  }

  function presetOptions(label, start, end, step, defaultValue) {
    const options = [];
    for (let value = start; value <= end; value += step) {
      const optionLabel = value === 1 && label.endsWith("s") ? label.slice(0, -1) : label;
      options.push({
        value: String(value),
        label: `${formatNumber(value)} ${optionLabel}`,
        selected: value === defaultValue
      });
    }
    return options;
  }

  function weightOptions(currentValue) {
    const unit = state.settings.weightUnit;
    const max = unit === "lb" ? 400 : 200;
    const step = unit === "lb" ? 5 : 2.5;
    const options = [{ value: "0", label: `Bodyweight / 0 ${unit}` }];
    for (let value = step; value <= max; value += step) {
      options.push({ value: String(value), label: `${formatNumber(value)} ${unit}` });
    }
    if (currentValue && Number(currentValue) > 0 && !options.some((option) => option.value === currentValue)) {
      options.push({ value: currentValue, label: `${formatNumber(currentValue)} ${unit}` });
    }
    return options;
  }

  function uid(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function todayISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function isISODate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function dateFromISO(date) {
    return new Date(`${date}T12:00:00`);
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(dateFromISO(date));
  }

  function shortDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric"
    }).format(dateFromISO(date));
  }

  function startOfWeek(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    return start;
  }

  function titleCase(value) {
    return String(value)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2600);
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      els.installButton.hidden = false;
    });

    els.installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installButton.hidden = true;
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) {
      return;
    }

    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  }
})();
