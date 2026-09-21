document.addEventListener('DOMContentLoaded', () => {
  initUserSelector();
});

async function initUserSelector() {
  const select = document.getElementById('user-select');
  if (!select) return;

  // 1. Запрашиваем данные из таблицы 'user'
  const { data: users, error } = await supabaseClient
    .from('user')
    .select('id, name');

  // Если произошла ошибка при запросе
  if (error) {
    console.error('Ошибка получения пользователей:', error);
    select.innerHTML = '<option value="">Ошибка загрузки</option>';
    return;
  }

  // Если таблица пустая
  if (!users || users.length === 0) {
    select.innerHTML = '<option value="">Нет пользователей</option>';
    return;
  }

  // 2. Очищаем <select> и заполняем его пользователями из базы
  select.innerHTML = '';
  users.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });

  // 3. Проверяем, был ли пользователь выбран ранее (в памяти браузера)
  const savedUserId = localStorage.getItem('selected_user_id');
  if (savedUserId && users.some(u => u.id == savedUserId)) {
    select.value = savedUserId;
  } else {
    // По умолчанию выбираем первого пользователя из списка
    localStorage.setItem('selected_user_id', users[0].id);
    select.value = users[0].id;
  }

  // 4. Сохраняем новый выбор при переключении пользователем
  select.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    localStorage.setItem('selected_user_id', selectedId);
    console.log('Выбран пользователь ID:', selectedId);
  });
}