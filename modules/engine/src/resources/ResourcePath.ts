/**
 * Path (or pointer) to a resource, which is located somewhere in project or workspace.
 * 
 * For example, `{namespace: 'project', path: ['folder', 'snare.wav']}` points to `folder/snare.wav`
 * in currently opened project.
 */
export interface ResourcePath {
    /**
     * The namespace of the resource. `user` points to user's resource, which is stored in
     * browser IndexedDB. `project` points to resource in currently opened project.
     * 
     * When saving project, it is always a good idea to convert all resource paths with `user`
     * namespace into `project` namespace, so that the project can still be opened on different
     * browser without losing samples.
     */
    namespace: ResourceNamespace;

    /**
     * The path to resource. For example, `["my_folder", "epic_snare.wav"]` points to
     * `/my_folder/epic_snare.wav` (the root directory is based on `namespace` property of this
     * resource path object).
     */
    path: string[];
}

export type ResourceNamespace = "user" | "project" | string & {};