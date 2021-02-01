
export interface MaterializerOptions {
    observedRoots: Array<string>
    depth: number
}

export interface MaterializerFactory {
    (options: MaterializerOptions): Materializer
}

export interface DataFragment {
    [source: string]: Record<string | number, any>
}

export type Invalidation = Array<string | number>
export type InvalidationList = Array<Invalidation>
export type Path = string | Array<string | number>

export interface Materializer {
    update(fragment: DataFragment, fragmentSchema?: DataFragment): InvalidationList

    updateWithoutFlush(fragment: DataFragment, fragmentSchema?: DataFragment): void

    flush(): InvalidationList

    get<T = any>(path: Path): T
}

export interface Visitor {
    (value: any, path: Array<string | number>): true | void
}

export type Node = { path: Array<string | number>, val: any }