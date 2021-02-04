import {createMaterializer} from '../src';

describe('materializer', () => {

    it('should materialize without refs', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: 5
                    }
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: 5
            }
        })
    })

    it('should materialize nulls', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: null
                    }
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: null
            }
        })
    })

    it('should allow removals', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    label: 5
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({ label: 5 })

        const invalidation2 = materializer.update({
            comps: undefined
        })
        expect(invalidation2).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toBeUndefined()
    })

    it('should keep same object reference when has no ref', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const obj = {
            comps: {
                comp1: {
                    props: {
                        label: 5
                    }
                }
            }
        }

        materializer.update(obj)

        expect(materializer.get('comps.comp1')).toBe(obj.comps.comp1)
        expect(materializer.get('comps.comp1')).toBe(materializer.get('comps.comp1'))
    })
})
