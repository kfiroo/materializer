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

    const index: Record<string, Set<string>> = {}

    const mergeTemplates = (newTemplate: DataFragment) => {
        traverse(newTemplate, (value, path) => {
            if (path.length !== depth) {
                return
            }
            const oldTemplate = get(template, path)
            if (oldTemplate) {
                set(template, path, merge({}, oldTemplate, value))
            } else {
                set(template, path, value)
            }
            return true
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

        const queue = new Array<Set<string>>(startFromHere) 

        const populateRec = () => {
            if (queue.length === 0) {
                return
            }
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
            populateRec()
        }    
        populateRec()
        return allInvalidations
    }


    return {
        update(obj, schema = inferSchema(obj)) {
            const invalidations = new Set<string>()

            mergeSchemas(schemas, schema)

            traverse(obj, (__, path) => {
                if (path.length !== depth) {
                    return
                }

                const sPath = path.join('.')
                invalidations.add(sPath)

                const mySchema = get(schemas, path)
                if (!mySchema) {
                    return true
                }

                traverse(mySchema, (schemaVal) => {
                    if (has(schemaVal, '$type')) { 
                        const refPath = take(schemaVal.refPath.split('.'), depth).join('.') 
                        index[refPath] = index[refPath] || new Set<string>()
                        index[refPath].add(take(path, depth).join('.'))
                    }
                })
            })
            
            mergeTemplates(obj)
            
            const recursiveInvalidations = populate(invalidations)

            return Array.from(recursiveInvalidations).map(x => x.split('.') as [string, string | number])
                .filter(([root]) => observedRoots.includes(root))
        },
        get(path) {
            const val = get(materialized, path)
            return val
        }
    }
}


