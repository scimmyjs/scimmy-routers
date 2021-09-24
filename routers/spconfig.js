import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class ServiceProviderConfig extends Router {
    constructor() {
        super();
        
        this.get("/ServiceProviderConfig", async (req, res) => {
            try {
                res.send(await new SCIM.Resources.ServiceProviderConfig(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
    }
}