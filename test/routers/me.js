import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectNotImplemented} from "../hooks/responses.js";
import {Me} from "#@/routers/me.js";

const suite = (app) => {
    const sandbox = sinon.createSandbox();
    
    afterEach(() => sandbox.restore());
    
    specify("GET /Me", async () => {
        sandbox.stub(SCIMMY.Resources.User.prototype, "read")
            .onFirstCall().returns({meta: {location: "/path"}})
            .onSecondCall().returns({})
            .callThrough();
        
        await expectContentType(request(app).get("/Me")).expect(200, {meta: {location: "/path"}});
        await expectNotImplemented(request(app).get("/Me"));
        await expectNotImplemented(request(app).get("/Me"), "Method 'egress' not implemented by resource 'User'");
    });
    
    specify("GET /Me/:id", () => expectNotImplemented(request(app).get("/Me/test")));
    specify("PUT /Me", () => expectNotImplemented(request(app).put("/Me")));
    specify("POST /Me", () => expectNotImplemented(request(app).post("/Me")));
    specify("PATCH /Me", () => expectNotImplemented(request(app).patch("/Me")));
    specify("DELETE /Me", () => expectNotImplemented(request(app).del("/Me")));
};

describe("Me middleware", () => {
    const sandbox = sinon.createSandbox();
    
    beforeEach(() => sandbox.stub(SCIMMY.Resources, "declared").returns(true));
    afterEach(() => sandbox.restore());
    
    suite(withStubs(new Me(() => "1", () => {})));
});

export default suite;