import {Router} from "express";
import SCIMMY from "scimmy";

/**
 * SCIMMY ServiceProviderConfig Endpoints Router
 * @class SCIMMYRouters.ServiceProviderConfig
 */
export class ServiceProviderConfig extends Router {
    /**
     * Construct an instance of an express router with endpoints for accessing ServiceProviderConfig
     */
    constructor() {
        super({mergeParams: true});
        
        this.get("/ServiceProviderConfig", async (req, res) => {
            try {
                res.send(await new SCIMMY.Resources.ServiceProviderConfig(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIMMY.Messages.Error(ex));
            }
        });
    }
}