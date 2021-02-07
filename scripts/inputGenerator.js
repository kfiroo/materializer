#!/usr/bin/env node

const _ = require('lodash')

const cartesian = (a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
const key = (c, i) => `${String.fromCharCode('a'.charCodeAt(0) + c)}${i}`

const entity = (p) => _.zipObject(
    _.times(p, i => `prop${i}`),
    _.times(p, i => `value${i}`)
)

function generateData(
    roots,  // number of roots
    depth,  // entity depth
    entities,  // entities per root
    props,  // props per entity
    refs = 0,    // refs per entity
) {
    const ret = {}
    const e = JSON.stringify(entity(props))

    const paths = cartesian([
        ..._.times(depth, d => _.times(roots, r => key(d, r))),
        _.times(entities, i => `entity${i}`)
    ])

    paths
        .map(a => a.join('.'))
        .forEach(p => {
            const newEntity = JSON.parse(e)
            Object.keys(newEntity).forEach((k, i) => {
                if (i < refs) {
                    const newPath = [`refs-${p}`, k].join('.')
                    _.set(ret, newPath, newEntity[k])
                    _.set(ret, [p, k].join('.'), `$${newPath}`)
                } else {
                    _.set(ret, [p, k].join('.'), newEntity[k])
                }
            })
        })

    return ret
}

const args = process.env.INPUT ? process.env.INPUT.split('_').map(n => parseInt(n, 10)) : [1, 1, 10, 10, 1]
const d = generateData(...args)

console.log(JSON.stringify(d))

