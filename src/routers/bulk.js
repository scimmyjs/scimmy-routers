import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Bulk Endpoint Router
 * @since 1.0.0
 * @class SCIMMYRouters.Bulk
 */
export class Bulk extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing Bulk POST endpoint
     */
    constructor() {
        super();
        
        // Respond to POST requests for /Bulk endpoint
        this.post("/Bulk", async (req, res) => {
            try {
                let {supported, maxPayloadSize, maxOperations} = SCIMMY.Config.get()?.bulk ?? {};
                
                if (!supported) {
                    res.status(501).send();
                } else if (Number(req.header("content-length")) > maxPayloadSize) {
                    throw new SCIMMY.Types.Error(413, null, `The size of the bulk operation exceeds maxPayloadSize limit (${maxPayloadSize})`);
                } else {
                    res.status(200).send(await (new SCIMMY.Messages.BulkRequest(req.body, maxOperations)).apply());
                }
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
    }
}