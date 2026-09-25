let allWorkouts = [];
let currentDay = getCurrentDayOfWeek();

function normalizeDisplayText(value, fallback = '') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;

  // Если текст уже читаемый (есть кириллица или обычный человеческий текст) — оставляем как есть.
  if (/[А-Яа-яЁё]/.test(raw) || raw.includes(' ')) {
    return raw;
  }

  const words = raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!words) return fallback;

  return words
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
  setupDaySelector();
  loadWorkouts();
});

// Определяем текущий день недели (1 = ПН, ..., 7 = ВС)
function getCurrentDayOfWeek() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

// Переключение дней недели по кнопкам
function setupDaySelector() {
  const buttons = document.querySelectorAll('.day-btn');
  buttons.forEach(btn => {
    const btnDay = Number(btn.dataset.day);
    if (btnDay === currentDay) btn.classList.add('active');

    btn.addEventListener('click', (e) => {
      buttons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentDay = Number(e.target.dataset.day);
      renderWorkoutsForCurrentDay();
    });
  });
}

async function loadWorkouts() {
  const container = document.getElementById('workouts-list');
  if (!container) return;

  const client = window.supabaseClient;
  const userId = localStorage.getItem('selected_user_id');

  if (!client) {
    container.innerHTML = '<div class="empty-state">Ошибка: клиент Supabase не найден.</div>';
    return;
  }

  if (!userId) {
    container.innerHTML = '<div class="empty-state">Пользователь не выбран.</div>';
    return;
  }

  try {
    const { data: workouts, error: workoutsError } = await client
      .from('workouts')
      .select('*')
      .eq('user_id', Number(userId))
      .order('day_of_week', { ascending: true })
      .order('id', { ascending: true });

    if (workoutsError) {
      throw workoutsError;
    }

    const workoutIds = (workouts || []).map(item => item.id).filter(Boolean);
    const exerciseMap = {};

    if (workoutIds.length > 0) {
      const { data: exercises, error: exercisesError } = await client
        .from('exercises')
        .select('*')
        .in('workout_id', workoutIds)
        .order('id', { ascending: true });

      if (exercisesError) {
        console.warn('Не удалось загрузить упражнения:', exercisesError);
      } else {
        (exercises || []).forEach(exercise => {
          const workoutId = exercise.workout_id;
          if (!exerciseMap[workoutId]) exerciseMap[workoutId] = [];
          exerciseMap[workoutId].push(exercise);
        });
      }
    }

    allWorkouts = (workouts || []).map(workout => ({
      ...workout,
      exercises: exerciseMap[workout.id] || []
    }));

    renderWorkoutsForCurrentDay();
  } catch (err) {
    console.error('Ошибка при загрузке тренировок:', err);
    container.innerHTML = `<div class="empty-state">Ошибка загрузки данных: ${err.message || 'неизвестная ошибка'}</div>`;
  }
}

function renderWorkoutsForCurrentDay() {
  const container = document.getElementById('workouts-list');
  if (!container) return;

  const dayWorkouts = allWorkouts.filter(w => Number(w.day_of_week || 1) === currentDay);

  if (dayWorkouts.length === 0) {
    container.innerHTML = '<div class="empty-state">День отдыха</div>';
    return;
  }

  container.innerHTML = '';

  dayWorkouts.forEach(workout => {
    const card = document.createElement('details');
    card.className = 'exercise-item';

    const exercises = workout.exercises || [];

    const exerciseCards = exercises.length
      ? exercises.map(ex => {
          const imageHtml = ex.image_url
            ? `<div class="exercise-media"><img src="${ex.image_url}" alt="${ex.title || 'Упражнение'}" class="exercise-thumb" /></div>`
            : '';

          const descriptionHtml = ex.description
            ? `<p class="exercise-details">${ex.description}</p>`
            : '';

          const categoryHtml = ex.category
            ? `<div style="font-size: 12px; color: #0a84ff; font-weight: 600; margin-top: 8px;">${ex.category}</div>`
            : '';

          const exerciseTitle = normalizeDisplayText(ex.title || ex.name || 'Упражнение', 'Упражнение');

          return `
            <div class="exercise-block" style="padding: 12px 0; border-top: 1px solid #3a3a3c;">
              <div class="exercise-title" style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px;">${exerciseTitle}</div>
              ${imageHtml}
              ${categoryHtml}
              ${descriptionHtml}
            </div>
          `;
        }).join('')
      : '<p class="exercise-details" style="opacity: 0.6;">Упражнения не добавлены</p>';

    let infoHtml = '';
    if (workout.type) {
      infoHtml += `<div style="font-size: 13px; color: #0a84ff; font-weight: 600; margin-bottom: 8px;">${workout.type}</div>`;
    }

    if (workout.description) {
      infoHtml += `<p class="exercise-details">${workout.description}</p>`;
    }

    const workoutTitle = normalizeDisplayText(workout.title || 'Тренировка', 'Тренировка');
    const workoutImage = workout.image_url
      ? `<div class="exercise-media"><img src="${workout.image_url}" alt="${workoutTitle}" class="exercise-thumb" /></div>`
      : '';

    card.innerHTML = `
      <summary class="exercise-summary">
        <span class="exercise-name">${workoutTitle}</span>
        <span class="chevron-icon">›</span>
      </summary>
      <div class="exercise-content">
        ${workoutImage}
        <div class="exercise-info" style="padding: 12px 14px 14px;">
          ${infoHtml}
          ${exerciseCards}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}