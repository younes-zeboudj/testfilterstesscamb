let order = ['saturation', 'brightness', 'hue', 'gamma', 'contrast', 'sharpen']

const filterRanges = {
    'brightness': {
        'min': -15,
        'max': 15,
        'step': 30,
        'default': 0
    },
    'saturation': {
        'min': -20,
        'max': 20,
        'step': 40,
        'default': 0
    },
    'contrast': {
        'min': -30,
        'max': 30,
        'step': 30,
        'default': 0
    },
    "sepia": {
        'min': -20,
        'max': 20,
        'step': 40,
        'default': 0
    },
    "vibrance": {
        'min': -20,
        'max': 20,
        'step': 40,
        'default': 0
    },
    'exposure': {
        'min': -15,
        'max': 15,
        'step': 30,
    },
    'hue': {
        'min': 0,
        'max': 100,
        'step': 20,
        'default': 0
    },
    'gamma': {
        'min': 1,
        'max': 2,
        'step': 1,
        'toggle': true,
    },
    'sharpen': {
        // 'toggle': true
    },

    'greyscale': {},
    'boxBlur': {},
    'threshold': {
        'min': 30,
        'max': 210,
        'step': 30,
        'default': 0
    },
}

const { fork, execSync } = require('child_process');
const fs = require('fs');
const filters = Object.keys(filterRanges).filter(filter => filter !== 'boxBlur' && filter !== 'greyscale' && filter !== 'threshold' && filter !== 'sharpen' && filter !== 'gamma' && filter !== 'hue');
const combinations = [];

if(process.argv[2]) order= process.argv[2].split(',');

function startAllChildProcesses() {
    const child = fork('./child.js', [
        JSON.stringify({
            filterIndex: 0,
            allowedForks: 1,
            order,
        })
    ], { execArgv: ['--max-old-space-size=500000'], detached:false })

    // child.on('message', (workerCombinations) => {
    //     // console.log(`Worker finished : ${workerCombinations}`);
    //     // combinations.push(workerCombinations);
    //     // console.log(`Total number of combinations: ${combinations.length}`);
    //     // fs.writeFileSync('./combinations.json', JSON.stringify(combinations));
    // });
}

if(!fs.existsSync('./conv'))
fs.mkdirSync('./conv');

try {
    execSync('rm lock*')    
} catch (error) {
    
}

startAllChildProcesses();
