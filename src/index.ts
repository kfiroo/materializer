import {get, set, forEach, isObjectLike, isString, merge, every, take, has} from 'lodash'
import {Queue} from './Queue'

const REF_DOLLAR = '$'
const QUEUE_INITIAL_SIZE = 1024

interface MaterializerOptions {
    observedRoots: Array<string>
    depth: number
}

interface MaterializerFactory {
    (options: MaterializerOptions): Materializer
}

interface DataFragment {
    [source: string]: Record<string | number, any>
}

type Invalidation = Array<string | number>
type InvalidationList = Array<Invalidation>
type Path = string | Array<string | number>

interface Materializer {
    update(fragment: DataFragment, fragmentSchema?: DataFragment): InvalidationList

    updateWithoutFlush(fragment: DataFragment, fragmentSchema?: DataFragment): void

    flush(): InvalidationList

    get<T = any>(path: Path): T
}

interface Visitor {
    (value: any, path: Array<string | number>): true | void
}

const traverse = (obj: any, visit: Visitor, queueInitialSize = QUEUE_INITIAL_SIZE) => {
    const queue = new Queue(queueInitialSize)
    queue.enqueue({path: [], val: obj})

    while (!queue.isEmpty()) {
        const next = queue.dequeue()
        if (!visit(next.val, next.path) && isObjectLike(next.val)) {
            forEach(next.val, (val, key) => queue.enqueue({
                path: [...next.path, key],
                val
            }))
        }
    }
}


const getByArray =  (obj: any, path: Array<string | number>) => {
    let val = obj
    for (let i = 0; i < path.length; i++) {
        val = val[path[i]]
        if (typeof val === 'undefined') {
            return undefined
        }
    }
    return val
}

const getByString =  (obj: any, path: string) => getByArray(obj, path.split('.'))

const isRef = (x: any) => isString(x) && x[0] === REF_DOLLAR
const getRefPath = (x: string) => x.slice(1)

export const inferSchema = (dataFragment: DataFragment): DataFragment => {
    const schema = {}
    traverse(dataFragment, (value, path) => {
        if (isRef(value)) {
            set(schema, path, {$type: 'ref', refPath: getRefPath(value)})
        }
    })
    return schema
}

export const mergeSchemas = (targetSchema: DataFragment, newSchema: DataFragment) => {
    merge(targetSchema, newSchema)
}

export const createMaterializer: MaterializerFactory = ({observedRoots, depth}) => {
    const template = {}
    const materialized = {}
    const schemas = {}
    const pendingInvalidations = new Set<string>()
    const index: Record<string, Set<string>> = {}

    const mergeTemplates = (newTemplate: DataFragment) => {
        traverse(newTemplate, (value, path) => {
            if (path.length !== depth) {
                return
            }
            const oldTemplate = getByArray(template, path)
            if (isObjectLike(oldTemplate)) {
                set(template, path, merge({}, oldTemplate, value))
            } else {
                set(template, path, value)
            }
            return true
        })
    }

    const mergeSchemas = (newSchema: DataFragment) => {
        traverse(newSchema, (value, path) => {
            if (value.hasOwnProperty('$type')) {
                const oldSchema = getByArray(schemas, path)
                const currentPath = take(path, depth).join('.')
                if (oldSchema) {
                    const oldRefPath = take(oldSchema.refPath.split('.'), depth).join('.')
                    index[oldRefPath] = index[oldRefPath] || new Set<string>()
                    index[oldRefPath].delete(currentPath)
                }

                set(schemas, path, value)
                const refPath = take(value.refPath.split('.'), depth).join('.')
                index[refPath] = index[refPath] || new Set<string>()
                index[refPath].add(currentPath)
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
            return every(index, (dependencies, parent) => !has(template, parent) || !dependencies.has(singleInvalidation))
        }))

        const allInvalidations = new Set<string>()

        const queue = new Queue(QUEUE_INITIAL_SIZE)
        queue.enqueue(startFromHere.size > 0 ? startFromHere : invalidations)
        
        while (!queue.isEmpty()) {
            const paths = queue.dequeue()

            for (const path of paths) {
                if (allInvalidations.has(path)) {
                    return
                }

                allInvalidations.add(path)
                const val = getByString(template, path)

                if (!has(schemas, path)) {
                    set(materialized, path, val)
                } else {
                    const nodeSchema = getByString(schemas, path)
                    const newVal = {}
                    traverse(val, (objValue, objPath) => {
                        if (!objPath.length) {
                            return
                        }
                        const schema = getByArray(nodeSchema, objPath)
                        if (!schema) {
                            set(newVal, objPath, objValue)
                            return
                        }
                        if (schema.hasOwnProperty('$type')) {
                            const resolved = getByString(materialized, schema.refPath)
                            set(newVal, objPath, resolved)
                        } else {
                            set(newVal, objPath, Array.isArray(objValue) ? [...objValue] : {...objValue})
                        }
                    })
                    set(materialized, path, newVal)
                }

                const dependencies = index[path]
                if (dependencies) {
                    queue.enqueue(dependencies)
                }
            
            }
        }

        return allInvalidations
    }

    const collectInvalidations = (obj: DataFragment) => {
        traverse(obj, (__, path) => {
            if (path.length !== depth) {
                return
            }

            const sPath = path.join('.')
            pendingInvalidations.add(sPath)

            return true
        })
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

        collectInvalidations(fragment)
    }

    return {
        update(fragment, schema) {
            updateWithoutFlush(fragment, schema)
            return flush()
        },
        updateWithoutFlush,
        flush,
        get: (path) => get(materialized, path)
    }
}


