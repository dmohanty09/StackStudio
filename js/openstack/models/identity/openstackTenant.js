/*!
 * StackStudio 2.0.0-rc.1 <http://stackstudio.transcendcomputing.com>
 * (c) 2012 Transcend Computing <http://www.transcendcomputing.com/>
 * Available under ASL2 license <http://www.apache.org/licenses/LICENSE-2.0.html>
 */
/*jshint smarttabs:true */
/*global define:true console:true */
define([
        'jquery',
        'backbone',
        'common'
], function( $, Backbone, Common) {
    'use strict';

    // Base Tenant Model
    // ----------

    /**
     *
     * @name Tenant
     * @constructor
     * @category Identity
     * @param {Object} initialization object.
     * @returns {Object} Returns a Tenant instance.
     */
    var Tenant = Backbone.Model.extend({

        validate: function(attrs, options) {
            if(attrs.name === "" || attrs.name === undefined)
            {
                return this.validationError;
            }
        },
		
		create: function(credentialId, region) {
            var url = "?cred_id=" + credentialId + "&region=" + region;
            this.sendPostAction(url, {tenant: this.attributes});
        },
        
        destroy: function(credentialId, region) {
            var url = "?_method=DELETE&cred_id=" + credentialId + "&region=" + region;
            this.sendPostAction(url);
        },

        removeUser: function(userId, trigger, credentialId, region) {
            var url = "/users/" + userId + "?_method=DELETE&cred_id=" + credentialId + "&region=" + region;
            this.sendPostAction(url, {}, trigger);
        },
		
		sendPostAction: function(url, options, trigger) {
            //Set default values for options and trigger if nothing is passed
            options = typeof options !== 'undefined' ? options : {};
            trigger = typeof trigger !== 'undefined' ? trigger : "tenantAppRefresh";

            $.ajax({
                url: this.url() + url,
                type: 'POST',
                contentType: 'application/x-www-form-urlencoded',
                dataType: 'json',
                data: JSON.stringify(options),
                success: function(data) {
                    Common.vent.trigger(trigger);
                },
                error: function(jqXHR) {
                    Common.errorDialog(jqXHR.statusText, jqXHR.responseText);
                }
            }); 
        }
    
    });

    return Tenant;
});