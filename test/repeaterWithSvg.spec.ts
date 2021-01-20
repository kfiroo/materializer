import {createDataSource} from '../src';

describe('materializer', () => {
it('repeater', () => {
    const ds = createDataSource({
        observedRoots: ['props'],
        depth: 2
    })

    const invalidation1 = ds.update({
        props: {
            repeater: {
                items: ['$items.item1', '$items.item2', '$items.item3']
            }
        },
        items: {
            item1:  {
                svgShape: '$svgShapes.svg1',
                title: "I'm a title 1",
                description: "monkey pig 1"
            },
            item2:  {
                svgShape: '$svgShapes.svg1',
                title: "I'm a title 2",
                description: "monkey pig 2",
                button: {
                    label: 'Buy me today!',
                    href: '$links.link1'
                }
            },
            item3:  {
                svgShape: '$svgShapes.svg3',
                title: "I'm a title 3",
                description: "monkey pig 3"
            }
        },
        svgShapes: {
            svg1: '<svg1/>',
            svg2: '<svg2/>',
            svg3: '<svg3/>'
        },
        links: {
            link1: {
                href: 'http://tahat.shel.kof.raki',
                target: '_blank'
            }
        }
    })
    expect(invalidation1).toEqual([
        ['props', 'repeater']
    ])

    expect(ds.get('props.repeater')).toEqual({
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
                    href: {
                        href: 'http://tahat.shel.kof.raki',
                        target: '_blank'
                    }
                }
            },
              {
                svgShape: '<svg3/>',
                title: "I'm a title 3",
                description: "monkey pig 3"
            }
        ]
    })
})

it('update repeater dependency', () => {
    const ds = createDataSource({
        observedRoots: ['props'],
        depth: 2
    })

    const invalidation1 = ds.update({
        props: {
            repeater1: {
                items: ['$items.item1', '$items.item2', '$items.item3']
            },
            repeater2: {
                items: ['$items.item1']
            }
        },
        items: {
            item1:  {
                svgShape: '$svgShapes.svg1',
                title: "I'm a title 1",
                description: "monkey pig 1"
            },
            item2:  {
                svgShape: '$svgShapes.svg1',
                title: "I'm a title 2",
                description: "monkey pig 2",
                button: {
                    label: 'Buy me today!',
                    href: '$links.link1'
                }
            },
            item3:  {
                svgShape: '$svgShapes.svg3',
                title: "I'm a title 3",
                description: "monkey pig 3"
            },
        },
        svgShapes: {
            svg1: '<svg1/>',
            svg2: '<svg2/>',
            svg3: '<svg3/>'
        },
        links: {
            link1: {
                href: 'http://tahat.shel.kof.raki',
                target: '_blank'
            }
        }
    })
    expect(invalidation1).toEqual([
        ['props', 'repeater1'],
        ['props', 'repeater2'],
    ])

    const invalidation2 = ds.update({
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

    const {items} = ds.get('props.repeater1')

    expect(items[1]).toEqual({
        svgShape: '<svg1/>',
        title: "I'm a title 2",
        description: "monkey pig 2",
        button: {
            label: 'Buy me today!',
            href: {
                href: 'http://roro.js',
                target: '_blank'
            }
        }
    })
})


})