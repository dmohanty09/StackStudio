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
        'models/project',
        'common'
], function( $, Backbone, Project, Common ) {
	'use strict';

	// Project Collection
	// ---------------

	var ProjectList = Backbone.Collection.extend({

		// Reference to this collection's model.
		model: Project,

		url: 'samples/projects.json'
		
        /*
		// Filter down the list of all projects that are running.
		running: function() {
			return this.filter(function( project ) {
				return project.get('running');
			});
		}
		*/
	});

	// Create our global collection of **Projects**.
	return new ProjectList();

});