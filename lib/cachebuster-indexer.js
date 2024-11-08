import { tasks, processors } from "@ui5/builder"

/**
 * Custom task API
 *
 * @param {object} parameters
 * 
 * @param {module:@ui5/fs.AbstractReader} parameters.dependencies
 *      Reader to access resources of the project's dependencies
 * @param {@ui5/logger/Logger} parameters.log
 *      Logger instance for use in the custom task.
 *      This parameter is only available to custom task extensions
 *      defining Specification Version 3.0 and later.
 * @param {object} parameters.options Options
 * @param {string} parameters.options.projectName
 *      Name of the project currently being built
 * @param {string} parameters.options.projectNamespace
 *      Namespace of the project currently being built
 * @param {string} parameters.options.configuration
 *      Custom task configuration, as defined in the project's ui5.yaml
 * @param {string} parameters.options.taskName
 *      Name of the custom task.
 *      This parameter is only provided to custom task extensions
 *      defining Specification Version 3.0 and later.
 * @param {@ui5/builder.tasks.TaskUtil} parameters.taskUtil
 *      Specification Version-dependent interface to a TaskUtil instance.
 *      See the corresponding API reference for details:
 *      https://sap.github.io/ui5-tooling/v4/api/@ui5_project_build_helpers_TaskUtil.html
 * @param {module:@ui5/fs.DuplexCollection} parameters.workspace
 *      Reader/Writer to access and modify resources of the
 *      project currently being built
 * @returns {Promise<undefined>}
 *      Promise resolving once the task has finished
 */
export default async function ({ workspace, dependencies, taskUtil, log, options }) {
    options.configuration && options.configuration.debug && log.info("Generate cachebuster info");
    const cachebusterInfoResource = await tasks.generateCachebusterInfo({ workspace, dependencies, options: { namespace: options.projectNamespace, signatureType: "time" } });
    const cachebusterInfoResources = await workspace.byGlob("**/sap-ui-cachebuster-info.json");
    if (cachebusterInfoResources.length > 0) {
        options.configuration && options.configuration.debug && log.info("Cachebuster info generated");
        let cachebusterInfo = JSON.parse(await cachebusterInfoResources[0].getString());
        // console.log(cachebusterInfo);
        for (var resourcePath in cachebusterInfo) {
            let resource = await workspace.byPath("/resources/" + options.projectNamespace + "/" + resourcePath);
            let newResource = undefined;
            if (resource) {
                options.configuration && options.configuration.debug && log.info("Clone file for cache:" + resourcePath);
                newResource = await resource.clone();
            }
            if (newResource) {
                newResource.setPath("/resources/" + options.projectNamespace + "/~" + cachebusterInfo[resourcePath] + "~/" + resourcePath);
                await workspace.write(newResource);
            }
        }
    }
};