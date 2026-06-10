const STORAGE_KEY = 'matlogg.entries.v1';
const SETTINGS_KEY = 'matlogg.settings.v1';
const BACKUP_KEY = 'matlogg.backup.v1';

const moods = [
  { id: 'veryGood', emoji: '😊', label: 'Veldig bra', score: 5, color: '#b8d879' },
  { id: 'good', emoji: '🙂', label: 'Bra', score: 4, color: '#ffd45f' },
  { id: 'neutral', emoji: '😐', label: 'Nøytral', score: 3, color: '#ffd9ad' },
  { id: 'bad', emoji: '🙁', label: 'Dårlig', score: 2, color: '#ffad64' },
  { id: 'veryBad', emoji: '😢', label: 'Veldig dårlig', score: 1, color: '#ff8298' }
];

const symptoms = [
  'Kvalm',
  'Kastet opp',
  'Overspist',
  'Magesmerter',
  'Oppblåst',
  'Energiløs',
  'Annet'
];

const positiveStates = [
  'Ikke kvalm',
  'Ikke kastet opp',
  'Passe mett',
  'Ingen magesmerter',
  'Ikke oppblåst',
  'Energi ok',
  'Annet positivt'
];

const defaultMealTimes = ['10:00', '16:00', '21:00'];
let selectedDate = dateKey(new Date());
let statsPeriod = 'week';
const reminderTimers = [];
let deferredInstallPrompt = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function dateKey(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
}

function formatDate(key, options) {
  return new Intl.DateTimeFormat('nb-NO', options).format(new Date(`${key}T12:00:00`));
}

function defaultDay(key) {
  return {
    date: key,
    mood: '',
    comment: '',
    meals: getMealTimes().map((time) => ({ time, note: '', symptoms: [], positives: [] }))
  };
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  localStorage.setItem(BACKUP_KEY, JSON.stringify({
    createdAt: new Date().toISOString(),
    entries
  }));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getMealTimes() {
  const settings = loadSettings();
  const times = Array.isArray(settings.mealTimes) ? settings.mealTimes : defaultMealTimes;
  const cleaned = [...new Set(times.filter((time) => /^\d{2}:\d{2}$/.test(time)))];
  return cleaned.length ? cleaned.sort() : defaultMealTimes;
}

function saveMealTimes(times) {
  const settings = loadSettings();
  settings.mealTimes = [...new Set(times.filter((time) => /^\d{2}:\d{2}$/.test(time)))].sort();
  if (!settings.mealTimes.length) settings.mealTimes = [...defaultMealTimes];
  saveSettings(settings);
}

function normalizeDay(day) {
  const existing = Array.isArray(day.meals) ? day.meals : [];
  const meals = getMealTimes().map((time, index) => {
    const exact = existing.find((meal) => meal.time === time);
    const fallback = existing[index];
    const source = exact || fallback || {};
    return {
      time,
      note: source.note || '',
      symptoms: Array.isArray(source.symptoms) ? source.symptoms : [],
      positives: Array.isArray(source.positives) ? source.positives : []
    };
  });
  return { ...day, meals };
}

function getDay(key = selectedDate) {
  const entries = loadEntries();
  return normalizeDay(entries[key] || defaultDay(key));
}

function updateDay(mutator) {
  const entries = loadEntries();
  const day = getDay();
  mutator(day);
  entries[selectedDate] = day;
  saveEntries(entries);
  render();
}

function render() {
  renderHome();
  renderHistory();
  renderStats();
}

function renderHome() {
  const day = getDay();
  $('#datePicker').value = selectedDate;
  $('#historyDate').value = selectedDate;
  $('#todayTitle').textContent = capitalize(formatDate(selectedDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }));
  $('#weekdayBadge').textContent = formatDate(selectedDate, { weekday: 'short' }).toUpperCase();
  $('#dateBadge').textContent = formatDate(selectedDate, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  $('#moodButtons').innerHTML = moods.map((mood) => `
    <button
      class="mood-button"
      type="button"
      role="radio"
      aria-checked="${day.mood === mood.id}"
      aria-label="${mood.label}"
      title="${mood.label}"
      data-mood="${mood.id}"
      style="background:${mood.color}"
    >${mood.emoji}</button>
  `).join('');

  $('#dayComment').value = day.comment;
  renderMeals(day);
}

function renderMeals(day) {
  const mealList = $('#mealList');
  const template = $('#mealTemplate');
  mealList.innerHTML = '';

  day.meals.forEach((meal) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.time = meal.time;
    const timeInput = node.querySelector('.time-pill-input');
    timeInput.value = meal.time;
    timeInput.dataset.oldTime = meal.time;
    const removeButton = node.querySelector('.remove-time-button');
    removeButton.dataset.removeTime = meal.time;
    removeButton.hidden = day.meals.length <= 1;
    const textarea = node.querySelector('textarea');
    textarea.value = meal.note;
    textarea.addEventListener('input', () => {
      updateDay((draft) => {
        draft.meals.find((item) => item.time === meal.time).note = textarea.value;
      });
    });

    const wrap = node.querySelector('.symptom-wrap');
    wrap.innerHTML = symptoms.map((symptom) => `
      <button
        type="button"
        class="chip ${meal.symptoms.includes(symptom) ? 'active' : ''}"
        data-time="${meal.time}"
        data-symptom="${symptom}"
        aria-pressed="${meal.symptoms.includes(symptom)}"
      >${symptom}</button>
    `).join('');

    const positiveWrap = node.querySelector('.positive-wrap');
    positiveWrap.innerHTML = positiveStates.map((state) => `
      <button
        type="button"
        class="chip ${meal.positives.includes(state) ? 'active' : ''}"
        data-time="${meal.time}"
        data-positive="${state}"
        aria-pressed="${meal.positives.includes(state)}"
      >${state}</button>
    `).join('');
    mealList.appendChild(node);
  });
}

