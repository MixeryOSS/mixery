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

    export async function putResource(store: IResourcesStore, current: Resource) {
        if (current.file) await store.putResource({
            namespace: store.namespace,
            path: structuredClone(current.path)
        }, current.file);

        if (current.children) {
            await store.putFolder({
                namespace: store.namespace,
                path: structuredClone(current.path)
            });
            await Promise.all(current.children.map(child => putResource(store, child)));
        }
    }

    export async function apply(store: IResourcesStore, bundle: Resource[]) {
        await Promise.all(bundle.map(v => putResource(store, v)));
    }
}