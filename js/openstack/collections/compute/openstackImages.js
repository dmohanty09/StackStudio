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
        '/js/openstack/models/compute/openstackImage.js',
        'common'
], function( $, Backbone, Image, Common ) {
    'use strict';

    // Image Collection
    // ---------------

    var ImageList = Backbone.Collection.extend({

        // Reference to this collection's model.
        model: Image,

        url: 'samples/openstackImages.json'
    });
    
    return ImageList;

});