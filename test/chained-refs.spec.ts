import {createDataSource} from '../src';

describe('materializer', () => {

    it('should allow ref to ref', () => {
        const ds = createDataSource({
            observedRoots: ['comps'],
            depth: 2
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
            ['comps', 'comp3'],
            ['comps', 'comp2'],
            ['comps', 'comp1']
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

    it('should allow ref to ref update', () => {
        const ds = createDataSource({
            observedRoots: ['comps'],
            depth: 2
        })

        ds.update({
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

        const invalidation = ds.update({
            comps: {
                comp3: {
                    props: {
                        label: 6
                    }
                }
            }
        })

        expect(invalidation).toEqual([
            ['comps', 'comp3'],
            ['comps', 'comp2'],
            ['comps', 'comp1'],
        ])
        expect(ds.get('comps.comp1')).toEqual({
            props: {
                label: 6
            }
        })
        expect(ds.get('comps.comp2')).toEqual({
            props: {
                label: 6
            }
        })
    })
})
