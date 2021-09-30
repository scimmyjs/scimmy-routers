import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY Schemas Endpoints Router
 * @class SCIMMYRouters.Schemas
 */
export class Schemas extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing Schemas
     */
    constructor() {
        super();
        
        this.get("/Schemas", async (req, res) => {
            try {
                res.send(await new SCIMMY.Resources.Schema(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
        
        this.get("/Schemas/:id", async (req, res) => {
            try {
                res.send(await new SCIMMY.Resources.Schema(req.params.id, req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
    }
}