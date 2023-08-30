const order = ['brightness', 'saturation', 'contrast', 'exposure', 'hue', 'gamma', 'sharpen']
const filterRanges = {
    'brightness': {
        'min': -15,
        'max': 30,
        'step': 30,
        'default': 0
    },
    'saturation': {
        'min': -15,
        'max': 30,
        'step': 15,
        'default': 0
    },
    'contrast': {
        'min': -60,
        'max': 60,
        'step': 20,
        'default': 0
    },
    'exposure': {
        'min': -25,
        'max': 25,
        'step': 50,
        'toggle': true,
    },
    'hue': {
        'min': 10,
        'max': 100,
        'step': 10,
        'default': 0
    },
    'gamma': {
        'min': 1,
        'max': 2,
        'step': 0.3,
        'toggle': true,
    },
    'sharpen': {
        'toggle': true
    },

    'greyscale': {},
    'boxBlur': {},
    'threshold': {
        'min': 40,
        'max': 200,
        'step': 20,
        'default': 0
    },
}



const { fork, execSync } = require('child_process');
const fs = require('fs');
const filters = Object.keys(filterRanges).filter(filter => filter !== 'boxBlur' && filter !== 'greyscale' && filter !== 'threshold' && filter !== 'sharpen' && filter !== 'gamma' && filter !== 'hue');
const combinations = [];

function startAllChildProcesses() {
    const child = fork('./child.js', [
        JSON.stringify({
            filterIndex: 0,
            allowedForks: 2
        })
    ], { execArgv: ['--max-old-space-size=13000'] });

    child.on('message', (workerCombinations) => {
        // console.log(`Worker finished : ${workerCombinations}`);
        // combinations.push(workerCombinations);
        // console.log(`Total number of combinations: ${combinations.length}`);
        // fs.writeFileSync('./combinations.json', JSON.stringify(combinations));
    });
}

if(!fs.existsSync('./conv'))
fs.mkdirSync('./conv');

try {
    execSync('rm lock*')    
} catch (error) {
    
}

startAllChildProcesses();
