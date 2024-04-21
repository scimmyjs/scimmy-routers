import express, {Router} from "express";
import SCIMMY from "scimmy";
import {Resources} from "./routers/resources.js";
import {Schemas} from "./routers/schemas.js";
import {ResourceTypes} from "./routers/resourcetypes.js";
import {ServiceProviderConfig} from "./routers/spconfig.js";
import {Search} from "./routers/search.js";
import {Bulk} from "./routers/bulk.js";
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
 * Method invoked to authenticate a SCIM request
 * @callback AuthenticationHandler
 * @param {express.Request} req - the express request to be authenticated
 * @returns {String|Promise<String>} the ID of the currently authenticated user, to be consumed by the /Me endpoint
 * @private
 */

/**
 * Method invoked to provide authentication context to a SCIM request
 * @callback AuthenticationContext
 * @param {express.Request} req - the express request to provide authentication context for
 * @returns {*|Promise<*>} Any information to pass through to a Resource's handler methods
 * @private
 */

/**
 * SCIMMY HTTP Routers Class
 * @class SCIMMYRouters
 */
export default class SCIMMYRouters extends Router {
    /**
     * Construct a new instance of SCIMMYRouters, validate authentication scheme, and set SCIM Service Provider Configuration
     * @param {Object} authScheme - details of the means of authenticating SCIM requests
     * @param {String} authScheme.type - SCIM service provider authentication scheme type
     * @param {AuthenticationHandler} authScheme.handler - method to invoke to authenticate SCIM requests
     * @param {AuthenticationContext} [authScheme.context] - method to invoke to evaluate context passed to SCIMMY handlers
     * @param {String} [authScheme.docUri] - URL to use as documentation URI for service provider authentication scheme
     */
    constructor(authScheme = {}) {
        const {type, docUri, handler, context = (() => {})} = authScheme;
        
        super({mergeParams: true});
        
        // Make sure supplied authentication scheme is valid
        if (type === undefined)
            throw new TypeError("Missing required parameter 'type' from authentication scheme in SCIMRouters constructor");
        if (handler === undefined)
            throw new TypeError("Missing required parameter 'handler' from authentication scheme in SCIMRouters constructor");
        if (typeof handler !== "function")
            throw new TypeError("Parameter 'handler' must be of type 'function' for authentication scheme in SCIMRouters constructor");
        if (authSchemeTypes[type] === undefined)
            throw new TypeError(`Unknown authentication scheme type '${type}' in SCIMRouters constructor`);
        if (typeof context !== "function")
            throw new TypeError("Parameter 'context' must be of type 'function' for authentication scheme in SCIMRouters constructor");
        
        // Register the authentication scheme, and other SCIM Service Provider Config options
        SCIMMY.Config.set({
            patch: true, filter: true, sort: true, bulk: true,
            authenticationSchemes: [{...authSchemeTypes[type], documentationUri: docUri}]
        });
        
        // Make sure SCIM JSON is decoded in request body
        this.use(express.json({type: "application/scim+json", limit: SCIMMY.Config.get()?.bulk?.maxPayloadSize ?? "1mb"}));
        
        // Listen for incoming requests to determine basepath for all resource types
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
        
        // Cast pagination query parameters from strings to numbers...
        this.use(({query}, res, next) => {
            for (let param of ["startIndex", "count"]) {
                // ...but only if they were defined, were strings, and are valid as numbers
                if (!!query[param] && typeof query[param] === "string" && !Number.isNaN(+query[param])) {
                    query[param] = +query[param];
                }
            }
            
            next();
        });
        
        // Register core service provider endpoints
        this.use(new Schemas());
        this.use(new ResourceTypes());
        this.use(new ServiceProviderConfig());
        this.use(new Search(context));
        this.use(new Bulk(context));
        this.use(new Me(handler, context));
        
        // Register endpoints for any declared resource types
        for (let Resource of Object.values(SCIMMY.Resources.declared())) {
            this.use(Resource.endpoint, new Resources(Resource, context));
        }
        
        // If we get to this point, there's no matching endpoints
        this.use((req, res) => res.status(404).send());
    }
}