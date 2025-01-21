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
        sandbox.stub(Resource.prototype, "read")
            .onFirstCall().throws()
            .returns(new ListResponse());
        
        await expectInternalServerError(request(app).get(`${endpoint || "/"}`));
        await expectListResponse(request(app).get(`${endpoint || "/"}`), []);
        await expectListResponse(request(app).get(`${endpoint || "/"}`).query({filter: "id pr"}), []);
    });
    
    specify(`GET ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "read")
            .onFirstCall().returns({test: true})
            .onSecondCall().throws(new SCIMError(404, null, "Resource test not found"))
            .throws();
        
        await expectContentType(request(app).get(`${endpoint}/1`)).expect(200, {test: true});
        await expectNotFound(request(app).get(`${endpoint}/test`), "Resource test not found");
        await expectInternalServerError(request(app).get(`${endpoint}/test`));
    });
    
    specify(`PUT ${endpoint || "/"}`, () => expectNotFound(request(app).put(`${endpoint || "/"}`)));
    specify(`PUT ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "write")
            .onFirstCall().returns({test: true})
            .throws();
        
        await expectContentType(request(app).put(`${endpoint}/test`).send({test: true})).expect(200, {test: true});
        await expectInternalServerError(request(app).put(`${endpoint}/test`).send({}));
    });
    
    specify(`POST ${endpoint}/:id`, () => expectNotFound(request(app).post(`${endpoint}/test`)));
    specify(`POST ${endpoint || "/"}`, async () => {
        sandbox.stub(Resource.prototype, "write")
            .onFirstCall().returns({test: true})
            .throws();
        
        await expectContentType(request(app).post(`${endpoint || "/"}`).send({test: true})).expect(201, {test: true});
        await expectInternalServerError(request(app).post(`${endpoint || "/"}`).send({}));
    });
    
    
    specify(`PATCH ${endpoint || "/"}`, () => expectNotFound(request(app).patch(`${endpoint || "/"}`)));
    specify(`PATCH ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "patch")
            .onFirstCall().returns()
            .onSecondCall().returns({test: true})
            .throws();
        
        await request(app).patch(`${endpoint}/test`).expect(204);
        await expectContentType(request(app).patch(`${endpoint}/test`).send({})).expect(200, {test: true});
        await expectInternalServerError(request(app).patch(`${endpoint}/test`).send({}));
    });
    
    specify(`DELETE ${endpoint || "/"}`, () => expectNotFound(request(app).del(`${endpoint || "/"}`)));
    specify(`DELETE ${endpoint}/:id`, async () => {
        sandbox.stub(Resource.prototype, "dispose")
            .onFirstCall().returns()
            .throws();
        
        await request(app).del(`${endpoint}/test`).expect(204);
        await expectInternalServerError(request(app).del(`${endpoint}/test`));
    });
};

describe("Resources middleware", () => {
    class Test extends Resource {}
    
    suite(withStubs(new Resources(Test, () => {})), Test);
});

export default suite;