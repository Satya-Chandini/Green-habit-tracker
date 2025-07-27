let streak = parseInt(localStorage.getItem('streak')) || 0;
let lastDate = localStorage.getItem('lastDate') || null;
let chart = null;
let weeklyChart = null;
let monthlyChart = null;
let yearlyChart = null;
let history = JSON.parse(localStorage.getItem('history')) || {};

function calculateImpact() {
  const checkboxes = document.querySelectorAll('#habit-list input[type="checkbox"]');
  let count = 0;
  let co2Saved = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) {
      count++;
      co2Saved += parseInt(cb.value);
    }
  });

  document.getElementById('count').textContent = count;
  document.getElementById('co2').textContent = co2Saved;
  document.getElementById('progress').style.width = (count / checkboxes.length) * 100 + '%';

  const today = new Date().toDateString();
  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate === yesterday.toDateString()) {
      streak += 1;
    } else {
      streak = 1;
    }
    localStorage.setItem('lastDate', today);
    localStorage.setItem('streak', streak);
  }

  document.getElementById('streak').textContent = streak;
  document.getElementById('month').textContent = new Date().toLocaleString('default', { month: 'long' });
  document.getElementById('year').textContent = new Date().getFullYear();

  const incomplete = checkboxes.length - count;
  const ctx = document.getElementById('habitChart').getContext('2d');

  if (chart) {
    chart.data.datasets[0].data = [count, incomplete];
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [count, incomplete],
          backgroundColor: ['#4CAF50', '#FFC107'],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Habit Completion Overview' }
        }
      }
    });
  }

  // Save today's data
  const dateKey = new Date().toISOString().split('T')[0];
  history[dateKey] = count;
  localStorage.setItem('history', JSON.stringify(history));

  updateWeeklyChart();
  updateBadge(streak);
}

// Reset checkboxes
function resetDay() {
  document.querySelectorAll('#habit-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('count').textContent = 0;
  document.getElementById('co2').textContent = 0;
  document.getElementById('progress').style.width = '0%';
  if (chart) {
    chart.data.datasets[0].data = [0, 8];
    chart.update();
  }
}

// Weekly chart
function updateWeeklyChart() {
  const labels = [];
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    data.push(history[key] || 0);
  }

  const ctx = document.getElementById('weeklyChart').getContext('2d');

  if (weeklyChart) {
    weeklyChart.data.labels = labels;
    weeklyChart.data.datasets[0].data = data;
    weeklyChart.update();
  } else {
    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Habits Completed',
          data: data,
          backgroundColor: '#81C784'
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, max: 8 } },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Your Last 7 Days' }
        }
      }
    });
  }
}

// Monthly Chart
function updateMonthlyChart() {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const labels = [];
  const data = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(today.getFullYear(), today.getMonth(), d).toISOString().split('T')[0];
    labels.push(d.toString());
    data.push(history[dateStr] || 0);
  }

  const ctx = document.getElementById('monthlyChart').getContext('2d');

  if (monthlyChart) {
    monthlyChart.data.labels = labels;
    monthlyChart.data.datasets[0].data = data;
    monthlyChart.update();
  } else {
    monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Habits',
          data: data,
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: '#4CAF50',
          fill: true
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, max: 8 } },
        plugins: { title: { display: true, text: 'Monthly Habit Activity' } }
      }
    });
  }
}

// Yearly Chart
function updateYearlyChart() {
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = new Array(12).fill(0);

  for (let key in history) {
    const date = new Date(key);
    data[date.getMonth()] += history[key];
  }

  const ctx = document.getElementById('yearlyChart').getContext('2d');

  if (yearlyChart) {
    yearlyChart.data.datasets[0].data = data;
    yearlyChart.update();
  } else {
    yearlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Habits per Month',
          data: data,
          backgroundColor: '#FFB74D'
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { title: { display: true, text: 'Yearly Habit Summary' } }
      }
    });
  }
}

// Switch Chart Type
function showChart(type) {
  document.getElementById('weeklyChart').style.display = (type === 'weekly') ? 'block' : 'none';
  document.getElementById('monthlyChart').style.display = (type === 'monthly') ? 'block' : 'none';
  document.getElementById('yearlyChart').style.display = (type === 'yearly') ? 'block' : 'none';

  if (type === 'monthly') updateMonthlyChart();
  if (type === 'yearly') updateYearlyChart();
}

// Clear all history
function clearHistory() {
  history = {};
  localStorage.setItem('history', JSON.stringify(history));
  updateWeeklyChart();
  updateMonthlyChart();
  updateYearlyChart();
}

// 🌙 Dark Mode Toggle
const toggleBtn = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  toggleBtn.textContent = '🌞 Light Mode';
}

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  toggleBtn.textContent = isDark ? '🌞 Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// 🏅 Badge System
function updateBadge(streak) {
  const badgeText = document.getElementById('badgeText');
  const badgeIcon = document.getElementById('badgeIcon');

  if (streak >= 30) {
    badgeText.textContent = "🌍 Planet Saver";
    badgeIcon.src = "https://cdn-icons-png.flaticon.com/512/2849/2849381.png";
  } else if (streak >= 7) {
    badgeText.textContent = "🦸‍♀️ Eco Hero";
    badgeIcon.src = "https://cdn-icons-png.flaticon.com/512/4775/4775287.png";
  } else if (streak >= 3) {
    badgeText.textContent = "🌱 Green Sprout";
    badgeIcon.src = "https://cdn-icons-png.flaticon.com/512/2909/2909767.png";
  } else {
    badgeText.textContent = "No badge yet";
    badgeIcon.src = "https://cdn-icons-png.flaticon.com/512/3105/3105791.png";
  }
}

// Load on start
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('streak').textContent = streak;
  document.getElementById('month').textContent = new Date().toLocaleString('default', { month: 'long' });
  document.getElementById('year').textContent = new Date().getFullYear();
  updateWeeklyChart();
  updateBadge(streak);
});



