
export const isObjectLike = (item: unknown) => Array.isArray(item) || typeof item === 'object'
export const take = (list: Array<string | number>, count: number) => list.slice(0, count)
export const every = (obj: Record<string, Set<string>>, predicate: (value: Set<string>, key: string) => boolean) => {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (!predicate(obj[key], key)) {
            return false
        }
    }
    return true
}

export const getByArray =  (obj: any, path: Array<string | number>) => {
    let val = obj
    for (let i = 0; i < path.length; i++) {
        val = val[path[i]]
        if (typeof val === 'undefined') {
            return undefined
        }
    }
    return val
}

export const getByString =  (obj: any, path: string) => getByArray(obj, path.split('.'))