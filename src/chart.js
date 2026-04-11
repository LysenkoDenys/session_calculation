import { getDayformatDate, categories } from "./script.js";

const colors = {
  work: "#4f46e5",
  study: "#4aed26",
  exercise: "#f97316",
  other: "#f0e112",
};

export function getLast7Days() {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const formatted = getDayformatDate(d.getTime());
    days.push(formatted);
  }

  return days;
}

export function getDailyTotals(sessions) {
  const map = {};
  sessions.forEach((s) => {
    const day = getDayformatDate(s.end);
    map[day] = (map[day] || 0) + s.duration;
  });
  return map;
}

export function getChartData() {
  const totals = getDailyTotals();
  const days = getLast7Days();

  const labels = days.map((d) => d.slice(5)); // MM-DD
  const values = days.map((d) => Math.floor((totals[d] || 0) / 1000 / 60));

  return { labels, values };
}

function createGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);

  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + "CC");

  return gradient;
}

let chart;

export function renderChart(sessions) {
  const { labels, datasets } = getStackedChartData(sessions);

  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  if (chart) chart.destroy();

  // 🔥 додаємо gradient до кожного dataset
  datasets.forEach((ds) => {
    ds.backgroundColor = createGradient(ctx, ds.backgroundColor);
  });

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: 10,
      },

      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },

      plugins: {
        legend: {
          labels: {
            color: "#ccc",
            font: {
              size: 10,
              weight: "600",
            },
            padding: 10,
            usePointStyle: true,
            pointStyle: "rect",
          },
        },

        tooltip: {
          backgroundColor: "rgba(20,20,20,0.9)",
          titleColor: "#fff",
          bodyColor: "#aaa",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          displayColors: false,

          callbacks: {
            title: (items) => `Day: ${items[0].label}`,
            label: (context) => {
              return `${context.dataset.label}: ${context.raw} min`;
            },
          },
        },
      },

      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: "#aaa",
            font: {
              size: 8,
              weight: "600",
            },
            padding: 5,
          },
        },

        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: "rgba(255,255,255,0.03)",
          },
          ticks: {
            color: "#888",
            callback: (v) => v + "m",
          },
        },
      },
    },
  });
}

// =====================================new chart with categories:
function getDailyByCategory(sessions) {
  const map = {};

  sessions.forEach((s) => {
    const day = getDayformatDate(s.end);
    let category = s.category;

    if (!map[day]) {
      map[day] = {};
    }

    if (!map[day][category]) {
      map[day][category] = 0;
    }

    map[day][category] += s.duration;
  });

  return map;
}

function getStackedChartData(sessions) {
  const data = getDailyByCategory(sessions);
  const days = getLast7Days();

  const datasets = categories.map((cat) => {
    return {
      label: cat,
      backgroundColor: colors[cat],
      barThickness: 25,
      data: days.map((day) => Math.floor((data[day]?.[cat] || 0) / 1000 / 60)),
    };
  });

  const labels = days.map((d) => d.slice(5)); // MM-DD

  return { labels, datasets };
}
