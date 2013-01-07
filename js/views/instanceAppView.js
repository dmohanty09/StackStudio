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
        'text!templates/resources/instancesTemplate.html',
        'models/instance',
        'collections/instances',
        'views/instanceRowView',
        'icanhaz',
        'common',
        'jquery.dataTables'
], function( $, _, Backbone, instancesTemplate, Instance, instances, InstanceView, ich, Common ) {
	'use strict';

	// The Instances Application View
	// ------------------------------

    /**
     * InstancesView is UI view list of cloud instances.
     *
     * @name InstancesView
     * @constructor
     * @category Resources
     * @param {Object} initialization object.
     * @returns {Object} Returns a InstancesView instance.
     */
	var InstancesView = Backbone.View.extend({

		/** The ID of the selected instance */
		selectedId: undefined,

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#resource_app',

		// Delegated events for creating new instances, etc.
		events: {
			'click #new_instance': 'createNew',
			'click #instance_table tbody': 'selectOne'
		},

		// At initialization we bind to the relevant events on the `Instances`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting instances.
		initialize: function() {
			var compiledTemplate = _.template(instancesTemplate);
            this.$el.html(compiledTemplate);
            ich.refresh();
            _.bindAll(this, 'selectOne');
			$('#new_instance').button();
			$('#id_refresh').button();
            this.$table = $('#instance_table').dataTable({"bJQueryUI": true});
			instances.on( 'add', this.addOne, this );
			instances.on( 'reset', this.addAll, this );
			instances.on( 'all', this.render, this );

			// Fetch will pull results from the server
			instances.fetch();
		},

		// No rendering to do, presently; the elements are already on the page.
		render: function() {
		},

		// Add a single instance item to the list by creating a view for it.
		addOne: function( instance ) {
			if (instance.get('instanceId') === "") {
				// Refuse to add instances until they're initialized.
				return;
			}
			var view = new InstanceView({ model: instance });
			view.render();
		},

		// Add all items in the **Instances** collection at once.
		addAll: function() {
			instances.each(this.addOne, this);
		},

		createNew : function () {
			this.$detail.html(ich.instance_form(
				new Instance().attributes
			));
			$('#id_save_new').button();
		},

		selectOne : function (event, id) {
			var i, instance, selectedModel;
			console.log("Id2:", id);
			console.log("event:", event);
			if (id && this.selectedId === id) {
				return;
			}
			this.$table.$('tr').removeClass('row_selected');
			if (event.type === 'click') {
				$(event.target.parentNode).addClass('row_selected');
				// Find the second column of the clicked row; that's instance ID
				instance = $(event.target.parentNode).find(':nth-child(2)').html();
				Common.router.navigate("#resources/instances/"+instance, {trigger: false});
			} else {
				instance = id;
				console.log("Selecting ID:", id);
			}
			instances.each(function(e) {
				if (e.get('instanceId') === instance) {
					selectedModel = e;
				}
			});
			this.selectedId = instance;
			$('#details').html(ich.instance_detail(selectedModel.attributes));
		}
	});

	var instancesView;
	
    Common.router.on('route:resources', function () {
        if (!instancesView) {
            instancesView = new InstancesView();
        }
        console.log("Got resource route.");
    }, this);
    
    Common.router.on('route:instances', function () {
        if (!instancesView) {
            instancesView = new InstancesView();
        }
        console.log("Got resource instance route.");
    }, this);
    
    Common.router.on('route:instanceDetail', function (id) {
        if (!instancesView) {
            instancesView = new InstancesView();
        }
        console.log("Got resource instance detail " + id + " route.");
    }, this);

	return InstancesView;
});