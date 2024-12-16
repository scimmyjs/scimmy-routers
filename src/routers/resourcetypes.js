import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY ResourceTypes Endpoints Router
 */
export class ResourceTypes extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing ResourceTypes
     */
    constructor() {
        super({mergeParams: true});
        
        this.get("/ResourceTypes", async (req, res, next) => {
            try {
                res.send(await new SCIMMY.Resources.ResourceType(req.query).read());
            } catch (ex) {
                next(ex);
            }
        });
        
        this.get("/ResourceTypes/:id", async (req, res, next) => {
            try {
                res.send(await new SCIMMY.Resources.ResourceType(req.params.id, req.query).read());
            } catch (ex) {
                next(ex);
            }
        });
    }
}