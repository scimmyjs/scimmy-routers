import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Bulk Endpoint Router
 * @since 1.0.0
 */
export class Bulk extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing Bulk POST endpoint
     * @param {AuthenticationContext} [context] - method to invoke to evaluate context passed to SCIMMY handlers
     */
    constructor(context) {
        super({mergeParams: true});
        
        // Respond to POST requests for /Bulk endpoint
        this.post("/Bulk", async (req, res, next) => {
            try {
                const {supported, maxPayloadSize, maxOperations} = SCIMMY.Config.get()?.bulk ?? {};
                
                if (!supported) {
                    next(new SCIMMY.Types.Error(501, null, "Endpoint Not Implemented"));
                } else if (Number(req.header("content-length")) > maxPayloadSize) {
                    next(new SCIMMY.Types.Error(413, null, `The size of the bulk operation exceeds maxPayloadSize limit (${maxPayloadSize})`));
                } else {
                    res.status(200).send(await (new SCIMMY.Messages.BulkRequest(req.body, maxOperations)).apply(undefined, await context(req)));
                }
            } catch (ex) {
                next(ex);
            }
        });
    }
}