import {Queue} from './Queue'
import {DataFragment, Materializer, MaterializerFactory, Visitor, Node} from './types'
import {every, getByArray, getByString, isObjectLike, take, setByArray, setByString, hasByString} from './utils'

export * from './types'

const REF_DOLLAR = '$'
const QUEUE_INITIAL_SIZE = 1024

const traverse = (obj: any, visit: Visitor) => {
    const queue = new Queue<Node>(QUEUE_INITIAL_SIZE)
    queue.enqueue({path: [], val: obj})

    while (!queue.isEmpty()) {
        const next = queue.dequeue()
        if (!visit(next.val, next.path)) {
            if (typeof next.val === 'object' && next.val !== null) {
                const keys = Object.keys(next.val)
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    queue.enqueue({
                        path: [...next.path, key],
                        val: next.val[key]
                    })
                }
            } else if (Array.isArray(next.val)) {
                for (let i = 0; i < next.val.length; i++) {
                    queue.enqueue({
                        path: [...next.path, i],
                        val: next.val[i]
                    })
                }
            }
        }
    }
}

const isRef = (x: any) => typeof x === 'string' && x[0] === REF_DOLLAR
const getRefPath = (x: string) => x.slice(1).split('.')

export const inferSchema = (dataFragment: DataFragment): DataFragment => {
    const schema = {}
    traverse(dataFragment, (value, path) => {
        if (isRef(value)) {
            setByArray(schema, path, {$type: 'ref', refPath: getRefPath(value)})
        }
    })
    return schema
}

export const createMaterializer: MaterializerFactory = ({observedRoots, depth}) => {
    const template = {}
    const materialized = {}
    const schemas = {}
    const pendingInvalidations = new Set<string>()
    const index: Record<string, Set<string>> = {}

    const mergeTemplates = (newTemplate: DataFragment) => {
        traverse(newTemplate, (value, path) => {
            if (typeof value === 'undefined') {
                const oldTemplate = getByArray(template, path)
                traverse(oldTemplate, (__, oldPath) => {
                    if (path.length + oldPath.length === depth) {
                        pendingInvalidations.add([...path, ...oldPath].join('.'))
                        return true
                    }
                })
                setByArray(template, path, undefined)
                return true
            }

            if (path.length === depth) {
                const oldTemplate = getByArray(template, path)
                pendingInvalidations.add(path.join('.'))
                if (isObjectLike(oldTemplate)) {
                    setByArray(template, path, Object.assign({}, oldTemplate, value))
                } else {
                    setByArray(template, path, value)
                }
                return true
            }
        })
    }

    const mergeSchemas = (newSchema: DataFragment) => {
        traverse(newSchema, (value, path) => {
            if (value.hasOwnProperty('$type')) {
                const oldSchema = getByArray(schemas, path)
                if (oldSchema) {
                    const oldRefPath = take(oldSchema.refPath, depth).join('.')
                    index[oldRefPath] = index[oldRefPath] || new Set<string>()
                    index[oldRefPath].delete(take(path, depth).join('.'))
                }

                setByArray(schemas, path, value)
                const refPath = take(value.refPath, depth).join('.')
                index[refPath] = index[refPath] || new Set<string>()
                index[refPath].add(take(path, depth).join('.'))
                return true
            }
        })
    }

    const populate = (invalidations: Set<string>) => {
        const startFromHere = new Set(Array.from(invalidations).filter(singleInvalidation => {
            const schema = getByString(schemas, singleInvalidation)
            if (!schema) {
                return true
            }
            return every(index, (dependencies, parent) => !hasByString(template, parent) || !dependencies.has(singleInvalidation))
        }))

        const allInvalidations = new Set<string>()

        const queue = new Queue<Set<string>>(QUEUE_INITIAL_SIZE)
        queue.enqueue(startFromHere.size > 0 ? startFromHere : invalidations)

        while (!queue.isEmpty()) {
            const paths = queue.dequeue()
            paths.forEach(path => {
                if (allInvalidations.has(path)) {
                    return
                }

                allInvalidations.add(path)
                const val = getByString(template, path)

                if (!hasByString(schemas, path)) {
                    setByString(materialized, path, val)
                } else {
                    const nodeSchema = getByString(schemas, path)
                    const newVal = {}
                    traverse(val, (objValue, objPath) => {
                        if (!objPath.length) {
                            return
                        }
                        const schema = getByArray(nodeSchema, objPath)
                        if (!schema) {
                            setByArray(newVal, objPath, objValue)
                            return
                        }
                        if (schema.hasOwnProperty('$type')) {
                            const resolved = getByArray(materialized, schema.refPath)
                            setByArray(newVal, objPath, resolved)
                        } else {
                            setByArray(newVal, objPath, Array.isArray(objValue) ? [...objValue] : {...objValue})
                        }
                    })
                    setByString(materialized, path, newVal)
                }

                const dependencies = index[path]
                if (dependencies) {
                    queue.enqueue(dependencies)
                }
            })
        }

        return allInvalidations
    }


    const flush = () => {
        const recursiveInvalidations = populate(pendingInvalidations)

        pendingInvalidations.clear()

        return Array.from(recursiveInvalidations).map(x => x.split('.'))
            .filter(([root]) => observedRoots.includes(root))
    }

    const updateWithoutFlush: Materializer['updateWithoutFlush'] = (fragment, fragmentSchema = inferSchema(fragment)) => {
        mergeSchemas(fragmentSchema)

        mergeTemplates(fragment)
    }

    return {
        update(fragment, schema) {
            updateWithoutFlush(fragment, schema)
            return flush()
        },
        updateWithoutFlush,
        flush,
        get: (path) => Array.isArray(path) ? getByArray(materialized, path) : getByString(materialized, path)
    }
}


