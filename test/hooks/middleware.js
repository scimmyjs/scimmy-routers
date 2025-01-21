import express from "express";
import {ErrorResponse} from "scimmy/messages";

export const withStubs = (router) => express()
    .set("env", "test")
    .use(express.json({type: ["application/scim+json", "application/json"]}))
    .use((req, res, next) => {
        res.setHeader("Content-Type", "application/scim+json");
        next();
    })
    .use(router)
    .use((req, res) => {
        res.status(404).send(new ErrorResponse({status: 404, message: "Endpoint Not Found"}));
    })
    .use((ex, req, res, next) => {
        res.status(ex.status ?? 500).send(new ErrorResponse(ex));
        if ((ex.status ?? 500) >= 500) next(ex);
    });