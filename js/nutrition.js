let allMeals = [];
let currentDay = getCurrentDayOfWeek(); // Определяем сегодняшний день при запуске

document.addEventListener('DOMContentLoaded', () => {
  setupDaySelector();
  loadNutrition();
});

// Функция для определения текущего дня недели (1 = ПН, ..., 7 = ВС)
function getCurrentDayOfWeek() {
  const jsDay = new Date().getDay(); // 0 - Воскресенье, 1 - Понедельник, ...
  return jsDay === 0 ? 7 : jsDay;    // Если Воскресенье (0), превращаем в 7
}

function setupDaySelector() {
  const buttons = document.querySelectorAll('.day-btn');
  
  // 1. Подсвечиваем активную кнопку на основе текущего дня
  buttons.forEach(btn => {
    const btnDay = Number(btn.dataset.day);
    if (btnDay === currentDay) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    // 2. Добавляем обработчик кликов для ручной смены дня
    btn.addEventListener('click', (e) => {
      buttons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentDay = Number(e.target.dataset.day);
      renderMealsForCurrentDay();
    });
  });
}

async function loadNutrition() {
  const container = document.getElementById('nutrition-list');
  if (!container) return;

  const client = window.supabaseClient;
  if (!client) {
    container.innerHTML = '<div class="empty-state">Ошибка: клиент Supabase не найден.</div>';
    return;
  }

  const userId = localStorage.getItem('selected_user_id');
  if (!userId) {
    container.innerHTML = '<div class="empty-state">Пользователь не выбран.</div>';
    return;
  }

  try {
    const { data: meals, error } = await client
      .from('nutrition')
      .select('*')
      .eq('user_id', Number(userId))
      .order('id', { ascending: true });

    if (error) {
      container.innerHTML = `<div class="empty-state">Ошибка базы данных: ${error.message}</div>`;
      return;
    }

    allMeals = meals || [];
    renderMealsForCurrentDay();

  } catch (err) {
    console.error('Ошибка:', err);
    container.innerHTML = `<div class="empty-state">Сбой при загрузке.</div>`;
  }
}

function renderMealsForCurrentDay() {
  const container = document.getElementById('nutrition-list');
  if (!container) return;

  // Фильтруем рацион по выбранному дню
  const dayMeals = allMeals.filter(m => (m.day_of_week || 1) === currentDay);

  if (dayMeals.length === 0) {
    container.innerHTML = `<div class="empty-state">На этот день план питания не задан.</div>`;
    return;
  }

  container.innerHTML = '';

  dayMeals.forEach(meal => {
    const card = document.createElement('details');
    card.className = 'exercise-item';

    const details = meal.details || {};

    const bzhuHtml = (details.protein || details.fat || details.carbs) ? `
      <div style="display: flex; gap: 8px; font-size: 12px; opacity: 0.8; margin-top: 4px;">
        ${details.protein ? `<span>Б: ${details.protein}г</span>` : ''}
        ${details.fat ? `<span>Ж: ${details.fat}г</span>` : ''}
        ${details.carbs ? `<span>У: ${details.carbs}г</span>` : ''}
      </div>
    ` : '';

    const ingredientsHtml = Array.isArray(details.ingredients) && details.ingredients.length > 0 ? `
      <p class="exercise-details" style="margin-top: 6px;">
        <strong>Ингредиенты:</strong> ${details.ingredients.join(', ')}
      </p>
    ` : '';

    card.innerHTML = `
      <summary class="exercise-summary">
        <span class="exercise-name">${meal.title || 'Приём пищи'}</span>
        <span class="chevron-icon">›</span>
      </summary>
      <div class="exercise-content">
        ${meal.image_url ? `
          <div class="exercise-media">
            <img src="${meal.image_url}" alt="${meal.title || ''}" class="exercise-thumb" />
          </div>
        ` : ''}
        <div class="exercise-info">
          ${meal.calories ? `<div class="workout-day" style="align-self: flex-start;">${meal.calories} ккал</div>` : ''}
          ${bzhuHtml}
          ${meal.description ? `<p class="exercise-details" style="margin-top: 8px;">${meal.description}</p>` : ''}
          ${ingredientsHtml}
          ${details.notes ? `<p class="exercise-details" style="font-style: italic; opacity: 0.7;">Заметка: ${details.notes}</p>` : ''}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}