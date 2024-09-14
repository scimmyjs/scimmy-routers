import express from "express";

declare module "scimmy-routers" {
    export interface SCIMMYRouters extends express.Router {}
}