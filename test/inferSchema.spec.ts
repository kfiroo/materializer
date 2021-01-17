import {inferSchema} from '../src';

describe('inferSchema', () => {
    it('should have empty schema for non schemed object', () => {
        const schema = inferSchema({
            comps: {
                comp1: {
                    props: {
                        label: 5
                    }
                }
            }
        })
        expect(schema).toEqual({})
    })

    it('should update references when updating the model', () => {
        const schema = inferSchema({
            comps: {
                comp1: {
                    props: {
                        link: '$links.link1',
                        label: 5

                    }
                }
            }
        })
        expect(schema).toEqual({
            comps: {
                comp1: {
                    props: {
                        link: {$type:'ref', refPath: 'links.link1'},
                    }
                }
            }
        })
    })
})
