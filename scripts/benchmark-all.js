const {createMaterializer, inferSchema} = require('../dist')
const _ = require('lodash')
const fs = require('fs')
const util = require('util')
const path = require('path')

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const NUMBER_OF_RUNS = 500

const shouldInferSchema = true

const readFiles = async dirname => {
    const filenames = await readdir(dirname);
    const files_promise = filenames.map(filename => {
        return readFile(path.resolve(dirname, filename), 'utf-8');
    });
    const response = await Promise.all(files_promise);
    return filenames.reduce((accumlater, filename, currentIndex) => {
        const content = response[currentIndex];
        accumlater[filename] = {
            content,
        };
        return accumlater;
    }, {});
};



const run = async () => {
    console.log('reading files...')
    const files = await readFiles(path.resolve(__dirname, '..', 'benchmarks'))
    console.log('parsing files...')
    const jsons = _.mapValues(files, ({content}) => JSON.parse(content))
    const results = {}

    _.forEach(jsons, (j, filename) => {
        console.log(`starting ${filename}...`)
        const schema = shouldInferSchema ? inferSchema(j): undefined
        const start = Date.now()
        for (let i = 0; i < NUMBER_OF_RUNS; i++) {
            const materializer = createMaterializer({
                observedRoots: ['a0'],
                depth: 2
            })
            materializer.update(j, schema)
        }        
        const res = Date.now() - start
        const result = {
            avg: parseFloat(`${res / NUMBER_OF_RUNS}`.slice(0, 5), 10),
            total: res
        }
        results[filename] = result
        console.log(filename, result)
    })

    console.log('without pre-calculated inferSchema')
    console.log(results)
}

run()