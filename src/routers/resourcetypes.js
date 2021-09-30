import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY ResourceTypes Endpoints Router
 * @class SCIMMYRouters.ResourceTypes
 */
export class ResourceTypes extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing ResourceTypes
     */
    constructor() {
        super();
        
        this.get("/ResourceTypes", async (req, res) => {
            try {
                res.send(await new SCIMMY.Resources.ResourceType(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
        
        this.get("/ResourceTypes/:id", async (req, res) => {
            try {
                res.send(await new SCIMMY.Resources.ResourceType(req.params.id, req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
    }
}