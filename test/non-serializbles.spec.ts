import {createMaterializer} from '../src';

describe('materializer', () => {

    it('should ignore functions', () => {
        const materializer = createMaterializer({
            observedRoots: ['props'],
            depth: 2
        })

        const func = () => 1

        materializer.update({
            props: {
                repeater: {
                    func
                }
            },
        })

        expect(materializer.get('props.repeater')).toEqual({
            func
        })
    })

    it('should ignore classes', () => {
        const materializer = createMaterializer({
            observedRoots: ['props'],
            depth: 2
        })

        const aClass = class Foo {
            bar() {
                return 1
            }
        }

        const instance = new aClass()

        materializer.update({
            props: {
                repeater: {
                    aClass,
                    instance
                }
            },
        })

        expect(materializer.get('props.repeater')).toEqual({
            aClass,
            instance
        })
    })


})
