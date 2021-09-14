import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class Groups extends Router {
    constructor() {
        super();
        
        if (SCIM.Resources.registered(SCIM.Resources.Group)) {
            this.get("/Groups", async (req, res) => {
                try {
                    res.send(await new SCIM.Resources.Group(req.query).read());
                } catch (ex) {
                    if (ex instanceof SCIM.Types.Error) {
                        res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                    } else {
                        res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                    }
                }
            });
            
            this.get("/Groups/:id", async (req, res) => {
                try {
                    res.send(await new SCIM.Resources.Group(req.params.id, req.query).read());
                } catch (ex) {
                    if (ex instanceof SCIM.Types.Error) {
                        res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                    } else {
                        res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                    }
                }
            });
            
            this.post("/Groups", async (req, res) => {
                try {
                    res.status(201).send(await new SCIM.Resources.Group(req.query).write(req.body));
                } catch (ex) {
                    if (ex instanceof SCIM.Types.Error) {
                        res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                    } else {
                        res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                    }
                }
            });
            
            this.put("/Groups/:id", async (req, res) => {
                try {
                    res.send(await new SCIM.Resources.Group(req.params.id, req.query).write(req.body));
                } catch (ex) {
                    if (ex instanceof SCIM.Types.Error) {
                        res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                    } else {
                        res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                    }
                }
            });
            
            this.delete("/Groups/:id", async (req, res) => {
                try {
                    res.status(204).send(await new SCIM.Resources.Group(req.params.id).dispose());
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
}