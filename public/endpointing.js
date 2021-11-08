const btnRefreshFiles = document.getElementById('btnRefreshFiles');
const selFileNames = document.getElementById('selFileNames');
const txtWindowSize = document.getElementById('txtWindowSize');
const txtNoiseLevel = document.getElementById('txtNoiseLevel');
const txtP = document.getElementById('txtP');
const txtQ = document.getElementById('txtQ');
const btnCalculate = document.getElementById('btnCalculate');
const txtNoiseLength = document.getElementById('txtNoiseLength');
const btnCalculateNoise = document.getElementById('btnCalculateNoise');

btnRefreshFiles.addEventListener('click', () => {
    axios.get('/data')
        .then((res) => {
            selFileNames.innerHTML = res.data.map(o => `<option value="${o}">${o}</option>`).join('');
        });
});

btnCalculateNoise.addEventListener('click', () => {
    axios.get(`/noise?fileName=${$(selFileNames).val()}&noiseLength=${$(txtNoiseLength).val()}`)
        .then((res) => {
            $(txtNoiseLevel).val(res.data.noiseLevel);
        });
});

const ctx = document.getElementById('myChart').getContext('2d');

let words = [];
let signal = [];
let chart;

function createSingalChart(labels, data, words) {
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    fill: false,
                    borderWidth: 1,
                    tension: 0
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
        lineAtIndex: words
    });
}


btnCalculate.addEventListener('click', () => {
    axios.get(`/endpointing?fileName=${$(selFileNames).val()}&windowSize=${$(txtWindowSize).val()}&noiseLevel=${$(txtNoiseLevel).val()}&p=${$(txtP).val()}&q=${$(txtQ).val()}`)
        .then((res) => {
            words = [];
            for (const x of res.data) {
                words.push(x.startSample);
                words.push(x.startSample + x.samplesCount);
            }
            axios.get(`/signal?fileName=${$(selFileNames).val()}`).then((res) => {
                signal = res.data;
                const labels = [];
                for (let i = 0; i < signal.length; i++) {
                    labels.push(`${Math.round(i * 0.02267573696)
                        }ms`);
                    // data.push(Math.random() * (max - min) + min)
                }
                createSingalChart(labels, signal, words);
            });
        });
});
