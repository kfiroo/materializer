import {createMaterializer} from '../src';

describe('materializer', () => {

    it('should update references when updating the model', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        materializer.updateWithoutFlush({
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1'
                    }
                }
            }
        })

        expect(materializer.get('comps.comp1')).toBeUndefined()

        materializer.updateWithoutFlush({
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        expect(materializer.get('comps.comp1')).toBeUndefined()

        const invalidation1 = materializer.flush()

        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])

        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                link: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
    })
})
