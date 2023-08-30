const createWorker = require('tesseract.js').createWorker;
const { Caman } = require('./caman.js');

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
    // 'exposure': {
    //     'min': -15,
    //     'max': 15,
    //     'step': 30,
    // },
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


const combinations = [];

const { filterIndex, maincurrentCombination, allowedForks, order } = JSON.parse(process.argv[2]);

let accuracyAll = []
let N = 0
async function generateFilterPermutations(filterIndexlocal, currentCombination) {
    console.log(`generating permutation N ${N++} ${filterIndexlocal} ${currentCombination}`);
    if (filterIndexlocal >= order.length) {
        const thresholdValues = []

        for (let i = filterRanges['threshold'].max; i >= filterRanges['threshold'].min; i -= filterRanges['threshold'].step) {
            thresholdValues.push(`th${i}`);
        }

        for (const value of thresholdValues) {
            const updatedCombination = currentCombination + ` sh gr bo ${value}`;
            // combinations.push(updatedCombination);

            await testFilter(updatedCombination).catch(console.log)
        }

        return;
    }

    for (let i = filterIndexlocal; i < order.length; i++) {
        const filterName = order[i];
        const filter = filterRanges[filterName];
        const filterValues = filter.values || [];

        if (filter) {
            if (filter.min !== undefined && filter.max !== undefined && filter.step !== undefined) {

                if (filter.toggle) {
                    filterValues.push(``);
                }
                for (let value = filter.max; value >= filter.min; value -= filter.step) {
                    if (value === 0) {
                        filterValues.push(``);
                        continue;
                    }
                    filterValues.push(`${filterName.substring(0, 2)}${value}`);
                }

            } else {

                if (filter.toggle)
                    filterValues.push(``);

                filterValues.push(`${filterName.substring(0, 2)}`)

            }
        }

        for (const value of filterValues) {
            const updatedCombination = currentCombination + (currentCombination && value ? ' ' : '') + value;

            await generateFilterPermutations(i + 1, updatedCombination);
        }
    }
}


const { fork } = require('child_process');


const fs = require('fs');
async function generateMyFilterPermutations() {
    const filter = filterRanges[order[filterIndex]];
    if (!filter) {
        console.log(`filter ${filterIndex} ${order[filterIndex]} not found`);
        return
    }
    const filterValues = filter.values || [];

    if (filter.min !== undefined && filter.max !== undefined && filter.step !== undefined) {
        for (let value = filter.max; value >= filter.min; value -= filter.step) {
            if (value === 0) {
                filterValues.push(``);
                continue;
            }
            filterValues.push(`${order[filterIndex].substring(0, 2)}${value}`);
        }
    } else {
        if (filter.toggle) {
            filterValues.push(``);
            filterValues.push(`${order[filterIndex].substring(0, 2)}`);
        } else {
            filterValues.push(`${order[filterIndex].substring(0, 2)}`)
        }
    }

    for (const value of filterValues) {

        if (allowedForks === 0) {
            const currentCombination = (maincurrentCombination ? maincurrentCombination + ' ' : '') + value;
            await generateFilterPermutations(filterIndex + 1, currentCombination);
            process.send(`acc : ${accuracyAll.slice(0, 10)}`)
            // fs.writeFileSync(`combinations${Math.random().toString().replace(/\./, '')}.json`, '');
            // for (const combination of combinations) {
            //     fs.appendFileSync(`combinations${Math.random().toString().replace(/\./, '')}.json`, combination + '\n');
            // }

            // testFilter(currentCombination)

        } else {
            const child = fork('./child.js', [
                JSON.stringify({
                    filterIndex: filterIndex + 1,
                    maincurrentCombination: (maincurrentCombination ? maincurrentCombination + ' ' : '') + value,
                    allowedForks: allowedForks - 1
                })
            ], { execArgv: ['--max-old-space-size=500000'], detached: false })

            // child.on('message', (message) => {
            //     // combinations.push(...message)
            //     // forked++
            //     // console.log(`worker finished ${message}`);

            //     // if (forked === myvalues.length) {

            //     // }
            // });
            await new Promise(resolve => setTimeout(resolve, 5000))

        }

    }
}

