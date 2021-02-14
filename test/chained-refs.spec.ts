import {createMaterializer} from '../src';
import { ref } from './test-utils';

describe('materializer', () => {

    it('should allow ref to ref', () => {
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
                        label: ref('$comps.comp3.props.label')
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

    it('should allow ref to ref update', () => {
        const materializer = createMaterializer({
            observedRoots: ['comps'],
            depth: 2
        })

        materializer.update({
            comps: {
                comp1: {
                    props: {
                        label: ref('$comps.comp2.props.label')
                    }
                },
                comp2: {
                    props: {
                        label: ref('$comps.comp3.props.label')
                    }
                },
                comp3: {
                    props: {
                        label: 5
                    }
                }
            }
        })

        const invalidation = materializer.update({
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
        expect(materializer.get('comps.comp1')).toEqual({
            props: {
                label: 6
            }
        })
        expect(materializer.get('comps.comp2')).toEqual({
            props: {
                label: 6
            }
        })
    })
})
