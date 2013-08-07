/*!
 * StackStudio 2.0.0-rc.1 <http://stackstudio.transcendcomputing.com>
 * (c) 2012 Transcend Computing <http://www.transcendcomputing.com/>
 * Available under ASL2 license <http://www.apache.org/licenses/LICENSE-2.0.html>
 */
/*jshint smarttabs:true */
/*global define:true console:true */
define([
    '/js/topstack/views/rds/topstackParametergroupsAppView.js',
    '/js/openstack/views/rds/openstackParameterGroupCreateView.js'
], function( TopStackParameterGroupAppView, OpenStackParameterGroupCreateView ) {
    'use strict';

    var OpenstackParameterGroupAppView = TopStackParameterGroupAppView.extend({
        
        CreateView: OpenStackParameterGroupCreateView

    });
    
    return OpenstackParameterGroupAppView;
});