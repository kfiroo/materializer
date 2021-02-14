import {createMaterializer} from '../src';
import { ref } from './test-utils';

const items = {
    item1: {
        svgShape: ref('$svgShapes.svg1'),
        title: "I'm a title 1",
        description: "monkey pig 1"
    },
    item2: {
        svgShape: ref('$svgShapes.svg1'),
        title: "I'm a title 2",
        description: "monkey pig 2",
        button: {
            label: 'Buy me today!',
            link: ref('$links.link1')
        }
    },
    item3: {
        svgShape: ref('$svgShapes.svg3'),
        title: "I'm a title 3",
        description: "monkey pig 3"
    }
}
const svgShapes = {
    svg1: '<svg1/>',
    svg2: '<svg2/>',
    svg3: '<svg3/>'
}
const links = {
    link1: {
        href: 'http://tahat.shel.kof.raki',
        target: '_blank'
    }
}

describe('materializer', () => {

    it('repeater', () => {
        const materializer = createMaterializer({
            observedRoots: ['props'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            props: {
                repeater: {
                    items: [ref('$items.item1'), ref('$items.item2')]
                }
            },
            items,
            svgShapes,
            links
        })
        expect(invalidation1).toEqual([
            ['props', 'repeater']
        ])

        expect(materializer.get('props.repeater')).toEqual({
            items: [
                {
                    svgShape: '<svg1/>',
                    title: "I'm a title 1",
                    description: "monkey pig 1"
                },
                {
                    svgShape: '<svg1/>',
                    title: "I'm a title 2",
                    description: "monkey pig 2",
                    button: {
                        label: 'Buy me today!',
                        link: {
                            href: 'http://tahat.shel.kof.raki',
                            target: '_blank'
                        }
                    }
                }
            ]
        })
    })

    it('update repeater dependency', () => {
        const materializer = createMaterializer({
            observedRoots: ['props'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            props: {
                repeater1: {
                    items: [ref('$items.item1'), ref('$items.item2'), ref('$items.item3')]
                },
                repeater2: {
                    items: [ref('$items.item1')]
                }
            },
            items,
            svgShapes,
            links
        })
        expect(invalidation1).toEqual([
            ['props', 'repeater1'],
            ['props', 'repeater2'],
        ])

        const invalidation2 = materializer.update({
            links: {
                link1: {
                    href: 'http://roro.js',
                    target: '_blank'
                }
            }
        })

        expect(invalidation2).toEqual([
            ['props', 'repeater1']
        ])

        const repeater1 = materializer.get('props.repeater1')

        expect(repeater1.items[1]).toEqual({
            svgShape: '<svg1/>',
            title: "I'm a title 2",
            description: "monkey pig 2",
            button: {
                label: 'Buy me today!',
                link: {
                    href: 'http://roro.js',
                    target: '_blank'
                }
            }
        })
    })

    it('update repeaters references', () => {
        const materializer = createMaterializer({
            observedRoots: ['props'],
            depth: 2
        })

        const invalidation1 = materializer.update({
            props: {
                repeater1: {
                    items: [ref('$items.item1'), ref('$items.item2')]
                },
                repeater2: {
                    items: [ref('$items.item1')]
                }
            },
            items,
            svgShapes,
            links
        })
        expect(invalidation1).toEqual([
            ['props', 'repeater1'],
            ['props', 'repeater2'],
        ])

        const invalidation2 = materializer.update({
            props: {
                repeater2: {
                    items: [ref('$items.item3')]
                }
            }
        })

        expect(invalidation2).toEqual([
            ['props', 'repeater2']
        ])

        expect(materializer.get('props.repeater2').items[0]).toEqual({
            svgShape: '<svg3/>',
            title: "I'm a title 3",
            description: "monkey pig 3"
        })

        const invalidation3 = materializer.update({
            svgShapes: {
                svg1: '<svg1_new/>',
            }
        })

        expect(invalidation3).toEqual([
            ['props', 'repeater1']
        ])

        expect(materializer.get('props.repeater1')).toEqual({
            items: [
                {
                    svgShape: '<svg1_new/>',
                    title: "I'm a title 1",
                    description: "monkey pig 1"
                },
                {
                    svgShape: '<svg1_new/>',
                    title: "I'm a title 2",
                    description: "monkey pig 2",
                    button: {
                        label: 'Buy me today!',
                        link: {
                            href: 'http://tahat.shel.kof.raki',
                            target: '_blank'
                        }
                    }
                }
            ]
        })

        const invalidation4 = materializer.update({
            svgShapes: {
                svg3: '<svg3_new/>'
            }
        })

        expect(invalidation4).toEqual([
            ['props', 'repeater2']
        ])

        expect(materializer.get('props.repeater2').items[0]).toEqual({
            svgShape: '<svg3_new/>',
            title: "I'm a title 3",
            description: "monkey pig 3"
        })
    })
})
