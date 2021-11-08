const btnRefreshFiles = document.getElementById('btnRefreshFiles');
const selFileNames = document.getElementById('selFileNames');
const txtWindowSize = document.getElementById('txtWindowSize');
const selWindowFunction = document.getElementById('selWindowFunction');
const btnCalculate = document.getElementById('btnCalculate');

btnRefreshFiles.addEventListener('click', () => {
    axios.get('/data')
        .then((res) => {
            selFileNames.innerHTML = res.data.map(o => `<option value="${o}">${o}</option>`).join('');
        });
});


const ctx = document.getElementById('myChart').getContext('2d');

let chart;

function createSonogram(labels, data, backgroundColors) {
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    labels: labels,
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    type: 'linear',
                    ticks: {
                        stepSize: 15
                    }
                }
            },
            interaction: {
                intersect: false
            },
            animation: false,
            radius: 2,
            plugins: {
                tooltip: {
                    enabled: false
                }
            }
        },
    });
}


btnCalculate.addEventListener('click', () => {
    axios.get(`/sonogram?fileName=${$(selFileNames).val()}&windowSize=${$(txtWindowSize).val()}&windowFunction=${$(selWindowFunction).val()}`)
        .then((res) => {
            const labels = res.data.map((s, i) => `${i * 15}ms`);
            const data = [];
            const backgroundColors = [];
            for (let i = 0; i < res.data.length; i++) {
                for (let j = 0; j < res.data[i][1].length; j++) {
                    data.push({
                        x: i * 15,
                        y: res.data[i][0][j]
                    });
                    backgroundColors.push(`rgba(255, 255, 255, ${(res.data[i][1][j] / 25000).toFixed(2)})`);
                }
            }

            createSonogram(labels, data, backgroundColors);
        });
});
