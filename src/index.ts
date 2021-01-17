import {get, set, forEach, isObjectLike, startsWith, isString, merge, every, flatMap, take, mapValues, isUndefined, has} from 'lodash'

const REF_DOLLAR = '$'

interface DataSourceOptions {
    observedRoots: Array<string>
}

interface DataSourceFactory {
    (options: DataSourceOptions): DataSource
}

interface DataFragment {
    [source: string]: Record<string | number, any>
}

type Invalidations = Array<[string, string | number]>

interface DataSource {
    update(obj: DataFragment): Invalidations

    get<T = any>(path: string): T
}

interface Visitor {
    (value: any, path: Array<string | number>): true | void
}

type Path = Array<string | number>

const traverse = (obj: any, visit: Visitor, path: Path = []) => {
    if (visit(obj, path)) {
        return
    }
    if (isObjectLike(obj)) {
        forEach(obj, (value, key) => {
            traverse(value, visit, [...path, key]);
        })
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


export const createDataSource: DataSourceFactory = ({observedRoots}) => {
    const template = {}
    const materialized = {}
    const schemas = {}

    const index: Record<string, Set<string>> = {}

    const populate = (invalidations: Array<Path>) => {
        const startFromHere = invalidations.filter(singleInvalidation =>{
            const schema = get(schemas, singleInvalidation)
            if (!schema) {
                return true
            }
            const sPath = singleInvalidation.join('.')
            return every(index, (dependencies, parent) => !has(template, parent) || !dependencies.has(sPath))
        })

        const populateRec = (paths: Array<Path>) => {
            forEach(paths, path => {
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
                            set(newVal, objPath, {...objValue})
                        }    
                    })
                    set(materialized, path, newVal)
                }

                const dependencies = index[path.join('.')]
                if (!dependencies){
                    return
                }
                populateRec([...dependencies.values()].map(d => d.split('.')))
            })
        }    
        populateRec(startFromHere)
    }


    return {
        update(obj) {
            const invalidationsSet = new Set<string>()

            const schema = inferSchema(obj)
            mergeSchemas(schemas, schema)

            traverse(obj, (value, path) => {
                if (path.length !== 2) {
                    return
                }

                const sPath = path.join('.')
                invalidationsSet.add(sPath)

                const mySchema = get(schemas, path)
                if (!mySchema) {
                    return true
                }

                traverse(mySchema, (schemaVal) => {
                    if (has(schemaVal, '$type')) { 
                        const refPath = take(schemaVal.refPath.split('.'), 2).join('.') 
                        index[refPath] = index[refPath] || new Set<string>()
                        index[refPath].add(take(path, 2).join('.'))
                    }
                })
            })

            
            merge(template, obj)
            populate(Array.from(invalidationsSet.values()).map(x => x.split('.')))

            const invalidations = [...invalidationsSet.values()].map(x => {
                let strings = x.split('.');
                const invalidation: [string, string | number] = [strings[0], strings[1]];
                return invalidation
            })
            const uniqueInvalidations = new Set<string>(flatMap(invalidations, x => {
                const dependencies = index[x.join('.')]
                if (!dependencies){
                    return []
                }
                return [...dependencies.values()].map(d => take(d.split('.'), 2) as [string, string | number]) 
            }).concat(invalidations).map(i => i.join('.')))

            return Array.from(uniqueInvalidations).map(x => x.split('.') as [string, string | number]).filter(([root]) => observedRoots.includes(root))
        },
        get(path) {
            const val = get(materialized, path)
            return val
        }
    }
}


