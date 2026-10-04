let allRoutines = [];
let selectedDate = new Date(); // Выбранная дата
let viewMonthDate = new Date(); // Месяц для отображения в модалке

document.addEventListener('DOMContentLoaded', () => {
  setupDayButtons();
  setupCalendarModal();
  updateDateDisplay();
  loadRoutine();
});

// Форматирование даты в YYYY-MM-DD
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// День недели от 1 (ПН) до 7 (ВС)
function getDayOfWeek(date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

// Обновление подписи выбранной даты и активных кнопок ПН-ВС
function updateDateDisplay() {
  const display = document.getElementById('current-date-display');
  if (display) {
    const options = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' };
    display.textContent = selectedDate.toLocaleDateString('ru-RU', options);
  }

  const currentDayNum = getDayOfWeek(selectedDate);
  const buttons = document.querySelectorAll('.day-btn');
  buttons.forEach(btn => {
    if (Number(btn.dataset.day) === currentDayNum) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Настройка кнопок ПН-ВС
function setupDayButtons() {
  const buttons = document.querySelectorAll('.day-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetDay = Number(e.target.dataset.day);
      const currentDay = getDayOfWeek(selectedDate);
      const diff = targetDay - currentDay;

      // Сдвигаем текущую выбранную дату на нужный день
      selectedDate.setDate(selectedDate.getDate() + diff);
      updateDateDisplay();
      renderRoutineForSelectedDay();
    });
  });
}

// Загрузка распорядка из Supabase
async function loadRoutine() {
  const container = document.getElementById('routine-list');
  if (!container) return;

  const client = window.supabaseClient;
  const userId = localStorage.getItem('selected_user_id');

  if (!client || !userId) {
    container.innerHTML = '<div class="empty-state">Пользователь не выбран.</div>';
    return;
  }

  try {
    const { data: routines, error } = await client
      .from('daily_routine')
      .select('*')
      .eq('user_id', Number(userId))
      .order('time', { ascending: true });

    if (error) {
      container.innerHTML = `<div class="empty-state">Ошибка: ${error.message}</div>`;
      return;
    }

    allRoutines = routines || [];
    renderRoutineForSelectedDay();

  } catch (err) {
    console.error('Ошибка при загрузке:', err);
    container.innerHTML = `<div class="empty-state">Сбой загрузки данных.</div>`;
  }
}

// Рендер задач дня
function renderRoutineForSelectedDay() {
  const container = document.getElementById('routine-list');
  if (!container) return;

  const currentDayOfWeek = getDayOfWeek(selectedDate);
  const dayRoutines = allRoutines.filter(r => Number(r.day_of_week || 1) === currentDayOfWeek);

  if (dayRoutines.length === 0) {
    container.innerHTML = '<div class="empty-state">На этот день распорядок не задан.</div>';
    return;
  }

  container.innerHTML = '';

  const dateKey = formatDateKey(selectedDate);
  const completedState = JSON.parse(localStorage.getItem(`routine_completed_${dateKey}`) || '{}');

  dayRoutines.forEach(item => {
    const card = document.createElement('div');
    const isCompleted = !!completedState[item.id];
    
    card.className = `routine-card ${isCompleted ? 'completed' : ''}`;

    card.innerHTML = `
      <div class="routine-time">${item.time || '--:--'}</div>
      <div class="routine-info">
        <div class="routine-title">${item.title || 'Задача'}</div>
        ${item.description ? `<div class="routine-desc">${item.description}</div>` : ''}
      </div>
      <button class="checkbox-btn ${isCompleted ? 'checked' : ''}">
        ${isCompleted ? '✓' : ''}
      </button>
    `;

    const checkBtn = card.querySelector('.checkbox-btn');
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      completedState[item.id] = !completedState[item.id];
      localStorage.setItem(`routine_completed_${dateKey}`, JSON.stringify(completedState));
      renderRoutineForSelectedDay();
    });

    container.appendChild(card);
  });
}

// Логика работы модального окна календаря
function setupCalendarModal() {
  const toggleBtn = document.getElementById('calendar-toggle-btn');
  const modal = document.getElementById('calendar-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const prevBtn = document.getElementById('prev-month-btn');
  const nextBtn = document.getElementById('next-month-btn');

  toggleBtn.addEventListener('click', () => {
    viewMonthDate = new Date(selectedDate);
    renderMonthCalendar();
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  prevBtn.addEventListener('click', () => {
    viewMonthDate.setMonth(viewMonthDate.getMonth() - 1);
    renderMonthCalendar();
  });

  nextBtn.addEventListener('click', () => {
    viewMonthDate.setMonth(viewMonthDate.getMonth() + 1);
    renderMonthCalendar();
  });
}

// Генерация сетки месяца
function renderMonthCalendar() {
  const monthLabel = document.getElementById('month-year-label');
  const grid = document.getElementById('month-days-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const year = viewMonthDate.getFullYear();
  const month = viewMonthDate.getMonth();

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startOffset = getDayOfWeek(firstDay) - 1; // Пустые ячейки в начале месяца

  for (let i = 0; i < startOffset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'month-day empty';
    grid.appendChild(emptyCell);
  }

  const todayStr = formatDateKey(new Date());
  const selectedStr = formatDateKey(selectedDate);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cellDate = new Date(year, month, day);
    const cellStr = formatDateKey(cellDate);

    const cell = document.createElement('button');
    cell.className = `month-day ${cellStr === selectedStr ? 'selected' : ''} ${cellStr === todayStr ? 'today' : ''}`;
    cell.textContent = day;

    cell.addEventListener('click', () => {
      selectedDate = cellDate;
      updateDateDisplay();
      renderRoutineForSelectedDay();
      document.getElementById('calendar-modal').classList.add('hidden');
    });

    grid.appendChild(cell);
  }
}