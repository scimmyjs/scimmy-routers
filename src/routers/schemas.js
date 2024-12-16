import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Schemas Endpoints Router
 */
export class Schemas extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing Schemas
     */
    constructor() {
        super({mergeParams: true});
        
        this.get("/Schemas", async (req, res, next) => {
            try {
                res.send(await new SCIMMY.Resources.Schema(req.query).read());
            } catch (ex) {
                next(ex);
            }
        });
        
        this.get("/Schemas/:id", async (req, res, next) => {
            try {
                res.send(await new SCIMMY.Resources.Schema(req.params.id, req.query).read());
            } catch (ex) {
                next(ex);
            }
        });
    }
}