const models = ['digits_comma']//, 'Fraktur_50000000.334_450937']


generateMyFilterPermutations();




async function testFilter(filter) {
    const completeNamesFilter = filter.split(/ +/).map(filter => Object.keys(filterRanges).find(key => key.substring(0, 2) === filter.substring(0, 2)) + '/' + filter.substring(2)).join(' ')
    console.log(`Testing ${completeNamesFilter} ${'...'}`);

    let parallel = 1
    const nfiles = fs.readdirSync('./').filter(file => file.includes('jpeg')).length
    let done= false
    let fails= 0
    const ps = fs.readdirSync('./').filter(file => file.includes('jpeg')).map(file => new Promise(async (resolve, reject) => {

        while (parallel > 25) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
        parallel++
        if (done) {
            parallel--
            return resolve(false)
        }

        const filters = completeNamesFilter.split(/ +/).map(ff => {
            return [ff.split('/')[0], ff.split('/')[1]]
        })

        const tmname = `./conv/` + file.split('.')[0] + `${Math.random().toString().replace(/\./, '')}${Date.now().toString()}.jpeg`

        // console.log(`Testing ${completeNamesFilter} Converting file ${file} to ${tmname} ${'...'}`);

        await new Promise(resolve => {
            try {
                Caman(`./${file}`, function () {
                    // console.log(`read file ${file} ${'...'}`);
                    for (const f of filters) {
                        if (f[1] === '')
                            if (f[0])
                                try {
                                    this[f[0]]()
                                } catch (error) {
                                    console.log(`error ${f[0]} : ${filter}`);
                                }
                            else
                                this[f[0]](f[1].includes('.') ? parseFloat(f[1]) : parseInt(f[1]))
                    }

                    // console.log(`writing file ${tmname} ${'...'}`);

                    this.render(function () {
                        this.save(tmname)
                        resolve()
                    })
                })
            } catch (error) {
                console.log(`error ${error} for file ${file}`);
                resolve()
            }

        })

        await new Promise(resolve => setTimeout(resolve, 2500))
        if (!fs.existsSync(tmname)) return resolve(false)
        const bfr = fs.readFileSync(tmname).toString('base64')

        let ok = false
        for (const model of models) {


            let lockIndex = 0
            for (let i = 0; i < 55 && 1 == 1; i++) {
                if (!fs.existsSync(`lock${i}.lock`)) {
                    fs.writeFileSync(`lock${i}.lock`, '')
                    lockIndex = i
                    break;
                }

                if (i === 55) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    i = 0
                }
            }
            // console.log(`Testing ${completeNamesFilter} Recognizing file ${file} ${'...'}`);


            const text = await recognize(bfr, model).catch(e => {
                if (!fs.existsSync(tmname))
                    console.log(`error , file not found for tesseract for file ${tmname}`);
                return ''
            }).finally(() => {

                try {
                    fs.unlinkSync(`lock${lockIndex}.lock`)

                } catch (error) {

                }
            })

            if (text?.trim() == file.substring(0, 3)) {
                ok = true; break
            }

        }
        try {
            fs.unlinkSync(tmname)

        } catch (error) {

        }
        if (!ok) fails++
        if (fails >= nfiles / 2) done= true
        resolve(ok)
        parallel--


    }))


    const results = await Promise.all(ps)

    const accuracy = results.filter(result => result).length / results.length
    console.log(`Accuracy: ${accuracy}, ${completeNamesFilter} ${'...'}: DONE? ${done}`);


    if (accuracy >= 0.6) {
        // console.log(completeNamesFilter, accuracy)
        if (!fs.existsSync('results.txt')) fs.writeFileSync('results.txt', '')
        fs.appendFileSync('results.txt', `${completeNamesFilter} ${accuracy}\n`)
    }
}





const recognize = async (bfr, model) => {
    const worker = await createWorker({ langPath: __dirname, gzip: false, })
    await worker.loadLanguage(model)
    await worker.initialize(model)
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789', // Only recognize numbers
    })


    const { data: { text } } = await worker.recognize(bfr)

    await worker.terminate()
    return text
}





