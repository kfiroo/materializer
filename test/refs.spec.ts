import {createMaterializer} from '../src';

describe('materializer', () => {

    it('should allow mix of references and values', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: 5,
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
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: 5,
                link: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
    })

    it('should allow mix of references from different sources', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: '$runtime.comp1.label',
                        link: '$links.link1'
                    }
                }
            },
            runtime: {
                comp1: {
                    label: 5
                }
            },
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: 5,
                link: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
    })

    it('should allow references to observedRoots', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: '$comps.comp2.props.label'
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
            ['comps', 'comp2'],
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: 5
            }
        })
        expect(materializer.get('comps.comp2')).toEqual({
            props: {
                label: 5
            }
        })
    })

    it.skip('should throw on ref cycles', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        expect(() => materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: '$comps.comp2.props.label'
                    }
                },
                comp2: {
                    props: {
                        label: '$comps.comp1.props.label'
                    }
                }
            }
        })).toThrow(/circular/i)
    })

    it('should update references when updating the model', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1'
                    }
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                link: undefined
            }
        })

        const invalidation2 = materializer.update({
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })
        expect(invalidation2).toEqual([
            ['comps', 'comp1']
        ])

        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                link: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        // don't materialize twice
        expect(materializer.get('comps.comp1')).toBe(materializer.get('comps.comp1'))
        expect(materializer.get('comps.comp1.props.link')).toBe(materializer.get('links.link1'))
    })

    it('should not change original values - no side effect', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })
        const obj = {
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1'
                    }
                }
            }
        }

        materializer.update(obj)
        expect(obj.comps.comp1).toEqual({
            props: {
                link: '$links.link1'
            }
        })
    })
})
