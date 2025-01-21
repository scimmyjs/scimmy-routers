import sinon from "sinon";
import request from "supertest";
import {Resource, SCIMError} from "scimmy/types";
import {ListResponse} from "scimmy/messages";
import {withStubs} from "../hooks/middleware.js";
import {expectContentType, expectListResponse, expectNotFound, expectInternalServerError} from "../hooks/responses.js";
import {Resources} from "#@/routers/resources.js";
import Search from "./search.js";

const suite = (app, Resource, endpoint = "") => {
    const sandbox = sinon.createSandbox();
    
    afterEach(() => sandbox.restore());
    
    context(`ROUTE ${endpoint}/.search`, () => Search(app, [Resource], endpoint));
    
    specify(`GET ${endpoint || "/"}`, async () => {
        sandbox.stub(Resource.prototype, "read").onFirstCall().returns(new ListResponse()).throws();
        await expectListResponse(request(app).get(`${endpoint || "/"}`), []);
        await expectInternalServerError(request(app).get(`${endpoint || "/"}`));
    });
    
    specify(`GET ${endpoint || "/"}?filter`, async () => {
        sandbox.stub(Resource.prototype, "read").returns(new ListResponse());
        await expectListResponse(request(app).get(`${endpoint || "/"}`).query({filter: "id pr"}), []);
    });
    
    specify(`GET ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "read").onFirstCall().returns({}).onSecondCall().throws(new SCIMError(404, null, "Resource test not found"));
        await expectContentType(request(app).get(`${endpoint}/1`)).expect(200, {});
        await expectNotFound(request(app).get(`${endpoint}/test`), "Resource test not found");
    });
    
    specify(`PUT ${endpoint || "/"}`, () => expectNotFound(request(app).put(`${endpoint || "/"}`)));
    specify(`PUT ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "write").onFirstCall().returns({}).throws();
        await expectContentType(request(app).put(`${endpoint}/test`).send({})).expect(200, {});
        await expectInternalServerError(request(app).put(`${endpoint}/test`).send({}));
    });
    
    specify(`POST ${endpoint}/:id`, () => expectNotFound(request(app).post(`${endpoint}/test`)));
    specify(`POST ${endpoint || "/"}`, async () => {
        sandbox.stub(Resource.prototype, "write").onFirstCall().returns({}).throws();
        await expectContentType(request(app).post(`${endpoint || "/"}`).send({})).expect(201, {});
        await expectInternalServerError(request(app).post(`${endpoint || "/"}`).send({}));
    });
    
    
    specify(`PATCH ${endpoint || "/"}`, () => expectNotFound(request(app).patch(`${endpoint || "/"}`)));
    specify(`PATCH ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "patch").onFirstCall().returns({}).throws();
        await expectContentType(request(app).patch(`${endpoint}/test`).send({})).expect(200, {});
        await expectInternalServerError(request(app).patch(`${endpoint}/test`).send({}));
    });
    
    specify(`DELETE ${endpoint || "/"}`, () => expectNotFound(request(app).del(`${endpoint || "/"}`)));
    specify(`DELETE ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "dispose").onFirstCall().returns().throws();
        await request(app).del(`${endpoint}/test`).expect(204);
        await expectInternalServerError(request(app).del(`${endpoint}/test`));
    });
};

describe("Resources middleware", () => {
    class Test extends Resource {}
    
    suite(withStubs(new Resources(Test, () => {})), Test);
});

export default suite;