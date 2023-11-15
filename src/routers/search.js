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
     */
    constructor(Resource) {
        super();
        
        // Respond to POST requests for /.search endpoint
        this.post("/.search", async (req, res) => {
            try {
                res.status(200).send(await (new SCIMMY.Messages.SearchRequest(req.body)).apply(!!Resource ? [Resource] : undefined));
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
    }
}