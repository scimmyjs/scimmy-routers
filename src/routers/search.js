import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Search Endpoint Router
 * @since 1.0.0
 * @class SCIMMYRouters.Search
 */
export class Search extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing Search POST endpoint
     * @param {Function|typeof SCIMMY.Types.Resource} [Resource] - the resource type instance for which endpoints are being registered
     * @param {AuthenticationContext} [context] - method to invoke to evaluate context passed to SCIMMY handlers
     */
    constructor(Resource, context = (Resource.prototype instanceof SCIMMY.Types.Resource ? (() => {}) : Resource)) {
        super({mergeParams: true});
        
        // Respond to POST requests for /.search endpoint
        this.post("/.search", async (req, res) => {
            try {
                res.status(200).send(await (new SCIMMY.Messages.SearchRequest(req.body)).apply(Resource.prototype instanceof SCIMMY.Types.Resource ? [Resource] : undefined, await context(req)));
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
    }
}