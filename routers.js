import {Router} from "express";
import {Users} from "./routers/resources.js";
import {Groups} from "./routers/groups.js";
import {Schemas} from "./routers/schemas.js";
import {ResourceTypes} from "./routers/resourcetypes.js";
import * as SCIM from "../scim/scim.js";

export class SCIMRouters extends Router {
    constructor(authenticated = ((req, res, next) => next())) {
        super();
        
        this.use("/", (req, res, next) => {
            res.setHeader("Content-Type", "application/scim+json");
            SCIM.Resources.User.basepath(req.baseUrl);
            SCIM.Resources.Group.basepath(req.baseUrl);
            SCIM.Resources.Schema.basepath(req.baseUrl);
            SCIM.Resources.ResourceType.basepath(req.baseUrl);
            next();
        });
        
        this.use(async (req, res, next) => await authenticated(req, res, next));
        this.use(new Users());
        this.use(new Groups());
        this.use(new Schemas());
        this.use(new ResourceTypes());
    }
}