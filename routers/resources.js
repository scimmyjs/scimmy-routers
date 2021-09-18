import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class Resources extends Router {
    constructor(Resource) {
        super();
        
        this.get("/", async (req, res) => {
            try {
                res.send(await new Resource(req.query).read());
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                }
            }
        });
        
        this.get(`/:id`, async (req, res) => {
            try {
                res.send(await new Resource(req.params.id, req.query).read());
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                }
            }
        });
        
        this.post("/", async (req, res) => {
            try {
                res.status(201).send(await new Resource(req.query).write(req.body));
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                }
            }
        });
        
        this.put("/:id", async (req, res) => {
            try {
                res.send(await new Resource(req.params.id, req.query).write(req.body));
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                }
            }
        });
        
        this.patch("/:id", async (req, res) => {
            try {
                let value = await new Resource(req.params.id, req.query).patch(req.body);
                res.status(!!value ? 200 : 204).send(value);
            } catch (ex) {
                if (ex instanceof SCIM.Types.Error) {
                    res.status(ex.status).send(new SCIM.Messages.Error(ex.status, ex.scimType, ex.message));
                } else {
                    res.status(500).send(new SCIM.Messages.Error(500, null, ex.message));
                }
            }
        });
        
        this.delete("/:id", async (req, res) => {
            try {
                res.status(204).send(await new Resource(req.params.id).dispose());
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