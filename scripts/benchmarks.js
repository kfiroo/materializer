#!/usr/bin/env node

const _ = require('lodash')

console.log('Hello');

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
    props  // props per entity
    // refs    // refs per entity
) {
    const ret = {}
    const e = JSON.stringify(entity(props))

    const paths = cartesian([
        ..._.times(depth, d => _.times(roots, r => key(d, r))),
        _.times(entities, i => `entity${i}`)
    ])

    paths
        .map(a => a.join('.'))
        .forEach(p => _.set(ret, p, JSON.parse(e)))

    return ret
}

const d = generateData(2, 3, 4, 5)

console.log(JSON.stringify(d, null, 4))

debugger

const data = {
    a1: {
        b1: {
            c1: {},
            c2: {}
        },
        b2: {
            c1: {},
            c2: {}
        }
    },
    a2: {
        b1: {
            c1: {},
            c2: {}
        },
        b2: {
            c1: {},
            c2: {}
        }
    }
}