function renderHistory() {
  const items = Object.values(loadEntries())
    .sort((a, b) => b.date.localeCompare(a.date));

  $('#historyList').innerHTML = items.length ? items.map((day) => {
    const mood = moods.find((item) => item.id === day.mood);
    const symptomCount = day.meals.reduce((sum, meal) => sum + meal.symptoms.length, 0);
    return `
      <article class="history-item">
        <span class="mood-dot">${mood?.emoji || '♡'}</span>
        <div>
          <strong>${capitalize(formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</strong>
          <small>${escapeHtml(day.comment || 'Ingen dagskommentar')} · ${symptomCount} symptomer</small>
        </div>
        <button class="soft-button" type="button" data-edit-date="${day.date}">Rediger</button>
      </article>
    `;
  }).join('') : `
    <article class="planner-card compact">
      <p class="hint">Ingen registreringer ennå. De dukker opp her når du skriver noe.</p>
    </article>
  `;
}

function renderStats() {
  const days = filteredDays();
  $('#loggedDays').textContent = days.length;
  $('#nauseaDays').textContent = countDaysWith(days, 'Kvalm');
  $('#vomitDays').textContent = countDaysWith(days, 'Kastet opp');

  const counts = Object.fromEntries(symptoms.map((symptom) => [symptom, 0]));
  days.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.symptoms.forEach((symptom) => counts[symptom] += 1);
    });
  });

  $('#symptomStats').innerHTML = symptoms.map((symptom) => `
    <div class="stat-row"><span>${symptom}</span><strong>${counts[symptom]}</strong></div>
  `).join('');

  const pairs = [];
  days.forEach((day) => {
    day.meals.forEach((meal) => {
      if (meal.note.trim() && meal.symptoms.length) {
        pairs.push(`${formatDate(day.date, { day: '2-digit', month: '2-digit' })} kl. ${meal.time}: ${escapeHtml(meal.note.trim())} → ${meal.symptoms.join(', ')}`);
      }
    });
  });
  $('#correlations').innerHTML = pairs.length
    ? pairs.slice(0, 8).map((pair) => `<div class="stat-row"><span>${pair}</span></div>`).join('')
    : '<p class="hint">Når mat og symptomer registreres samme tidspunkt, vises mulige sammenhenger her.</p>';

  drawMoodChart(days);
}

