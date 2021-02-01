const {createMaterializer, inferSchema} = require('../dist')
const _ = require('lodash')
const fs = require('fs')
const util = require('util')
const path = require('path')

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

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
    const files = await readFiles(path.resolve(__dirname, '..', 'benchmarks'))
    const jsons = _.mapValues(files, ({content}) => JSON.parse(content))
    const results = {}
    const resultsWithoutInferSchema = {}

    // warm up
    _.forEach(jsons, j => {
        const materializer = createMaterializer({
            observedRoots: ['a0'],
            depth: 2
        })
        materializer.update(j)
    })

    _.forEach(jsons, (j, filename) => {
        const start = Date.now()
        for (let i = 0; i < 200; i++) {
            const materializer = createMaterializer({
                observedRoots: ['a0'],
                depth: 2
            })
            materializer.update(j)
        }        
        results[filename] = Date.now() - start
    })

    console.log('without pre-calculated inferSchema')
    console.log(results)


    _.forEach(jsons, (j, filename) => {
        const schema = inferSchema(j)
        const start = Date.now()
        for (let i = 0; i < 500; i++) {
            const materializer = createMaterializer({
                observedRoots: ['a0'],
                depth: 2
            })
            materializer.update(j, schema)
        }        
        resultsWithoutInferSchema[filename] = Date.now() - start
    })

    console.log('with pre-calculated inferSchema')
    console.log(resultsWithoutInferSchema)
}

run()