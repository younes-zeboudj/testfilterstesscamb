const createWorker = require('tesseract.js').createWorker;
const { Caman } = require('./caman.js');

const order = ['saturation', 'contrast', 'exposure', 'hue', 'gamma', 'sharpen']

const filterRanges = {
    // 'brightness': {
    //     'min': -10,
    //     'max': 10,
    //     'step': 10,
    //     'default': 0
    // },
    'saturation': {
        'min': -15,
        'max': 30,
        'step': 15,
        'default': 0
    },
    'contrast': {
        'min': -60,
        'max': 60,
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
        'min': 0,
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

    'greyScale': {},
    'boxBlur': {},
    'threshold': {
        'min': 30,
        'max': 200,
        'step': 10,
        'default': 0
    },
}


const combinations = [];

const { filterIndex, maincurrentCombination, allowedForks } = JSON.parse(process.argv[2]);



function generateFilterPermutations(filterIndex, currentCombination) {
    if (filterIndex === order.length) {
        const thresholdValues = []

        for (let i = filterRanges['threshold'].min; i <= filterRanges['threshold'].max; i += filterRanges['threshold'].step) {
            thresholdValues.push(`th${i}`);
        }

        for (const value of thresholdValues) {
            const updatedCombination = currentCombination + ` gr bo ${value}`;
            // combinations.push(updatedCombination);

            testFilter(updatedCombination)
        }

        return;
    }

    for (let i = filterIndex; i < order.length; i++) {
        const filterName = order[i];
        const filter = filterRanges[filterName];
        const filterValues = filter.values || [];

        if (filter) {
            if (filter.min !== undefined && filter.max !== undefined && filter.step !== undefined) {
                for (let value = filter.min; value <= filter.max; value += filter.step) {
                    filterValues.push(`${filterName.substring(0, 2)}${value}`);
                }

                if (filter.toggle) {
                    filterValues.push(``);
                }
            } else {

                if (filter.toggle) {
                    filterValues.push(``);
                } else {
                    filterValues.push(`${filterName.substring(0, 2)}`)
                }
            }
        }

        for (const value of filterValues) {
            const updatedCombination = currentCombination + (currentCombination && value ? ' ' : '') + value;

            generateFilterPermutations(i + 1, updatedCombination);
        }
    }
}


const { fork } = require('child_process');


const fs = require('fs');
function generateMyFilterPermutations() {
    const filter = filterRanges[order[filterIndex]];
    const filterValues = filter.values || [];

    if (filter.min !== undefined && filter.max !== undefined && filter.step !== undefined) {
        for (let value = filter.min; value <= filter.max; value += filter.step) {
            filterValues.push(`${order[filterIndex]}(${value})`);
        }
    } else {
        if (filter.toggle) {
            filterValues.push(`${order[filterIndex].substring(0, 2)}`);
            filterValues.push(``);
        } else {
            filterValues.push(`${order[filterIndex].substring(0, 2)}`)
        }
    }

    for (const value of filterValues) {

        if (allowedForks === 0) {
            const currentCombination = (maincurrentCombination ? maincurrentCombination + ' ' : '') + value;
            generateFilterPermutations(filterIndex, currentCombination);
            process.send([]);
            // fs.writeFileSync(`combinations${Math.random().toString().replace(/\./, '')}.json`, '');
            // for (const combination of combinations) {
            //     fs.appendFileSync(`combinations${Math.random().toString().replace(/\./, '')}.json`, combination + '\n');
            // }

            // testFilter(currentCombination)

        } else {
            let forked = 0
            let myvalues = []

            for (let i = filterRanges[order[filterIndex]].min; i <= filterRanges[order[filterIndex]].max; i += filterRanges[order[filterIndex]].step) {

                myvalues.push(`${order[filterIndex].substring(0, 2)}${i}`);
            }

            for (let i = 0; i < myvalues.length; i++) {
                const child = fork('./child.js', [
                    JSON.stringify({
                        filterIndex: filterIndex + 1,
                        maincurrentCombination: (maincurrentCombination ? maincurrentCombination + ' ' : '') + myvalues[i],
                        allowedForks: allowedForks - 1
                    })
                ]);

                child.on('message', (message) => {
                    // combinations.push(...message)
                    forked++

                    if (forked === myvalues.length) {
                        process.send([]);
                    }
                });
            }
        }

    }
}

const models = ['digits_comma', 'engBest', 'Fraktur_50000000.334_450937']


generateMyFilterPermutations();




async function testFilter(filter) {
    const completeNamesFilter = filter.split(' ').map(filter => Object.keys(filterRanges).find(key => key.substring(0, 2) === filter.substring(0, 2)) + '/' + filter.substring(2)).join(' ')

    let parallel = 3
    for (const model of models) {
        console.log(`Testing ${completeNamesFilter} ${model}`);
        const ps = fs.readdirSync('./').filter(file => file.includes('jpeg')).map(file => new Promise(async (resolve, reject) => {
            let lockIndex = 0
            while (1==1) {
                for (let i = 0; i < 10; i++) {
                    if (!fs.existsSync(`lock${i}.lock`)) {
                        fs.writeFileSync(`lock${i}.lock`, '')
                        lockIndex = i
                        break;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            const filters = completeNamesFilter.split(' ').map(ff => {
                return [ff.split('/')[0], parseInt(ff.split('/')[1])]
            })

            const tmname = `./` + file.split('.')[0] + `${Math.random().toString().replace(/\./, '')}.jpeg`

            Caman(`./${file}`, function () {
                for (const f of filters) {
                    this[f[0]](f[1])
                }

                this.render(function () {
                    this.save(tmname)
                })
            })

            const bfr = fs.readFileSync(tmname)
            const text = await recognize(bfr, model).finally(() => {


                try {
                    fs.unlinkSync(tmname)

                } catch (error) {

                }

                try {
                    fs.unlinkSync(`lock${lockIndex}.lock`)
                    
                } catch (error) {
                    
                }
            })
            resolve(text?.trim() == file.substring(0, 3))
        }))


        const results = await Promise.all(ps)
            console.log(`test done`);
        const accuracy = results.filter(result => result).length / results.length
        console.log(`Accuracy: ${accuracy}`);
        if (accuracy >= 0.5) {
            console.log(completeNamesFilter, model, accuracy)
            if (!fs.existsSync('results.txt'))
                fs.appendFileSync('results.txt', `${completeNamesFilter} ${model} ${accuracy}\n`)
        }
    }


}





const recognize = async (bfr, model) => {
    const worker = await tess.createWorker({ langPath: __dirname, gzip: false, })
    await worker.loadLanguage(model)
    await worker.initialize(model)
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789', // Only recognize numbers
    })


    const { data: { text } } = await worker.recognize(bfr)

    await worker.terminate()
    return text
}





