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
        'views/resourceAppView',
        'text!templates/aws/vpc/awsNetworkAclAppTemplate.html',
        '/js/aws/models/vpc/awsNetworkAcl.js',
        '/js/aws/collections/vpc/awsNetworkAcls.js',
        '/js/aws/views/vpc/awsNetworkAclCreateView.js',
        'icanhaz',
        'common',
        'jquery.dataTables'
], function( $, _, Backbone, AppView, awsNetworkAclAppTemplate, NetworkAcl, networkAcls, AwsNetworkAclCreateView, ich, Common ) {
	'use strict';

	// Aws Application View
	// ------------------------------

    /**
     * Aws AppView is UI view list of cloud items.
     *
     * @name AppView
     * @constructor
     * @category Resources
     * @param {Object} initialization object.
     * @returns {Object} Returns an AwsAppView instance.
     */
	var AwsNetworkAclsAppView = AppView.extend({
	    template: _.template(awsNetworkAclAppTemplate),
	    
        modelStringIdentifier: "networkAclId",
                
        model: NetworkAcl,
        
        idColumnNumber: 0,
        
        columns: ["networkAclId","vpcId", "default"],
        
        collection: networkAcls,
        
        type: "vpc",
        
        subtype: "networkAcls",
        
        CreateView: AwsNetworkAclCreateView,
                
        events: {
            'click .create_button': 'createNew',
            'click #resource_table tr': 'toggleActions'
        },

        initialize: function() {
            this.render();
            $(".action_menu").on( "menuselect", this.setAction );
        },
        
        setAction: function(e, ui) {
            console.log(e, ui);
            console.log("PERFORMING ACTION");
            return false
        },
        
        toggleActions: function(e) {
            this.clickOne(e);
            
            $(".display_table").dataTable({
               "bPaginate": false,
               "bSortable": false,
               "bFilter": false,
               "bInfo": false,
               "bLengthChange": false,
               "bJQueryUI": true
            });
            
            var rowData = $(e.currentTarget).data();
            $.each(rowData.entrySet, function(index, entry) {
                var selector = (entry.egress === "true") ? "#outbound_table" : "#inbound_table";
                var portRange = entry.portRange ? (entry.portRange.from + "-" + entry.portRange.to) : "ALL";                 
                $(selector).dataTable().fnAddData([
                    entry.ruleNumber,
                    portRange,
                    entry.protocol,
                    entry.cidrBlock,
                    entry.ruleAction.toUpperCase()
                ]);
            });
        }
	});
    
	return AwsNetworkAclsAppView;
});