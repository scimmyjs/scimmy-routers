import express, {Router} from "express";
import SCIMMY from "scimmy";
import {Resources} from "./routers/resources.js";
import {Schemas} from "./routers/schemas.js";
import {ResourceTypes} from "./routers/resourcetypes.js";
import {ServiceProviderConfig} from "./routers/spconfig.js";
import {Me} from "./routers/me.js";

// Re-export SCIMMY for consumption by dependent packages
export {SCIMMY};

// Predefined SCIM Service Provider Config authentication scheme types
const authSchemeTypes = {
    oauth: {
        type: "oauth2",
        name: "OAuth 2.0 Authorization Framework",
        description: "Authentication scheme using the OAuth 2.0 Authorization Framework Standard",
        specUri: "https://datatracker.ietf.org/doc/html/rfc6749"
    },
    bearer: {
        type: "oauthbearertoken",
        name: "OAuth Bearer Token",
        description: "Authentication scheme using the OAuth Bearer Token Standard",
        specUri: "https://datatracker.ietf.org/doc/html/rfc6750"
    },
    basic: {
        type: "httpbasic",
        name: "HTTP Basic",
        description: "Authentication scheme using the HTTP Basic Standard",
        specUri: "https://datatracker.ietf.org/doc/html/rfc2617"
    },
    digest: {
        type: "httpdigest",
        name: "HTTP Digest",
        description: "Authentication scheme using the HTTP Digest Standard",
        specUri: "https://datatracker.ietf.org/doc/html/rfc2617"
    }
};

/**
 * SCIMMY HTTP Routers Class
 * @class SCIMMYRouters
 */
export default class SCIMMYRouters extends Router {
    /**
     * Construct a new instance of SCIMRouters, validate authentication scheme, and set SCIM Service Provider Configuration
     * @param {Object} authScheme - details of the means of authenticating SCIM requests
     * @param {String} authScheme.type - SCIM service provider authentication scheme type
     * @param {Function} authScheme.handler - method to invoke to authenticate SCIM requests
     * @param {String} [authScheme.docUri] - URL to use as documentation URI for service provider authentication scheme
     */
    constructor(authScheme = {}) {
        let {type, docUri, handler} = authScheme;
        
        super();
        
        // Make sure supplied authentication scheme is valid
        if (type === undefined)
            throw new TypeError("Missing required parameter 'type' from authentication scheme in SCIMRouters constructor");
        if (handler === undefined)
            throw new TypeError("Missing required parameter 'handler' from authentication scheme in SCIMRouters constructor");
        if (typeof handler !== "function")
            throw new TypeError("Parameter 'handler' must be of type 'function' for authentication scheme in SCIMRouters constructor")
        if (authSchemeTypes[type] === undefined)
            throw new TypeError(`Unknown authentication scheme type '${type}' in SCIMRouters constructor`);
        
        // Register the authentication scheme, and other SCIM Service Provider Config options
        SCIMMY.Config.set({
            patch: true, filter: true, sort: true,
            authenticationSchemes: [{...authSchemeTypes[type], documentationUri: docUri}]
        });
        
        // Make sure SCIM JSON is decoded in request body
        this.use(express.json({type: "application/scim+json", limit: "10mb"}));
        
        // Listen for first request to determine basepath for all resource types
        this.use("/", (req, res, next) => {
            res.setHeader("Content-Type", "application/scim+json");
            SCIMMY.Resources.Schema.basepath(req.baseUrl);
            SCIMMY.Resources.ResourceType.basepath(req.baseUrl);
            SCIMMY.Resources.ServiceProviderConfig.basepath(req.baseUrl);
            for (let Resource of Object.values(SCIMMY.Resources.declared()))
                Resource.basepath(req.baseUrl);
            
            next();
        });
        
        // Make sure requests are authenticated using supplied auth handler method
        this.use(async (req, res, next) => {
            try {
                // Run the handler
                await handler(req);
                next();
            } catch (ex) {
                // Wrap exceptions in unauthorized message
                res.status(401).send(new SCIMMY.Messages.Error({status: 401, message: ex.message}));
            }
        });
        
        // Register core service provider endpoints
        this.use(new Schemas());
        this.use(new ResourceTypes());
        this.use(new ServiceProviderConfig());
        this.use(new Me(handler));
        
        // Register endpoints for any declared resource types
        for (let Resource of Object.values(SCIMMY.Resources.declared())) {
            this.use(Resource.endpoint, new Resources(Resource));
        }
    }
}