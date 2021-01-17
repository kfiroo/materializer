import {get, set, forEach, isObjectLike, startsWith, isString, merge, every, flatMap, take} from 'lodash'

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
    (value: any, path: Array<string | number>): void
}

type Path = Array<string | number>

export const createDataSource: DataSourceFactory = ({observedRoots}) => {
    const template = {}
    const materialized = {}

    const index: Record<string, Set<string>> = {}

    const traverse = (obj: any, visit: Visitor, path: Path = []) => {
        visit(obj, path)
        if (isObjectLike(obj)) {
            forEach(obj, (value, key) => {
                traverse(value, visit, [...path, key]);
            })
        }
    }
    const resolve = (x: any) => x

    const isRef = (x: any) => isString(x) && startsWith(x, REF_DOLLAR)
    const getRefPath = (x: string) => x.slice(1)

    const populate = (invalidations: Invalidations) => {
        const startFromHere = invalidations.filter(singleInvalidation =>{
            return every(index, dependencies => !dependencies.has(singleInvalidation.join('.')))
        })

        forEach(startFromHere, path => {
            const val = get(template, path)
            set(materialized, path, val)
            const dependencies = index[path.join('.')]
            if (!dependencies){
                return
            }
            forEach([...dependencies.values()], (dependency: string)=> {
                set(materialized, dependency, val)
            })
        })
    }


    return {
        update(obj) {
            const invalidationsSet = new Set<string>()

            traverse(obj, (value, path) => {
                const sPath = path.join('.')
                if (path.length === 2) {
                    invalidationsSet.add(sPath)
                }
                if (isRef(value)) {
                    const refPath = getRefPath(value)
                    index[refPath] = index[refPath] || new Set<string>()
                    index[refPath].add(sPath)
                    invalidationsSet.add(refPath)
                }
            })
            const invalidations = [...invalidationsSet.values()].map(x => {
                let strings = x.split('.');
                const invalidation: [string, string | number] = [strings[0], strings[1]];
                return invalidation
            })

            merge(template, obj)
            populate(invalidations)

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
            return get(materialized, path)
        }
    }
}


