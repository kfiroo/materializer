import {get, set, forEach, isObjectLike, startsWith, isString, merge, every, take, has, map, isArray} from 'lodash'

const REF_DOLLAR = '$'

interface DataSourceOptions {
    observedRoots: Array<string>
    depth: number
}

interface DataSourceFactory {
    (options: DataSourceOptions): DataSource
}

interface DataFragment {
    [source: string]: Record<string | number, any>
}

type Invalidations = Array<[string, string | number]>

interface DataSource {
    update(fragment: DataFragment, fragmentSchema?: DataFragment): Invalidations

    get<T = any>(path: string): T
}

interface Visitor {
    (value: any, path: Array<string | number>): true | void
}

type Path = Array<string | number>

const traverse = (obj: any, visit: Visitor, path: Path = []) => {
    const queue = [{path, val: obj}]

    while (queue.length) {
        const next = queue.shift()
        if (!visit(next.val, next.path) && isObjectLike(next.val)) {
            queue.push(...map(next.val, (val, key) => ({
                path: [...next.path, key],
                val
            })))
        }
    }
}

const isRef = (x: any) => isString(x) && startsWith(x, REF_DOLLAR)
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

export const createDataSource: DataSourceFactory = ({observedRoots, depth}) => {
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
            const oldTemplate = get(template, path)
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
            if (has(value, '$type')) { 
                const oldSchema = get(schemas, path)
                if (oldSchema) {
                    const oldRefPath = take(oldSchema.refPath.split('.'), depth).join('.') 
                    index[oldRefPath] = index[oldRefPath] || new Set<string>()
                    index[oldRefPath].delete(take(path, depth).join('.'))
                }

                set(schemas, path, value)
                const refPath = take(value.refPath.split('.'), depth).join('.') 
                index[refPath] = index[refPath] || new Set<string>()
                index[refPath].add(take(path, depth).join('.'))
                return true
            }   
        })
    }

    const populate = (invalidations: Set<string>) => {
        const startFromHere = new Set(Array.from(invalidations).filter(singleInvalidation =>{
            const schema = get(schemas, singleInvalidation)
            if (!schema) {
                return true
            }
            return every(index, (dependencies, parent) => !has(template, parent) || !dependencies.has(singleInvalidation))
        }))

        const allInvalidations = new Set<string>()

        const queue = new Array<Set<string>>(startFromHere.size > 0 ? startFromHere : invalidations) 

        while (queue.length) {
            const paths = queue.shift()
            forEach([...paths.values()], path => {
                if (allInvalidations.has(path)) {
                    return
                }

                allInvalidations.add(path)
                const val = get(template, path)

                if (!has(schemas, path)) {
                    set(materialized, path, val)
                } else {
                    const nodeSchema = get(schemas, path)
                    const newVal = {}
                    traverse(val, (objValue, objPath) => {
                        if (!objPath.length) {
                            return
                        }
                        const schema = get(nodeSchema, objPath)
                        if (!schema) {
                            set(newVal, objPath, objValue)
                            return
                        }
                        if (has(schema, '$type')) {
                            const resolved = get(materialized, schema.refPath)
                            set(newVal, objPath, resolved)
                        } else {
                            set(newVal, objPath, isArray(objValue) ? [...objValue] :  {...objValue})
                        }    
                    })
                    set(materialized, path, newVal)
                }

                const dependencies = index[path]
                if (dependencies){
                    queue.push(dependencies)
                }
            })       
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

        return Array.from(recursiveInvalidations).map(x => x.split('.') as [string, string | number])
            .filter(([root]) => observedRoots.includes(root))
    }

    return {
        update(obj, schema = inferSchema(obj)) {
            mergeSchemas(schema)
            
            mergeTemplates(obj)

           collectInvalidations(obj)
            
           return flush()
        },
        get(path) {
            const val = get(materialized, path)
            return val
        }
    }
}


