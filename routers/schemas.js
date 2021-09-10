import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class Schemas extends Router {
    constructor() {
        super();
    
        this.get("/Schemas", async (req, res) => {
            try {
                res.setHeader("Content-Type", "application/scim+json");
                res.send(await new SCIM.Resources.Schema(req.query).read());
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).setHeader("Content-Type", "application/json");
                    res.send({...ex, status: "error", message: ex.message});
                }
            }
        });
    
        this.get("/Schemas/:id", async (req, res) => {
            try {
                res.setHeader("Content-Type", "application/scim+json");
                res.send(await new SCIM.Resources.Schema(req.params.id, req.query).read());
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).setHeader("Content-Type", "application/json");
                    res.send({...ex, status: "error", message: ex.message});
                }
            }
        });
    }
}