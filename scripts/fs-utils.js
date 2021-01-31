const fs = require('fs');
const util = require('util');
const path = require('path');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

export const readFiles = async dirname => {
    try {
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
    } catch (error) {
        console.error(error);
    }
};
