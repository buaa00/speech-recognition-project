const btnRefreshFiles = document.getElementById('btnRefreshFiles');
const selFileNames = document.getElementById('selFileNames');
const txtWindowSize = document.getElementById('txtWindowSize');
const txtWindowIndex = document.getElementById('txtWindowIndex');
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

function createHistogram(labels, data) {
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
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
                    }
                }
            },
            interaction: {
                intersect: false
            },
            animation: false,
            radius: 0,
            plugins: {
                tooltip: {
                    enabled: false
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        // pinch: {
                        //     enabled: true
                        // },
                        drag: {
                            enabled: true
                        },
                        mode: 'x',
                    }
                }
            }
        },
    });
}


btnCalculate.addEventListener('click', () => {
    axios.get(`/fft?fileName=${$(selFileNames).val()}&windowSize=${$(txtWindowSize).val()}&windowFunction=${$(selWindowFunction).val()}&windowIndex=${$(txtWindowIndex).val()}`)
        .then((res) => {
            createHistogram(res.data[0], res.data[1]);
        });
});
