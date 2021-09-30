import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class ResourceTypes extends Router {
    constructor() {
        super();
        
        this.get("/ResourceTypes", async (req, res) => {
            try {
                res.send(await new SCIM.Resources.ResourceType(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.get("/ResourceTypes/:id", async (req, res) => {
            try {
                res.send(await new SCIM.Resources.ResourceType(req.params.id, req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
    }
}