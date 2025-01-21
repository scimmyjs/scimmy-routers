import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Search Endpoint Router
 * @since 1.0.0
 */
export class Search extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing Search POST endpoint
     * @param {AuthenticationContext|typeof SCIMMY.Types.Resource} [Resource] - the resource type instance for which endpoints are being registered
     * @param {AuthenticationContext} [context] - method to invoke to evaluate context passed to SCIMMY handlers
     */
    constructor(Resource, context = (Resource.prototype instanceof SCIMMY.Types.Resource ? undefined : Resource)) {
        super({mergeParams: true});
        
        // Respond to POST requests for /.search endpoint
        this.post("/.search", async (req, res, next) => {
            try {
                res.status(200).send(await (new SCIMMY.Messages.SearchRequest(req.body)).apply(Resource.prototype instanceof SCIMMY.Types.Resource ? [Resource] : undefined, await context(req)));
            } catch (ex) {
                next(ex);
            }
        });
        
        // Respond with 404 not found to all other requests for /.search endpoint
        this.use("/.search", (req, res, next) => {
            next(new SCIMMY.Types.Error(404, null, "Endpoint Not Found"));
        });
    }
}