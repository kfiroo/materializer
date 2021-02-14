export const ref = (value: string) => ({$type: 'ref', refPath: value.slice(1).split('.')})

