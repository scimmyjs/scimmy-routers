import sinon from "sinon";
import assert from "assert";
import request from "supertest";
import express from "express";
import SCIMMY from "scimmy";
import SCIMMYRouters from "#@/routers.js";
import {expectNotFound, expectInternalServerError} from "./hooks/responses.js";
import Resources from "./routers/resources.js";
import ServiceProviderConfig from "./routers/spconfig.js";
import ResourceTypes from "./routers/resourcetypes.js";
import Schemas from "./routers/schemas.js";
import Search from "./routers/search.js";
import Bulk from "./routers/bulk.js";
import Me from "./routers/me.js";

const ValidAuthScheme = {type: "bearer", handler: () => "test"};
const app = express().set("env", "test");

describe("SCIMMYRouters", () => {
    SCIMMY.Resources.declare(SCIMMY.Resources.Group, {}).declare(SCIMMY.Resources.User.extend(SCIMMY.Schemas.EnterpriseUser));
    
    before(() => app.use("/", new SCIMMYRouters(ValidAuthScheme)));
    
    describe("@constructor", () => {
        const sandbox = sinon.createSandbox();
        
        beforeEach(() => sandbox.stub(SCIMMY.Config, "set"));
        afterEach(() => sandbox.restore());
        
        it("should require arguments to be instantiated", () => assert.throws(() => new SCIMMYRouters(), {name: "TypeError"},
            "SCIMMYRouters class did not require arguments to be instantiated"));
        it("should require an authentication type", () => assert.throws(() => new SCIMMYRouters({}),
            {name: "TypeError", message: "Missing required parameter 'type' from authentication scheme in SCIMMYRouters constructor"},
            "SCIMMYRouters class did not require an authentication type to be instantiated"));
        it("should require an authentication handler method", () => {
            assert.throws(() => new SCIMMYRouters({type: ""}),
                {name: "TypeError", message: "Missing required parameter 'handler' from authentication scheme in SCIMMYRouters constructor"},
                "SCIMMYRouters class did not require an authentication handler to be instantiated");
            assert.throws(() => new SCIMMYRouters({...ValidAuthScheme, handler: ""}),
                {name: "TypeError", message: "Parameter 'handler' must be of type 'function' for authentication scheme in SCIMMYRouters constructor"},
                "SCIMMYRouters class did not require authentication handler to be a method to be instantiated");
        });
        
        it("should expect exceptions thrown in authentication handler method to be caught", async () => {
            await request(express().use(new SCIMMYRouters({...ValidAuthScheme, handler: () => {throw new Error("Not Logged In")}}))).get("/").expect(401, {
                schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
                status: "401", detail: "Not Logged In"
            });
        });
        
        it("should require a well-known authentication scheme type", () => {
            assert.throws(() => new SCIMMYRouters({...ValidAuthScheme, type: "test"}),
                {name: "TypeError", message: "Unknown authentication scheme type 'test' in SCIMMYRouters constructor"},
                "SCIMMYRouters class did not require a well-known authentication scheme type");
            
            try {
                new SCIMMYRouters({...ValidAuthScheme, handler: () => {}});
            } catch (ex) {
                assert.fail("SCIMMYRouters class did not instantiate with a valid well-known authentication scheme type");
            }
        });
        
        it("should require authentication context to be a method, if defined", () => {
            assert.throws(() => new SCIMMYRouters({...ValidAuthScheme, context: ""}),
                {name: "TypeError", message: "Parameter 'context' must be of type 'function' for authentication scheme in SCIMMYRouters constructor"},
                "SCIMMYRouters class did not require authentication context to be a method when defined");
            
            try {
                new SCIMMYRouters({...ValidAuthScheme, context: () => {}});
            } catch {
                assert.fail("SCIMMYRouters class did not instantiate with a valid authentication context method");
            }
        });
        
        it("should require authentication baseUri to be a method, if defined", () => {
            assert.throws(() => new SCIMMYRouters({...ValidAuthScheme, baseUri: ""}),
                {name: "TypeError", message: "Parameter 'baseUri' must be of type 'function' for authentication scheme in SCIMMYRouters constructor"},
                "SCIMMYRouters class did not require authentication baseUri to be a method when defined");
            
            try {
                new SCIMMYRouters({...ValidAuthScheme, baseUri: () => {}});
            } catch {
                assert.fail("SCIMMYRouters class did not instantiate with a valid authentication baseUri method");
            }
        });
        
        it("should expect authentication baseUri to return a string, if defined", async () => {
            const app = express().set("env", "test").use(new SCIMMYRouters({
                ...ValidAuthScheme, baseUri: sandbox.stub()
                    .onFirstCall().returns("https://www.example.com/scim")
                    .onSecondCall().returns(true)
                    .throws()
            }));
            
            await expectNotFound(request(app).get("/"));
            await expectInternalServerError(request(app).get("/"), "Method 'baseUri' must return a URL string in SCIMMYRouters constructor");
            await expectInternalServerError(request(app).get("/"));
        });
        
        it("should expect string value 'startIndex' and 'count' query parameters to be cast to integers", async () => {
            let intercepted;
            const app = express().use((req, res, next) => {
                intercepted = req;
                next();
            });
            
            await request(app.use(new SCIMMYRouters(ValidAuthScheme))).get("/").query({startIndex: "1", count: "2"});
            
            assert.strictEqual(typeof intercepted.query.startIndex, "number",
                "SCIMMYRouters middleware did not cast string value 'startIndex' query parameter to integer");
            assert.strictEqual(typeof intercepted.query.count, "number",
                "SCIMMYRouters middleware did not cast string value 'count' query parameter to integer");
        });
        
        it("should not expect 'maxPayloadSize' property of 'bulk' configuration to be defined", () => {
            sandbox.stub(SCIMMY.Config, "get").returns();
            
            try {
                new SCIMMYRouters(ValidAuthScheme);
            } catch {
                assert.fail("SCIMMYRouters class did not instantiate when 'maxPayloadSize' property of 'bulk' configuration was not defined");
            }
        });
    });
    
    describe("ROUTE /.search", () => Search(app, SCIMMY.Resources.declared()));
    describe("ROUTE /Schemas", () => Schemas(app, SCIMMY.Schemas.declared()));
    describe("ROUTE /ResourceTypes", () => ResourceTypes(app, SCIMMY.Resources.declared()));
    describe("ROUTE /ServiceProviderConfig", () => ServiceProviderConfig(app));
    describe("ROUTE /Bulk", () => Bulk(app));
    describe("ROUTE /Me", () => Me(app));
    
    for (let Resource of Object.values(SCIMMY.Resources.declared())) {
        describe(`ROUTE ${Resource.endpoint}`, () => Resources(app, Resource, Resource.endpoint));
    }
});