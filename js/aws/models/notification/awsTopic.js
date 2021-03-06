/*!
 * StackStudio 2.0.0-rc.1 <http://stackstudio.transcendcomputing.com>
 * (c) 2012 Transcend Computing <http://www.transcendcomputing.com/>
 * Available under ASL2 license <http://www.apache.org/licenses/LICENSE-2.0.html>
 */
/*jshint smarttabs:true */
/*global define:true console:true */
define([
        'models/resource/resourceModel',
        'common'
], function( ResourceModel, Common ) {
    'use strict';

    var Topic = ResourceModel.extend({

        defaults: {
            id: '',
            Name: '',
            DisplayName: '',
            Owner: '',
            SubscriptionsPending: 0,
            SubscriptionsConfirmed: 0,
            SubscriptionsDeleted: 0,
            EffectiveDeliveryPolicy: '',
            Policy: '',
            TopicArn: ''
        },

        create: function(options, credentialId, region, eventString) {
            var url = Common.apiUrl + "/stackstudio/v1/cloud_management/aws/notification/topics?cred_id=" + credentialId + "&region=" + region;
            var eventName = eventString ? eventString : "topicAppRefresh";
            this.sendAjaxAction(url, "POST", {"topic": options}, eventName);
        },

        publish: function(options, credentialId, region) {
            var url = Common.apiUrl + "/stackstudio/v1/cloud_management/aws/notification/topics/"+ this.attributes.id +"/publish?cred_id=" + credentialId + "&region=" + region;
            this.sendAjaxAction(url, "POST", {"publish": options}, "");
        },

        editDisplayName: function(options, credentialId, region) {
            var url = Common.apiUrl + "/stackstudio/v1/cloud_management/aws/notification/topics/"+ this.attributes.id +"/set_attribute?cred_id=" + credentialId + "&region=" + region;
            this.sendAjaxAction(url, "POST", {"attribute": options}, "topicAppRefresh");
        },

        destroy: function(credentialId, region) {
            var url = Common.apiUrl + "/stackstudio/v1/cloud_management/aws/notification/topics/" + this.attributes.id + "?_method=DELETE&cred_id=" + credentialId + "&region=" + region;
            this.sendAjaxAction(url, "POST", undefined, "topicAppRefresh");
        }
    });

    return Topic;
});
