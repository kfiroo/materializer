import {createMaterializer} from '../src';

describe('materializer', () => {
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

    it('should update references when updating the model', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        materializer.update({
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1'
                    }
                }
            },
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        const comp1 = materializer.get('comps.comp1')

        // don't materialize twice
        expect(comp1).toBe(materializer.get('comps.comp1'))
        expect(comp1.props.link).toBe(materializer.get('links.link1'))

        const newLink = {
            href: 'http://ynet.co.il'
        }
        materializer.update({
            links: {
                link1: newLink
            }
        })

        const newComp = materializer.get('comps.comp1')

        expect(comp1).not.toBe(newComp)
        expect(newComp.props.link).toBe(materializer.get('links.link1'))
    })
})
