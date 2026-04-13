function getToken(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function createChart(canvasId, config) {
  const ChartCtor = globalThis.Chart;
  const canvas = document.getElementById(canvasId);

  if (!ChartCtor || !canvas) {
    return null;
  }

  return new ChartCtor(canvas, config);
}

function baseChartOptions() {
  const textColor = getToken('--carni-text', '#F5F5F5');
  const mutedColor = getToken('--carni-text-muted', '#A3A3A3');
  const gridColor = 'rgba(255, 255, 255, 0.08)';

  return {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          boxWidth: 12,
          usePointStyle: true
        }
      }
    },
    scales: {
      x: {
        ticks: { color: mutedColor },
        grid: { color: gridColor }
      },
      y: {
        beginAtZero: true,
        ticks: { color: mutedColor },
        grid: { color: gridColor }
      }
    }
  };
}

export function initializeDashboardCharts() {
  const red = getToken('--carni-red', '#DC2626');
  const gold = getToken('--carni-gold', '#E4D1B0');
  const green = getToken('--carni-green', '#059669');
  const amber = getToken('--carni-amber', '#F59E0B');

  createChart('salesChart', {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
      datasets: [{
        label: 'Ventas',
        data: [15000, 18000, 21000, 19000, 24000, 28000, 25000, 26000, 23000, 29000],
        tension: 0.35,
        borderColor: red,
        backgroundColor: 'rgba(220, 38, 38, 0.18)',
        pointRadius: 3,
        pointBackgroundColor: gold,
        pointBorderColor: red,
        fill: true
      }]
    },
    options: {
      ...baseChartOptions(),
      plugins: {
        legend: { display: false }
      }
    }
  });

  createChart('productsChart', {
    type: 'doughnut',
    data: {
      labels: ['Rib Eye', 'Filet Mignon', 'Tomahawk', 'Otros'],
      datasets: [{
        data: [45, 30, 15, 10],
        backgroundColor: [red, green, gold, amber],
        borderColor: getToken('--carni-charcoal', '#111111'),
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getToken('--carni-text', '#F5F5F5'),
            boxWidth: 12,
            usePointStyle: true
          }
        }
      },
      cutout: '68%'
    }
  });
}

export function initializeProductsAdminCharts() {
  const red = getToken('--carni-red', '#DC2626');
  const gold = getToken('--carni-gold', '#E4D1B0');
  const green = getToken('--carni-green', '#059669');
  const amber = getToken('--carni-amber', '#F59E0B');

  createChart('stockByCategoryChart', {
    type: 'bar',
    data: {
      labels: ['Res', 'Cerdo', 'Pollo', 'Premium'],
      datasets: [{
        label: 'Stock (kg)',
        data: [42, 28, 18, 11],
        backgroundColor: [red, amber, green, gold],
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      ...baseChartOptions(),
      plugins: {
        legend: { display: false }
      }
    }
  });

  createChart('inventoryStatusChart', {
    type: 'doughnut',
    data: {
      labels: ['Disponible', 'Bajo stock', 'Reservado'],
      datasets: [{
        data: [68, 20, 12],
        backgroundColor: [green, amber, red],
        borderColor: getToken('--carni-charcoal', '#111111'),
        borderWidth: 2
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getToken('--carni-text', '#F5F5F5'),
            boxWidth: 12,
            usePointStyle: true
          }
        }
      },
      cutout: '62%'
    }
  });
}

export function initializeCustomersAdminCharts() {
  const red = getToken('--carni-red', '#DC2626');
  const gold = getToken('--carni-gold', '#E4D1B0');
  const green = getToken('--carni-green', '#059669');

  createChart('customerGrowthChart', {
    type: 'line',
    data: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
      datasets: [{
        label: 'Clientes nuevos',
        data: [4, 6, 5, 8, 7, 9],
        borderColor: red,
        backgroundColor: 'rgba(220, 38, 38, 0.16)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: gold,
        pointBorderColor: red,
        pointRadius: 3
      }]
    },
    options: {
      ...baseChartOptions(),
      plugins: {
        legend: { display: false }
      }
    }
  });

  createChart('customerChannelChart', {
    type: 'polarArea',
    data: {
      labels: ['Web', 'WhatsApp', 'Mostrador', 'Referidos'],
      datasets: [{
        data: [54, 26, 12, 8],
        backgroundColor: [red, gold, green, 'rgba(245, 158, 11, 0.85)'],
        borderColor: getToken('--carni-charcoal', '#111111'),
        borderWidth: 2
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        r: {
          ticks: { color: getToken('--carni-text-muted', '#A3A3A3') },
          grid: { color: 'rgba(255, 255, 255, 0.08)' }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getToken('--carni-text', '#F5F5F5'),
            boxWidth: 12,
            usePointStyle: true
          }
        }
      }
    }
  });
}
