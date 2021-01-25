import {createDataSource} from '../src';

describe('materializer', () => {

    it('should materialize without refs', () => {
        const ds = createDataSource({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = ds.update({
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
        expect(ds.get('comps.comp1')).toEqual({
            props: {
                label: 5
            }
        })
    })

    it('should keep same object reference when has no ref', () => {
        const ds = createDataSource({
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

        ds.update(obj)

        expect(ds.get('comps.comp1')).toBe(obj.comps.comp1)
        expect(ds.get('comps.comp1')).toBe(ds.get('comps.comp1'))
    })
})
