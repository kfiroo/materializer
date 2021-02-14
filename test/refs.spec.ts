import {createMaterializer} from '../src';
import { ref } from './test-utils';

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
                        link: ref('$links.link1')
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

    it('should allow removal of refs', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: 5,
                        link: ref('$links.link1')
                    }
                }
            },
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        const invalidation1 = materializer.update({
            links: {
                link1: undefined
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: 5,
                link: undefined
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
                        label: ref('$runtime.comp1.label'),
                        link: ref('$links.link1')
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
                        label: ref('$comps.comp2.props.label')
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
                        label: ref('$comps.comp2.props.label')
                    }
                },
                comp2: {
                    props: {
                        label: ref('$comps.comp1.props.label')
                    }
                }
            }
        })).toThrow(/circular/i)
    })

    // it('should allow ref in all depths', () => {
    //     const materializer = createMaterializer({
    //         invalidations: {
    //             roots: ['props']
    //         }
    //     })
    //
    //     const invalidations = materializer.update({
    //         props: {
    //             page1: {
    //                 comp1: {
    //                     label: ref('$labels.label5')
    //                 }
    //             }
    //         },
    //         labels: {
    //             label1: 'foo',
    //             label5: 'kof',
    //         }
    //     })
    //
    //     expect(invalidations).toEqual([
    //         ['props', 'page1', 'comp1']
    //     ])
    //
    //     expect(materializer.get(invalidations[0])).toEqual({
    //         label: 'kof'
    //     })
    // })

    it('should update references when updating the model', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    props: {
                        link: ref('$links.link1')
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
    })

    it('should update reference even when it is deferred', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })
        
        materializer.update({
            links: {
                link1: {
                    href: 'http://tahat.shel.kof.raki'
                }
            }
        })

        const invalidation1 = materializer.update({
            comps: {
                comp1: {
                    link: ref('$links.link1')
                },
                comp2: {
                    label: 5                
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1'],
            ['comps', 'comp2']
        ])
        expect(materializer.get('comps.comp1')).toEqual({
            link: {
                href: 'http://tahat.shel.kof.raki'
            }
        })
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
                        link: ref('$links.link1')
                    }
                }
            }
        }

        materializer.update(obj)
        expect(obj.comps.comp1).toEqual({
            props: {
                link: ref('$links.link1')
            }
        })
    })
})
