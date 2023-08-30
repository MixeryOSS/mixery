import { IFileResource, IFolderResource, IResource, IResourcesStore, ResourcePath } from "../index.js";

export namespace ResourcesBundler {
    export interface Resource {
        path: string[];
        file: Blob | undefined;
        children: Resource[] | undefined;
    }

    export async function create(res: IResource): Promise<Resource> {
        if (res.isFile) return <Resource> {
            path: structuredClone(res.path.path),
            file: (res as IFileResource).blob
        };
        if (res.isFolder) return <Resource> {
            path: structuredClone(res.path.path),
            children: await Promise.all((res as IFolderResource).children
                .map(v => (<ResourcePath> {
                    namespace: res.path.namespace,
                    path: [...res.path.path, v]
                }))
                .map(async v => await create(await res.store.getResource(v))))
        };
    }

    export async function bundle(store: IResourcesStore): Promise<Resource[]> {
        return (await create(await store.getResource({
            namespace: store.namespace,
            path: []
        }))).children;
    }
}