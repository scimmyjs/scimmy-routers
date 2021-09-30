import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class Schemas extends Router {
    constructor() {
        super();
        
        this.get("/Schemas", async (req, res) => {
            try {
                res.send(await new SCIM.Resources.Schema(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.get("/Schemas/:id", async (req, res) => {
            try {
                res.send(await new SCIM.Resources.Schema(req.params.id, req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
    }
}