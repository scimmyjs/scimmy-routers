import {Router} from "express";
import {Search} from "./search.js";

/**
 * SCIMMY Resource Type Instance Endpoints Router
 */
export class Resources extends Router {
    /**
     * Construct an instance of an express router with endpoints for a given resource type instance
     * @param {typeof SCIMMY.Types.Resource} Resource - the resource type instance for which endpoints are being registered
     * @param {AuthenticationContext} [context] - method to invoke to evaluate context passed to SCIMMY handlers
     */
    constructor(Resource, context) {
        super({mergeParams: true});
        
        // Mount /.search endpoint for resource
        this.use(new Search(Resource, context));
        
        this.get("/", async (req, res, next) => {
            try {
                res.send(await new Resource(req.query).read(await context(req)));
            } catch (ex) {
                next(ex);
            }
        });
        
        this.get("/:id", async (req, res, next) => {
            try {
                res.send(await new Resource(req.params.id, req.query).read(await context(req)));
            } catch (ex) {
                next(ex);
            }
        });
        
        this.post("/", async (req, res, next) => {
            try {
                res.status(201).send(await new Resource(req.query).write(req.body, await context(req)));
            } catch (ex) {
                next(ex);
            }
        });
        
        this.put("/:id", async (req, res, next) => {
            try {
                res.send(await new Resource(req.params.id, req.query).write(req.body, await context(req)));
            } catch (ex) {
                next(ex);
            }
        });
        
        this.patch("/:id", async (req, res, next) => {
            try {
                const value = await new Resource(req.params.id, req.query).patch(req.body, await context(req));
                res.status(!!value ? 200 : 204).send(value);
            } catch (ex) {
                next(ex);
            }
        });
        
        this.delete("/:id", async (req, res, next) => {
            try {
                res.status(204).send(await new Resource(req.params.id).dispose(await context(req)));
            } catch (ex) {
                next(ex);
            }
        });
    }
}