function filteredDays() {
  const now = new Date();
  const start = new Date(now);
  if (statsPeriod === 'week') {
    start.setDate(now.getDate() - 6);
  } else {
    start.setDate(1);
  }
  return Object.values(loadEntries())
    .filter((day) => new Date(`${day.date}T12:00:00`) >= new Date(dateKey(start) + 'T00:00:00'))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function countDaysWith(days, symptom) {
  return days.filter((day) => day.meals.some((meal) => meal.symptoms.includes(symptom))).length;
}

function drawMoodChart(days) {
  const canvas = $('#moodChart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--card');
  ctx.fillRect(0, 0, width, height);

  const plot = { left: 46, top: 24, right: width - 18, bottom: height - 42 };
  ctx.strokeStyle = 'rgba(239,111,154,.24)';
  ctx.lineWidth = 2;
  ctx.font = '700 18px system-ui';
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted');

  for (let score = 1; score <= 5; score += 1) {
    const y = plot.bottom - ((score - 1) / 4) * (plot.bottom - plot.top);
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();
    ctx.fillText(score, 16, y + 6);
  }

  const points = days
    .map((day) => ({ day, mood: moods.find((item) => item.id === day.mood) }))
    .filter((item) => item.mood);

  if (!points.length) {
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted');
    ctx.font = '800 22px system-ui';
    ctx.fillText('Velg humør noen dager, så tegnes grafen her.', 78, 134);
    return;
  }

  const step = points.length === 1 ? 0 : (plot.right - plot.left) / (points.length - 1);
  const coords = points.map((point, index) => ({
    x: plot.left + step * index,
    y: plot.bottom - ((point.mood.score - 1) / 4) * (plot.bottom - plot.top),
    label: formatDate(point.day.date, { day: '2-digit', month: '2-digit' }),
    mood: point.mood
  }));

  ctx.strokeStyle = '#ef6f9a';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  coords.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  coords.forEach((point) => {
    ctx.beginPath();
    ctx.fillStyle = point.mood.color;
    ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted');
    ctx.font = '700 15px system-ui';
    ctx.fillText(point.label, point.x - 22, height - 12);
  });
}

function setView(id) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === id));
  $$('.bottom-nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupReminders(enabled) {
  reminderTimers.forEach(clearTimeout);
  reminderTimers.length = 0;
  if (!enabled || !('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
  if (Notification.permission !== 'granted') return;

  getMealTimes().forEach((time) => {
    const schedule = () => {
      const [hour, minute] = time.split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const timer = setTimeout(() => {
        new Notification(`Matlogg ${time}`, {
          body: 'Tid for en liten registrering.',
          icon: 'icon.svg'
        });
        schedule();
      }, target - now);
      reminderTimers.push(timer);
    };
    schedule();
  });
}

function exportPdf() {
  window.print();
}

function exportJpg() {
  const day = getDay();
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ef6f9a';
  ctx.font = '900 92px cursive';
  ctx.fillText('Matlogg ♡', 74, 130);
  ctx.fillStyle = '#44333d';
  ctx.font = '800 36px system-ui';
  ctx.fillText(formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 78, 196);
  const mood = moods.find((item) => item.id === day.mood);
  ctx.fillText(`Humør: ${mood ? `${mood.emoji} ${mood.label}` : '-'}`, 78, 270);
  wrapCanvasText(ctx, `Kommentar: ${day.comment || '-'}`, 78, 334, 980, 42);
  let y = 500;
  day.meals.forEach((meal) => {
    ctx.fillStyle = '#ffddea';
    roundRect(ctx, 78, y - 48, 1040, 210, 32);
    ctx.fill();
    ctx.fillStyle = '#44333d';
    ctx.font = '900 34px system-ui';
    ctx.fillText(meal.time, 112, y);
    ctx.font = '700 30px system-ui';
    wrapCanvasText(ctx, meal.note || '-', 112, y + 50, 940, 36);
    ctx.fillText(`Symptomer: ${meal.symptoms.join(', ') || '-'}`, 112, y + 124);
    ctx.fillText(`Bra tegn: ${meal.positives.join(', ') || '-'}`, 112, y + 164);
    y += 250;
  });
  const link = document.createElement('a');
  link.download = `matlogg-${day.date}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.92);
  link.click();
}

async function shareData() {
  const day = getDay();
  const mood = moods.find((item) => item.id === day.mood);
  const text = [
    `Matlogg ${day.date}`,
    `Humør: ${mood?.label || '-'}`,
    `Kommentar: ${day.comment || '-'}`,
    ...day.meals.map((meal) => `${meal.time}: ${meal.note || '-'} | Symptomer: ${meal.symptoms.join(', ') || '-'} | Bra tegn: ${meal.positives.join(', ') || '-'}`)
  ].join('\n');
  if (navigator.share) {
    await navigator.share({ title: 'Matlogg', text });
  } else {
    location.href = `mailto:?subject=Matlogg ${day.date}&body=${encodeURIComponent(text)}`;
  }
}

async function installApp() {
  const hint = $('#installHint');
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    if (hint) hint.textContent = 'Matlogg er allerede installert som app.';
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (hint) hint.textContent = 'Hvis installasjonen ikke startet: åpne menyen i Chrome/Samsung Internet og velg Legg til på startskjermen.';
    return;
  }

  if (hint) {
    hint.textContent = 'Hvis knappen ikke åpner installasjon: trykk ⋮ oppe til høyre i Chrome eller menyen i Samsung Internet, og velg Installer app eller Legg til på startskjermen.';
  }
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  words.forEach((word) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  ctx.fillText(line, x, y);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bindEvents() {
  $('#datePicker').addEventListener('change', (event) => {
    selectedDate = event.target.value;
    render();
  });
  $('#historyDate').addEventListener('change', (event) => {
    selectedDate = event.target.value;
    setView('homeView');
    render();
  });
  $('#todayButton').addEventListener('click', () => {
    selectedDate = dateKey(new Date());
    setView('homeView');
    render();
  });
  $('#dayComment').addEventListener('input', (event) => {
    updateDay((day) => day.comment = event.target.value);
  });
  document.body.addEventListener('click', (event) => {
    const moodButton = event.target.closest('[data-mood]');
    if (moodButton) {
      updateDay((day) => day.mood = moodButton.dataset.mood);
    }

    const chip = event.target.closest('[data-symptom]');
    if (chip) {
      updateDay((day) => {
        const meal = day.meals.find((item) => item.time === chip.dataset.time);
        if (!meal) return;
        const symptom = chip.dataset.symptom;
        meal.symptoms = meal.symptoms.includes(symptom)
          ? meal.symptoms.filter((item) => item !== symptom)
          : [...meal.symptoms, symptom];
      });
    }

    const positive = event.target.closest('[data-positive]');
    if (positive) {
      updateDay((day) => {
        const meal = day.meals.find((item) => item.time === positive.dataset.time);
        if (!meal) return;
        const state = positive.dataset.positive;
        meal.positives = meal.positives.includes(state)
          ? meal.positives.filter((item) => item !== state)
          : [...meal.positives, state];
      });
    }

    const nav = event.target.closest('.bottom-nav [data-view]');
    if (nav) setView(nav.dataset.view);

    const edit = event.target.closest('[data-edit-date]');
    if (edit) {
      selectedDate = edit.dataset.editDate;
      setView('homeView');
      render();
    }

    const removeTime = event.target.closest('[data-remove-time]');
    if (removeTime) {
      const times = getMealTimes();
      if (times.length <= 1) return;
      const timeToRemove = removeTime.dataset.removeTime;
      saveMealTimes(times.filter((time) => time !== timeToRemove));
      const entries = loadEntries();
      Object.values(entries).forEach((day) => {
        day.meals = (day.meals || []).filter((meal) => meal.time !== timeToRemove);
      });
      saveEntries(entries);
      render();
      setupReminders(loadSettings().reminders);
    }
  });

  document.body.addEventListener('change', (event) => {
    const timeInput = event.target.closest('.time-pill-input');
    if (!timeInput) return;
    const oldTime = timeInput.dataset.oldTime;
    const newTime = timeInput.value;
    if (!oldTime || !newTime || oldTime === newTime) return;
    const times = getMealTimes();
    const index = times.indexOf(oldTime);
    if (index === -1) return;
    times[index] = newTime;
    saveMealTimes(times);
    const entries = loadEntries();
    Object.values(entries).forEach((day) => {
      const meal = (day.meals || []).find((item) => item.time === oldTime);
      if (meal) meal.time = newTime;
    });
    saveEntries(entries);
    render();
    setupReminders(loadSettings().reminders);
  });

  $$('.segment [data-period]').forEach((button) => {
    button.addEventListener('click', () => {
      statsPeriod = button.dataset.period;
      $$('.segment [data-period]').forEach((item) => item.classList.toggle('active', item === button));
      renderStats();
    });
  });

  $('#exportPdf').addEventListener('click', exportPdf);
  $('#exportJpg').addEventListener('click', exportJpg);
  $('#shareData').addEventListener('click', shareData);
  $('#installApp').addEventListener('click', installApp);
  $('#addTime').addEventListener('click', () => {
    const times = getMealTimes();
    const suggestion = ['08:00', '12:00', '14:00', '18:00', '20:00', '22:00']
      .find((time) => !times.includes(time)) || '12:00';
    times.push(suggestion);
    saveMealTimes(times);
    render();
    setupReminders(loadSettings().reminders);
  });

  $('#darkToggle').addEventListener('change', (event) => {
    const settings = loadSettings();
    settings.dark = event.target.checked;
    saveSettings(settings);
    document.body.classList.toggle('dark', settings.dark);
    renderStats();
  });

  $('#remindersToggle').addEventListener('change', (event) => {
    const settings = loadSettings();
    settings.reminders = event.target.checked;
    saveSettings(settings);
    setupReminders(settings.reminders);
  });
}

function init() {
  const settings = loadSettings();
  document.body.classList.toggle('dark', Boolean(settings.dark));
  $('#darkToggle').checked = Boolean(settings.dark);
  $('#remindersToggle').checked = Boolean(settings.reminders);
  bindEvents();
  render();
  setupReminders(Boolean(settings.reminders));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const hint = $('#installHint');
  if (hint) hint.textContent = 'Klar til installasjon: trykk Installer på Samsung / Android.';
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const hint = $('#installHint');
  if (hint) hint.textContent = 'Matlogg er installert på enheten.';
});

init();
