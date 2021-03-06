/*!
 * StackStudio 2.0.0-rc.1 <http://stackstudio.transcendcomputing.com>
 * (c) 2012 Transcend Computing <http://www.transcendcomputing.com/>
 * Available under ASL2 license <http://www.apache.org/licenses/LICENSE-2.0.html>
 */
/*jshint smarttabs:true */
/*global define:true console:true */
define([
        'jquery',
        'underscore',
        'backbone',
        'views/dialogView',
        'text!templates/aws/vpc/awsNetworkAclCreateTemplate.html',
        '/js/aws/models/vpc/awsNetworkAcl.js',
        'icanhaz',
        'common',
        'jquery.multiselect',
        'jquery.multiselect.filter'
        
], function( $, _, Backbone, DialogView, networkAclCreateTemplate, NetworkAcl, ich, Common ) {
			
    /**
     * NetworkAclCreateView is UI form to create compute.
     *
     * @name NetworkAclCreateView
     * @constructor
     * @category NetworkAcl
     * @param {Object} initialization object.
     * @returns {Object} Returns a NetworkAclCreateView instance.
     */
	
	var NetworkAclCreateView = DialogView.extend({
		
		template: _.template(networkAclCreateTemplate),
		// Delegated events for creating new instances, etc.
		events: {
			"dialogclose": "close"
		},

		initialize: function() {
			//TODO
		},

		render: function() {
			var createView = this;
            this.$el.html(this.template);

            this.$el.dialog({
                autoOpen: true,
                title: "Create Network ACL",
                width:500,
                minHeight: 150,
                resizable: false,
                modal: true,
                buttons: {
                    Create: function () {
                        createView.create();
                    },
                    Cancel: function() {
                        createView.cancel();
                    }
                }
            });
           
            return this;
		},
		
		create: function() {
			//Validate and create
			this.$el.dialog('close');
		}

	});
    
	return NetworkAclCreateView;
});
