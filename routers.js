import {Router} from "express";
import {Users} from "./routers/users.js";

export class SCIMRouters extends Router {
    constructor(authenticated = ((req, res, next) => next())) {
        super();
        
        this.use(async (req, res, next) => await authenticated(req, res, next));
        this.use(new Users());
    }
}