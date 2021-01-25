import {createMaterializer} from '../src';

describe('materializer', () => {

    it('menu container', () => {
        const materializer = createMaterializer({
            observedRoots: ['props'],
            depth: 3
        })

        const invalidation1 = materializer.update({
            props: {
                masterPage: {
                    mc1: {
                        isOpen: false
                    }
                },
                c1dmp: {
                    mt1: {
                        isOpen: '$props.masterPage.mc1.isOpen'
                    }
                }
            }
        })
        expect(invalidation1).toEqual([
            ['props', 'masterPage', 'mc1'],
            ['props', 'c1dmp', 'mt1']
        ])

        expect(materializer.get('props.c1dmp.mt1')).toEqual({
            isOpen: false
        })

        const invalidation2 = materializer.update({
            props: {
                masterPage: {
                    mc1: {
                        isOpen: true
                    }
                },
            }
        })

        expect(invalidation2).toEqual([
            ['props', 'masterPage', 'mc1'],
            ['props', 'c1dmp', 'mt1']
        ])

        invalidation2.forEach(inv => {
            expect(materializer.get([...inv, 'isOpen'])).toEqual(true)
        })
    })

    it('env stuff', () => {
        const materializer = createMaterializer({
            observedRoots: ['props', 'tpa'],
            depth: 3
        })

        const invalidation1 = materializer.update({
            props: {
                masterPage: {
                    comp1: {
                        reducedMotion: '$app.env.reducedMotion',
                        currentUrl: '$app.urls.parsedUrl',
                        isLoggedIn: '$app.members.isLoggedIn'
                    },
                    WIX_ADS: {
                        brandName: '$app.cobranding.brandName',
                        brandLogoUrl: '$app.cobranding.brandLogoUrl',
                    }
                },
            },
            tpa: {
                comps: {
                    tpa1: {
                        instance: '$app.clientSpecMap.7.instance'
                    }
                }
            },
            app: {
                env: {
                    reducedMotion: true // reducedMotion
                },
                urls: {
                    parsedUrl: 'www.kof.net/home', // current-url
                    relativeUrl: '/home' // menus-current-page
                },
                members: {
                    isLoggedIn: true,
                    user: {
                        id: 5,
                        name: 'kof'
                    }
                },
                popups: {
                    currentPopupId: 'c2dmp' // active-popup
                },
                cobranding: { // co-branding
                    brandName: 'kof1',
                    brandLogoUrl: 'www.kof.img',
                },
                sessionManager: {
                    visitorId: 666 // paypal button
                },
                clientSpecMap: {
                    7: {instance: 'kkkkkkk'}
                },
                translations: {
                    next: 'adelante!'
                }
            }
        })

        expect(materializer.get('props.masterPage.comp1')).toEqual({
            reducedMotion: true,
            currentUrl: 'www.kof.net/home',
            isLoggedIn: true
        })
        expect(materializer.get('props.masterPage.WIX_ADS')).toEqual({
            brandName: 'kof1',
            brandLogoUrl: 'www.kof.img',
        })
        expect(materializer.get('tpa.comps.tpa1')).toEqual({instance: 'kkkkkkk'})
    })
})
