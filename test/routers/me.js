import sinon from "sinon";
import request from "supertest";
import SCIMMY from "scimmy";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectNotFound, expectNotImplemented} from "../hooks/responses.js";
import {Me} from "#@/routers/me.js";

const suite = (app) => {
    const sandbox = sinon.createSandbox();
    
    afterEach(() => sandbox.restore());
    
    specify("GET /Me", async () => {
        sandbox.stub(SCIMMY.Resources.User.prototype, "read")
            .onFirstCall().returns({meta: {location: "/path"}})
            .onSecondCall().returns({})
            .callThrough();
        
        const stub = sandbox.stub(SCIMMY.Resources, "declared").returns(true);
        await expectContentType(request(app).get("/Me")).expect(200, {meta: {location: "/path"}});
        await expectNotImplemented(request(app).get("/Me"));
        await expectNotImplemented(request(app).get("/Me"), "Method 'egress' not implemented by resource 'User'");
        
        stub.returns(false);
        await expectNotImplemented(request(app).get("/Me"));
        await expectNotImplemented(request(app).get("/Me"));
    });
    
    specify("GET /Me/:id", () => expectNotFound(request(app).get("/Me/test")));
    specify("PUT /Me", () => expectNotImplemented(request(app).put("/Me")));
    specify("POST /Me", () => expectNotImplemented(request(app).post("/Me")));
    specify("PATCH /Me", () => expectNotImplemented(request(app).patch("/Me")));
    specify("DELETE /Me", () => expectNotImplemented(request(app).del("/Me")));
};

describe("Me middleware", () => {
    const handler = sinon.stub()
        .onCall(0).returns("1")
        .onCall(1).returns("2")
        .onCall(2).returns("3")
        .onCall(3).returns("4")
        .returns(false);
    
    suite(withStubs(new Me(handler, () => {})));
});

export default suite;