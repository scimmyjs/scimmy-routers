import {Router} from "express";
import * as SCIM from "../../scim/scim.js";

export class Resources extends Router {
    constructor(Resource) {
        super();
        
        this.get("/", async (req, res) => {
            try {
                res.send(await new Resource(req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.get(`/:id`, async (req, res) => {
            try {
                res.send(await new Resource(req.params.id, req.query).read());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.post("/", async (req, res) => {
            try {
                res.status(201).send(await new Resource(req.query).write(req.body));
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.put("/:id", async (req, res) => {
            try {
                res.send(await new Resource(req.params.id, req.query).write(req.body));
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.patch("/:id", async (req, res) => {
            try {
                let value = await new Resource(req.params.id, req.query).patch(req.body);
                res.status(!!value ? 200 : 204).send(value);
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
        
        this.delete("/:id", async (req, res) => {
            try {
                res.status(204).send(await new Resource(req.params.id).dispose());
            } catch (ex) {
                res.status(ex.status ?? 500).send(new SCIM.Messages.Error(ex));
            }
        });
    }
}