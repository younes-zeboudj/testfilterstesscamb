const order = ['brightness', 'contrast', 'saturation', 'exposure', 'hue', 'gamma', 'sharpen']
const filterRanges = {
    'brightness': {
        'min': -10,
        'max': 10,
        'step': 10,
        'default': 0
    },
    'contrast': {
        'min': -60,
        'max': 60,
        'step': 15,
        'default': 0
    },
    'saturation': {
        'min': -15,
        'max': 45,
        'step': 15,
        'default': 0
    },
    'exposure': {
        'min': -25,
        'max': 25,
        'step': 25,
        'toggle': true,
    },
    'hue': {
        'min': 5,
        'max': 100,
        'step': 10,
        'default': 0
    },
    'gamma': {
        'min': 1,
        'max': 3,
        'step': 2,
        'toggle': true,
    },
    'sharpen': {
        'toggle': true
    },

    'greyScale': {},
    'boxBlur': {},
    'threshold': {
        'min': 30,
        'max': 200,
        'step': 10,
        'default': 0
    },
}



const { fork } = require('child_process');
const { fs } = require('fs');
const filters = Object.keys(filterRanges).filter(filter => filter !== 'boxBlur' && filter !== 'greyScale' && filter !== 'threshold' && filter !== 'sharpen' && filter !== 'gamma' && filter !== 'hue');
const combinations = [];

function startAllChildProcesses() {
    for (let i = 0; i < filters.length; i++) {
        if (filters[i] !== 'brightness') {
            continue;
        }

        const child = fork('./child.js', [
            JSON.stringify({
                filterIndex: i,
                allowedForks: 1
            })
        ], { execArgv: ['--max-old-space-size=13000'] });

        child.on('message', (workerCombinations) => {
            console.log(`Worker ${i} finished`);
            // combinations.push(workerCombinations);
            // console.log(`Total number of combinations: ${combinations.length}`);
            // fs.writeFileSync('./combinations.json', JSON.stringify(combinations));

        });

    }
}

startAllChildProcesses();
