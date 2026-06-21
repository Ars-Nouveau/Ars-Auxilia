import type CMS from 'decap-cms-app';

type Config = NonNullable<Parameters<typeof CMS["init"]>[0]>['config']

export const config: Config = {
    backend: {
        name: 'github',
        branch: 'main'
    },
    publish_mode: 'editorial_workflow',
    collections: []
}
