import {createDataSource} from '../src';

describe('materializer', () => {

    it('should materialize without refs', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
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

    it('should ', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
        })

        const invalidation1 = ds.update({
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1'
                    }
                },
                comp2: {
                    props: {
                        label: 5
                    }
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1'],
            ['comps', 'comp2']
        ])
        return
        expect(ds.get('comps.comp1')).toEqual({
            props: {
                link: undefined
            }
        })

        const invalidation2 = ds.update({
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
        expect(invalidation2).toEqual([
            ['comps', 'comp1']
        ])
        expect(ds.get('comps.comp1')).toEqual({
            props: {
                link: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        // don't materialize twice
        expect(ds.get('comps.comp1')).toBe(ds.get('comps.comp1'))
    })

})
