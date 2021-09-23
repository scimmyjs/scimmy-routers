import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class ServiceProviderConfig extends Router {
    constructor() {
        super();
        
        this.get("/ServiceProviderConfig", async (req, res) => {
            try {
                res.send(await new SCIM.Resources.ServiceProviderConfig(req.query).read());
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                }
            }
        });
    }
}