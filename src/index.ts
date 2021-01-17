import {get, set, forEach, isObjectLike, startsWith, isString, merge} from 'lodash'

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

    const populate = (invalidations: Invalidations) => {
        forEach(invalidations, path => set(materialized, path, get(template, path)))
    }


    return {
        update(obj) {
            const invalidationsSet = new Set<string>()

            traverse(obj, (value, path) => {
                const sPath = path.join('.')
                if (path.length === 2 && observedRoots.includes(path[0] as string)) {
                    invalidationsSet.add(sPath)
                }
                // if (isRef(value)) {
                //     index[value] = index[value] || new Set<string>()
                //     index[value].add(sPath)
                //     // invalidations.add([path[0], path[1]].join('.'))
                // }
            })
            const invalidations = [...invalidationsSet.values()].map(x => {
                let strings = x.split('.');
                const invalidation:[string, string | number] = [strings[0], strings[1]];
                return invalidation
            })

            merge(template, obj)
            populate( invalidations)
            return invalidations
        },
        get(path) {
            return get(materialized, path)
        }
    }
}


