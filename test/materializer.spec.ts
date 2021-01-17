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
    it('should keep same object reference when has no ref', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
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
    })

    it('should update references when updating the model', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
        })

        const invalidation1 = ds.update({
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

    it('should not change original values - no side effect', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
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

        ds.update(obj)
        expect(obj.comps.comp1).toEqual({
            props: {
                link: '$links.link1'
            }
        })
    })

    it('should allow references to observedRoots', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
        })

        const invalidation1 = ds.update({
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
            ['comps', 'comp1'],
            ['comps', 'comp2']
        ])
        expect(ds.get('comps.comp1')).toEqual({
            props: {
                label: 5
            }
        })
        expect(ds.get('comps.comp2')).toEqual({
            props: {
                label: 5
            }
        })
    })

    it('should allow ref to ref', () => {
        const ds = createDataSource({
            observedRoots: ['comps']
        })

        const invalidation1 = ds.update({
            comps: {
                comp1: {
                    props: {
                        label: '$comps.comp2.props.label'
                    }
                },
                comp2: {
                    props: {
                        label: '$comps.comp3.props.label'
                    }
                },
                comp3: {
                    props: {
                        label: 5
                    }
                }
            }
        })
        expect(invalidation1).toEqual([
            ['comps', 'comp1'],
            ['comps', 'comp2'],
            ['comps', 'comp3']
        ])
        expect(ds.get('comps.comp1')).toEqual({
            props: {
                label: 5
            }
        })
    })
})
