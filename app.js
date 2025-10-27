// グローバル変数
let currentDate = new Date();
let selectedDate = new Date();
let tasks = [];
let editingTaskId = null;

// 要素の取得
const calendarDays = document.getElementById('calendarDays');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const taskList = document.getElementById('taskList');
const taskModal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskForm = document.getElementById('taskForm');
const selectedDateText = document.getElementById('selectedDateText');

// モーダル関連
const closeModalBtn = document.querySelector('.close');
const cancelBtn = document.querySelector('.cancel-button');
const modalTitle = document.getElementById('modalTitle');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderCalendar();
    updateSelectedDateInfo();

    // イベントリスナー
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    addTaskBtn.addEventListener('click', () => {
        openTaskModal();
    });

    closeModalBtn.addEventListener('click', closeTaskModal);
    cancelBtn.addEventListener('click', closeTaskModal);

    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    taskForm.addEventListener('submit', handleTaskSubmit);
});

// カレンダーのレンダリング
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 月のタイトルを更新
    currentMonthElement.textContent = `${year}年 ${month + 1}月`;

    // カレンダーをクリア
    calendarDays.innerHTML = '';

    // 月の最初の日と最後の日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    // 前月の日付
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayElement = createDayElement(prevLastDate - i, true, new Date(year, month - 1, prevLastDate - i));
        calendarDays.appendChild(dayElement);
    }

    // 今月の日付
    for (let day = 1; day <= lastDateOfMonth; day++) {
        const dayElement = createDayElement(day, false, new Date(year, month, day));
        calendarDays.appendChild(dayElement);
    }

    // 次月の日付
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6週間分
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true, new Date(year, month + 1, day));
        calendarDays.appendChild(dayElement);
    }
}

// 日付要素の作成
function createDayElement(day, isOtherMonth, date) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    dayElement.textContent = day;

    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }

    // 今日の日付をハイライト
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    // 選択された日付をハイライト
    if (date.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add('selected');
    }

    // タスクがある日付にインジケーターを表示
    if (hasTaskOnDate(date)) {
        const indicator = document.createElement('div');
        indicator.classList.add('task-indicator');
        dayElement.appendChild(indicator);
    }

    // クリックイベント
    dayElement.addEventListener('click', () => {
        selectedDate = new Date(date);
        renderCalendar();
        renderTasks();
        updateSelectedDateInfo();
    });

    return dayElement;
}

// 指定日にタスクがあるかチェック
function hasTaskOnDate(date) {
    return tasks.some(task => {
        const taskDate = new Date(task.date);
        return taskDate.toDateString() === date.toDateString();
    });
}

// 選択日付情報の更新
function updateSelectedDateInfo() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    selectedDateText.textContent = `${year}年${month}月${day}日のタスク`;
}

// タスクのレンダリング
function renderTasks() {
    taskList.innerHTML = '';

    const tasksForDate = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.toDateString() === selectedDate.toDateString();
    });

    if (tasksForDate.length === 0) {
        taskList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">この日のタスクはありません</p>';
        return;
    }

    tasksForDate.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

// タスク要素の作成
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task-item', `priority-${task.priority}`);

    if (task.completed) {
        taskElement.classList.add('completed');
    }

    taskElement.innerHTML = `
        <div class="task-header-row">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleTaskComplete('${task.id}')" title="完了切替">
                    ${task.completed ? '↩️' : '✓'}
                </button>
                <button class="edit-btn" onclick="editTask('${task.id}')" title="編集">✎</button>
                <button class="delete-btn" onclick="deleteTask('${task.id}')" title="削除">×</button>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-date">優先度: ${getPriorityText(task.priority)}</div>
    `;

    return taskElement;
}

// 優先度テキストの取得
function getPriorityText(priority) {
    const priorities = {
        'low': '低',
        'medium': '中',
        'high': '高'
    };
    return priorities[priority] || '中';
}

// HTML エスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// モーダルを開く
function openTaskModal(task = null) {
    if (task) {
        // 編集モード
        editingTaskId = task.id;
        modalTitle.textContent = 'タスク編集';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
    } else {
        // 新規追加モード
        editingTaskId = null;
        modalTitle.textContent = 'タスク追加';
        taskForm.reset();
        const dateString = selectedDate.toISOString().split('T')[0];
        document.getElementById('taskDate').value = dateString;
    }

    taskModal.style.display = 'block';
}

// モーダルを閉じる
function closeTaskModal() {
    taskModal.style.display = 'none';
    taskForm.reset();
    editingTaskId = null;
}

// タスクの送信処理
function handleTaskSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value;
    const date = document.getElementById('taskDate').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;

    if (editingTaskId) {
        // タスクを更新
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                date,
                description,
                priority
            };
        }
    } else {
        // 新しいタスクを追加
        const task = {
            id: generateId(),
            title,
            date,
            description,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(task);
    }

    saveTasks();
    renderCalendar();
    renderTasks();
    closeTaskModal();
}

// タスクの完了状態を切り替え
function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// タスクの編集
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        openTaskModal(task);
    }
}

// タスクの削除
function deleteTask(taskId) {
    if (confirm('このタスクを削除しますか?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderCalendar();
        renderTasks();
    }
}

// ローカルストレージにタスクを保存
function saveTasks() {
    localStorage.setItem('calendarTasks', JSON.stringify(tasks));
}

// ローカルストレージからタスクを読み込み
function loadTasks() {
    const savedTasks = localStorage.getItem('calendarTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

// ユニークIDの生成
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
