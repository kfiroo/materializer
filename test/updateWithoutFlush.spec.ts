import {createDataSource} from '../src';

describe('materializer', () => {
    it('should update references when updating the model', () => {
        const ds = createDataSource({
            observedRoots: ['comps'],
            depth: 2
        })

        ds.updateWithoutFlush({
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1'
                    }
                }
            }
        })
        
        expect(ds.get('comps.comp1')).toBeUndefined()

        ds.updateWithoutFlush({
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        expect(ds.get('comps.comp1')).toBeUndefined()

        const invalidation1 = ds.flush()

        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])

        expect(ds.get('comps.comp1')).toEqual({
            props: {
                link: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
    })
})
