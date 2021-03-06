/*
TODO LIST:
- Add Enable/Disable for infra checkboxes
- Need a way to determine whether chef, puppet, or cloudFormation are configured before displaying
- Wire up deployment buttons (when services available)

- Add mechanism for ordering chef run-list

*/


/*!
 * StackStudio 2.0.0-rc.1 <http://stackstudio.transcendcomputing.com>
 * (c) 2012 Transcend Computing <http://www.transcendcomputing.com/>
 * Available under ASL2 license <http://www.apache.org/licenses/LICENSE-2.0.html>
 */
/*jshint smarttabs:true */
/*global define:true console:true requirejs:true require:true alert:true*/
define([
        'jquery',
        'underscore',
        'bootstrap',
        'backbone',
        'icanhaz',
        'common',
        'typeahead', // Not an AMD component!
        'text!templates/assemblies/configTreeTemplate.html',
        'collections/apps',
        'collections/cloudCredentials',
        'collections/cookbooks',
        'collections/chefEnvironments',
        'collections/puppetClasses',
        'collections/saltStates',
        'collections/ansibleJobTemplates',
        'views/assemblies/appListView',
        'views/assemblies/dockerConfigListView',
        'models/app',
        'jquery-plugins',
        'jquery-ui-plugins',
        'jquery.dataTables',
        'jquery.dataTables.fnProcessingIndicator',
        'jquery.sortable'
],function( $, _, bootstrap, Backbone, ich, Common, typeahead, appsTemplate, Apps,
    CloudCredentials, Cookbooks, ChefEnvironments, PuppetClasses, SaltStates,
    AnsibleJobTemplates, AppListView,
    DockerConfigListView,
    App ) {

    var ConfigListView = Backbone.View.extend({
        id: 'config_list',

        //className: [''],

        template: _.template(appsTemplate),

        cloudProvider: undefined,

        appsApp: undefined,

        subViews: [],

        events: {
            "typeahead:selected": "packageClick",
            "shown": "accordionShown",
            "change .recipes input": "recipeChangeHandler",
            "change .puppetClasses input": "classChangeHandler",
            "change .saltStates input" : "stateChangeHandler",
            "change .ansibleJobTemplates input" : "jobtemplateChangeHandler",
            "change #chef-selection .accordion-heading": "chefGroupChangeHandler",
            "change #puppet-selection .accordion-heading" : "puppetGroupChangeHandler",
            "change #salt-selection .accordion-heading" : "saltGroupChangeHandler",
            "change #ansible-selection .accordion-heading" : "ansibleGroupChangeHandler"
        },
        initialize: function(){
        },

        render: function () {
            $("#assemblyLeftNav").empty();
            $("#assemblyLeftNav").html(this.el);
            this.$el.html(this.template);


        },
        environmentSelectHandler: function(evt){
            var $this = this;
            this.populateCookbooks(this.credential).done(function(){
                $this.recalculateChefBadges();
            });
        },
        chefGroupChangeHandler: function(evt){
            this.chefGroupQueue++;
            var ver = null;
            var checkbox = $(evt.target);
            if (!checkbox){
                return;
            }
            var level = checkbox.data("level");
            if (checkbox.prop("checked")){
                switch(level){
                     case "cookbook": {
                        ver = checkbox.closest(".accordion-group")
                            .find(".accordion-inner:first");
                        if (ver.data("isLoaded")){
                            ver.find("input[type='checkbox']:gt(0)").prop("checked", false).prop("disabled", true);
                            ver.find("input[type='checkbox']:eq(0)").prop("checked", true).prop("disabled", true);
                        } else {
                            var book = checkbox.closest(".accordion-group").data("cookbook");
                            var name = book.get("name");
                            var item = {name: name, description: "Loading..."}; //TODO: retrieve
                            var ul = $("<ul class='recipes'></ul>");
                            $("<li></li>")
                                .data("recipe", item)
                                .data("cookbook", book)
                                .data("isRecipe", true)
                                .append("<input type='checkbox' class='recipeSelector' checked='true' />")
                                .append("<span class='recipe'>" + item.name + "</span>" + "<span class='recipeDescription'>" + item.description + "</span>")
                                .appendTo(ul);
                            ver.empty().append(ul);
                        }
                    } break;
                    default: {
                        console.error("Unknown checkbox level: " + level);
                    }
                }

            } else {
                switch(level){
                    case "cookbook": {
                        checkbox.closest(".accordion-group")
                            .find(".accordion-inner:first").siblings().each(function(){
                                $(this).find(".accordion-inner:has(ul)").empty();
                            });
                        ver = checkbox.closest(".accordion-group")
                            .find(".accordion-inner:first");
                        if (ver.data("isLoaded")){
                            ver.find("input[type='checkbox']:gt(0)").prop("checked", false).prop("disabled", false);
                            ver.find("input[type='checkbox']:eq(0)").prop("checked", false).prop("disabled", false);
                        } else {
                            ver.empty();
                        }
                    } break;
                    default: {
                        console.error("Unknown checkbox level: " + level);
                    }
                }
            }
            this.chefGroupQueue--;
            if (!this.chefGroupQueue){
               this.recalculateChefBadges();
            }
        },

        puppetGroupChangeHandler: function(evt) {
            var checkbox = $(evt.target);
            var ver = checkbox.closest(".accordion-group")
                .find(".accordion-inner:first");
            ver.find(".classSelector").first().click();
        },
        fetchChefEnvironments: function(){
            var chefEnvironments = new ChefEnvironments();

            return chefEnvironments.fetch({
                data: {
                    account_id: this.credential.get("cloud_account_id")
                }
            });
        },
        populateChefEnvironments: function(list){
            var select = $("#chefEnvironmentSelect").empty();
            list.forEach(function(element, indexlist){
                var option = $("<option value='" + element.get("name") + "'>" + element.get("name") + "</option></select>").appendTo(select);
            });
            if(!this.loadingAssembly){
                if(select.find("option[value=_default]").length > 0){
                    select.val("_default").change();
                }else{
                    var first = select.find("option").first();
                    select.val(first.val()).change();
                }
                this.loadingAssembly = false;
            }
            Common.vent.trigger("chefEnvironmentsPopulated");
        },
        populateCookbooks: function(credential){
            var cookbooks= new Cookbooks();
            return cookbooks.fetch({
                data: {
                    account_id: credential.get("cloud_account_id")
                },
                success: $.proxy(this.renderCookbooks, this)
            });
        },
        renderCookbooks: function(cookbooks){
            cookbooks.sort();
            var $this = this;
            var cb = $("#chef-selection");
            cb.empty();
            cookbooks.each(function(item){
                var elem = $($this.renderChefGroup("chef-selection", item.get("name"), item.get("latest_version")))
                    .data("cookbook", item);
                elem.find(".accordion-heading")
                    .prepend(
                        $("<input type='checkbox' class='cookbookSelector'>").data("level", "cookbook")
                    );
                elem.appendTo(cb); //TODO: if this doesn't perform well, try appending to a list first, then adding to doc.
            });
            Common.vent.trigger("cookbooksLoaded");
        },

        renderModules: function(classes) {
            var modules = classes.toJSON();
            var $this = this;
            var moduleList = $("#puppet-selection");
            moduleList.empty();
            for (var module in modules) {
                if (modules.hasOwnProperty(module)) {
                    var elem = $($this.renderPuppetGroup("puppet-selection", module))
                        .data("module", classes.get(module).toJSON());
                    elem.find(".accordion-heading")
                        .prepend(
                            $("<input type='checkbox' class='moduleSelector'>").data("level", "module")
                    );
                    elem.appendTo(moduleList);
                    var recipeList = this.renderPuppetClasses(modules[module], []);
                    $("#" + module +"-module").find(".accordion-inner").empty().append(recipeList);
                }
            }
            this.recalculatePuppetBadges();
            Common.vent.trigger("modulesLoaded");
        },
        sortRecipes: function(recipes){
            var sorted = [];
            $.each(recipes, function( index, recipe ){
                sorted.push({name: recipe.name, description:recipe.description});
            });
            sorted.sort(function(a,b){
                if (a.name < b.name) {
                    return -1;
                } else if (a.name > b.name) {
                    return 1;
                }
                return 0;

            });
            return sorted;
        },

        populateRecipes: function(destination, book, recipes) {
            var sorted = this.sortRecipes(recipes);
            var selected = [];

            $(destination).find("input[type=checkbox]").each(function(index, checkbox) {
                if (checkbox.checked) {
                    selected.push($(checkbox).parent().find(".recipe").text());
                }
            });
            destination.empty()
                .data("isLoaded", true);
            var ul = this.renderRecipes(sorted, book, selected);
            ul.appendTo(destination);
        },

        renderRecipes: function(recipes, book, selected ){
            var ul = $("<ul class='recipes'></ul>");
            $.each(recipes, function( index, item ) {
                var checkedState = (selected.indexOf(item.name) !== -1) ? "checked='true'": "";
                var desc = item.description  ? item.description:"";
                $("<li></li>")
                    .data("recipe", item)
                    .data("cookbook", book)
                    .data("isRecipe", true)
                    .append("<input type='checkbox' " + checkedState + " class='recipeSelector'" + " />")
                    .append("<span class='recipe'>" + item.name + "</span>" + "<span class='recipeDescription'>" + desc + "</span>")
                    .appendTo(ul);
            });
            return ul;
        },
        renderPuppetClasses: function(classes, selected ){
            var ul = $("<ul class='puppetClasses'></ul>");
            $.each(classes, function( index, item ) {
                var checkedState = (selected.indexOf(item) !== -1) ? "checked='true'": "";
                $("<li></li>")
                    .data("class", item)
                    .data("isClass", true)
                    .append("<input type='checkbox' " + checkedState + " class='classSelector'" + " />")
                    .append("<span class='puppetClass'>" + item.name + "</span>")
                    .appendTo(ul);
            });
            return ul;
        },
        accordionGroupTemplate: ['<div class="accordion-group">',
                '<div class="accordion-heading">',
                  '<a class="accordion-toggle" data-toggle="collapse" data-parent="#{{accordionId}}" href="#{{collapseId}}">{{name}}<span class="badge badge-info pull-right"></span></a>',
                '</div>',
                '<div id="{{collapseId}}" class="accordion-body collapse">',
                  '<div class="accordion-inner">',
                  '</div>',
                '</div>',
            '</div>']
            .join(''),

        renderChefGroup: function(accordionId, name, version){ //TODO: make this a common function
            var title= name + " [" + version + "]";
            var elem = this.accordionGroupTemplate
                .split("{{name}}").join(title)
                .split("{{collapseId}}").join(name + "-cookbook")
                .split("{{accordionId}}").join(accordionId);
            return elem;
        },
        renderPuppetGroup: function(id, name){
            var elem = this.accordionGroupTemplate
                .split("{{name}}").join(name)
                .split("{{collapseId}}").join(name + "-module")
                .split("{{accordionId}}").join(id);
            return elem;
        },

        accordionShown: function(evt) {
            var $this = this;
            var data = $(evt.target).closest(".accordion-group").data();
            var $destination = $(evt.target).find(".accordion-inner").first();
            var isLoaded = $destination.data("isLoaded");

            var id = $(evt.target).get(0).id;
            if (isLoaded && id !== "collapsePuppet") {
                return;
            }
            if (data.hasOwnProperty("cookbook")) {
                var $book = data.cookbook;
                if (!$book) {
                    return;
                }
                var version = $book.get("latest_version");
                $("<i class='icon-spinner'></i>").appendTo($destination);
                $this.fetchRecipes($book, version)
                    .done(function(recipes) {
                        $this.populateRecipes.call($this, $destination, $book, recipes);
                    });
            } else if (id === "collapseChef") {
                $("#puppet-selection").closest(".accordion-group").find(".accordion-toggle:first span.badge:first").text('');
                $this.recalculateChefBadges();
            } else if (id === "collapsePuppet") {
                if(!$destination.data("isLoaded")){
                    $this.populatePuppetClasses();
                }else{
                    $this.recalculatePuppetBadges();
                }
                $("#chef-selection").closest(".accordion-group").find(".accordion-toggle:first span.badge:first").text('');
                //TODO: Clear Chef
            } else if (id === "collapseSalt"){
                if(!$destination.data("isLoaded")){
                    $this.fetchSaltStates();
                }else{
                    $this.recalculateSaltBadges();
                }
            } else if (id === "collapseAnsible") {
              if (!$destination.data("isLoaded")){
                $this.fetchAnsibleJobTemplates();
              } else {
                $this.recalculateAnsibleBadges();
              }
            }
        },
        populatePuppetClasses:function (){
            var $this = this;
            var destination = $("#collapsePuppet").find(".accordion-inner");
            var accountId = this.credential.get("cloud_account_id");
            $this.puppetClasses = new PuppetClasses();
            $this.puppetClasses.fetch({
                data: $.param({
                    account_id: accountId
                }),
                success: function(collection, response, data) {
                    $this.renderModules(collection);
                    $this.recalculatePuppetBadges();
                    destination.data("isLoaded","true");
                },
                error: function(collection, response, data) {
                    Common.errorDialog("Server error", "Could not fetch Puppet classes/modules");
                }
            });
        },
        fetchRecipes: function(cookbook, version){
            var d = $.Deferred();
            var $this = this;
             $.ajax({
                url: [
                        Common.apiUrl,
                        "/stackstudio/v1/orchestration/chef/cookbooks/",
                        encodeURIComponent(cookbook.get("name")),
                        '/',
                        encodeURIComponent(version)
                    ].join(''),
                data: { account_id: this.credential.get("cloud_account_id")}
            }).done(function(model){
                d.resolve(model);
            }).fail(function(){
                $this.flashError("We're sorry.  Recipes could not be retrieved.");
                d.reject();
            });
            return d.promise();
        },

        recipeChangeHandler: function(evt){
            this.recalculateChefBadges();
        },
        classChangeHandler: function(evt){
            this.recalculatePuppetBadges();
        },
        stateChangeHandler: function(evt){
            this.recalculateSaltBadges();
        },

        recalculateChefBadges: function(){
            var badgeCount = 0;
            var chefContainer = $("#chef-selection");
            var allChecked = chefContainer.find("input[type='checkbox']:checked")
                .filter(function(){
                    return !$(this).parent().hasClass("accordion-heading");
                });
            chefContainer.closest(".accordion-group").find(".accordion-toggle:first span.badge:first").text(allChecked.length ? allChecked.length : '');

            badgeCount = allChecked.length;

            var cookbooks = $("#chef-selection>.accordion-group");
            cookbooks.each(function(){
                var book = $(this);
                var badge = book.find(".accordion-toggle:first span.badge:first");
                allChecked = book.find("input[type='checkbox']:checked")
                    .filter(function(){
                        return !$(this).parent().hasClass("accordion-heading");
                    });
                book.find(".accordion-toggle:first span.badge:first").text(allChecked.length ? allChecked.length : '');
            });
            this.trigger("badge-refresh", {badgeCount: badgeCount});
            Common.vent.trigger("chefSelectionChanged");
        },
        recalculatePuppetBadges: function(){
            var badgeCount = 0;
            var puppetContainer = $("#puppet-selection");
            var allChecked = puppetContainer.find("input[type='checkbox']:checked")
                .filter(function(){
                    return !$(this).parent().hasClass("accordion-heading");
                });
            puppetContainer.closest(".accordion-group").find(".accordion-toggle:first span.badge:first").text(allChecked.length ? allChecked.length : '');

            var modules = $("#puppet-selection>.accordion-group");
            modules.each(function(){
                var puppetClass = $(this);
                var badge = puppetClass.find(".accordion-toggle:first span.badge:first");
                allChecked = puppetClass.find("input[type='checkbox']:checked")
                    .filter(function(){
                        return !$(this).parent().hasClass("accordion-heading");
                    });
                puppetClass.find(".accordion-toggle:first span.badge:first").text(allChecked.length ? allChecked.length : '');
            });

            this.trigger("badge-refresh", {badgeCount: badgeCount});
            Common.vent.trigger("puppetSelectionChanged");


        },

        setupTypeAhead: function(){
             $("#configuration-management-library-source").typeahead({
                name: "configManagmentLibrarySource",
                prefetch: {
                    url: "samples/apps_puppet.json",
                    filter: function(parsedResponse){
                        return parsedResponse;
                    }
                },
                template: [
                    '<div class="packageItem">',
                        '<p class="packages cfg-icon cfg-icon-<%=tool%>"></p>',
                        '<p class="config-name"><%=value%></p>',
                        '<p class="config-tool"><%=tool%></p>',
                    '</div>'
                ].join(''),
                engine: _
            }).on('typeahead:opened', function() { //hack to overcome overflow inside an accordion.
                $(this).closest('.accordion-body').css('overflow','visible').parent().closest('.accordion-body').css('overflow','visible'); // set overflow for current and parent accordion
                console.log("typeahed:opened");
            }).on('typeahead:closed', function() {
                $(this).closest('.accordion-body').css('overflow','hidden').parent().closest('.accordion-body').css('overflow','hidden');
                console.log("typeahed:closed");
            });

            console.log("Typeahead initialized.");
        },


        packageClick: function(evt, package) {
            this.listView.addApp(package);
            this.enableDeployLaunch();
            this.recalculatePuppetBadge();
            //this.updateDeployButtonState();
        },
        flashError: function(message){
            $("#msg").html(message);
            $(".alert")
                .addClass("alert-danger")
                .delay(200)
                .addClass("in")
                .show()
                .delay(5000)
                .fadeOut(4000, function(){
                    $(".alert").removeClass("alert-danger");
                });
        },
        getConfigs: function(toolId) {
            var configurations = {};

            var tool = $(toolId).val();
            var data = {};
            switch(tool){
                case "Puppet":
                    data["node_config"] = this.getConfig("class");
                    break;
                case "Chef":
                    data["env"] = $("#chefEnvironmentSelect :selected").val();
                    data["run_list"] = this.getConfig("recipe");
                    break;
                case "Salt":
                    data["minion_config"] = this.getConfig("saltState");
                    break;
                case "Ansible":
                    data["host_config"] = this.getConfig("ansibleJobTemplate");
                    break;
            }
            configurations[tool.toLowerCase()] = data;
            return {
                "configurations": configurations
            };
        },

        getConfig: function(type){
            var config = [];
            $("input:checkbox[class="+type+"Selector]:checked").each(function(index, object){
                var nodeData = $(object.parentElement).data();
                var data = {"name": nodeData[type]["name"], "type":type};

                switch(type){
                    case "recipe":
                        data["version"] = nodeData["cookbook"].get("latest_version");
                        break;
                    case "class":
                        data["id"] = nodeData["class"]["id"];
                        break;
                    case 'ansibleJobTemplate':
                      data['id'] = nodeData['ansibleJobTemplate']['id'];
                      break;
                }
                config.push(data);
            });
            return config;
        },

        fetchSaltStates: function(){
            var $this = this;

            var destination = $("#collapseSalt").find(".accordion-inner");

            $this.saltStates = new SaltStates();
            $this.saltStates.fetch({
                data: {account_id: this.credential.get("cloud_account_id")},
                success:function(collection, response, data){
                    $this.populateSaltTree(collection);
                    $this.recalculateSaltBadges();
                    destination.data("isLoaded", "true");
                },
                error:function(collection, response, data){
                    Common.errorDialog("Server error", "Could not fetch Salt states");
                }
            });
        },
        populateSaltTree: function(states) {
            var formulas = states.toJSON();
            var $this = this;
            var formulaList = $("#salt-selection");
            formulaList.empty();
            for (var formula in formulas) {
                if (formulas.hasOwnProperty(formula)) {
                    var elem = $($this.renderAccordionGroup("salt-selection", formula, "formula"));
                    elem.find(".accordion-heading")
                        .prepend(
                            $("<input type='checkbox' class='formulaSelector'>")//.data("level", "formula")
                    );
                    elem.appendTo(formulaList);
                    var statesList = this.renderSaltStates(formulas[formula], []);
                    $("#" + formula + "-formula").find(".accordion-inner").empty().append(statesList);
                }
            }
            this.recalculateSaltBadges();
            Common.vent.trigger("formulasLoaded");
        },

        renderSaltStates: function(states, selected ){
            var ul = $("<ul class='saltStates'></ul>");
            $.each(states, function( index, item ) {
                var checkedState = (selected.indexOf(item) !== -1) ? "checked='true'": "";
                $("<li></li>")
                    .data("saltState", item)
                    .append("<input type='checkbox' " + checkedState + " class='saltStateSelector'" + " />")
                    .append("<span class='saltState'>" + item.name + "</span>")
                    .appendTo(ul);
            });
            return ul;
        },

        renderAccordionGroup: function(id, name, type){
            var elem = this.accordionGroupTemplate
                .split("{{name}}").join(name)
                .split("{{collapseId}}").join(name + "-" + type)
                .split("{{accordionId}}").join(id);
            return elem;
        },
        saltGroupChangeHandler: function(evt){
            var checkbox = $(evt.target);
            var ver = checkbox.closest(".accordion-group")
                .find(".accordion-inner:first");
            ver.find(".saltStateSelector").first().click();
        },
        recalculateSaltBadges: function(){
            var badgeCount = 0;
            var saltContainer = $("#salt-selection");
            var allChecked = saltContainer.find("input[type='checkbox']:checked")
                .filter(function(){
                    return !$(this).parent().hasClass("accordion-heading");
                });
            saltContainer.closest(".accordion-group").find(".accordion-toggle:first span.badge:first").text(allChecked.length ? allChecked.length : '');
            var formulas = $("#salt-selection>.accordion-group");
            formulas.each(function(){
                var formula = $(this);
                var badge = formula.find(".accordion-toggle:first span.badge:first");
                allChecked = formula.find("input[type='checkbox']:checked")
                    .filter(function(){
                        return !$(this).parent().hasClass("accordion-heading");
                    });
                formula.find(".accordion-toggle:first span.badge:first").text(allChecked.length ? allChecked.length : '');
            });

            this.trigger("badge-refresh", {badgeCount: badgeCount});
            Common.vent.trigger("saltSelectionChanged");
        },
        toolChangeHandler: function(evt){
            var $this = this;

            $(".main-group").hide();
            $("#no_tool_selected").hide();
            $("#tool_selected").show();
            var currentTool = $(evt.currentTarget).val().toLowerCase();
            var accordion = $("#" + currentTool + "Accordion");
            accordion.show();
            switch(currentTool){
                case "puppet":
                    this.populatePuppetClasses();
                    break;
                case "chef":
                    this.fetchChefEnvironments().done(function(model){
                        $this.populateChefEnvironments(new ChefEnvironments(model));
                    });
                    break;
                case "salt":
                    this.fetchSaltStates();
                    break;
            }
        },
        // Ansible Assembly
        renderAnsibleGroup: function(id, name, type){
            var elem = this.accordionGroupTemplate
                .split("{{name}}").join(name)
                .split("{{collapseId}}").join(name.replace(/ /g,'') + "-" + type)
                .split("{{accordionId}}").join(id);
            return elem;
        },
        // [XXX] the source of my woe
        ansibleGroupChangeHandler: function(evt){
          var checkbox = $(evt.target);
          var ver = checkbox.closest(".accordion-group")
            .find(".accordion-inner:first");
          ver.find(".ansibleJobTemplateSelector").first().click();
        },

        fetchAnsibleJobTemplates: function(evt) {
          var $this = this;
          var destination = $("#collapseAnsible").find(".accordion-inner");
          $this.ansibleJobTemplates = new AnsibleJobTemplates();
          $this.ansibleJobTemplates.fetch({
            data: {account_id: this.credential.get("cloud_account_id")},
            success: function(collection, response, data) {
              $this.populateAnsibleJobTemplates(response);
              destination.data("isloaded", "true");
            },
            error: function(collection, response, data){
              Common.errorDialog("Server error", "Could not fetch Ansible Job Templates");
            }
          });
        },

        populateAnsibleJobTemplates: function(jobtemplates) {
          var $this = this;
          var jobtemplateEl = $("#ansible-selection");
          jobtemplateEl.empty();
          for (var i in jobtemplates) {
            var jobtemplate = jobtemplates[i];
            var el = $($this.renderAnsibleGroup("ansible-selection",
              jobtemplate.name, "jobtemplate"))
              .data('jobtemplate', jobtemplate);
            el.find(".accordion-heading")
              .prepend($("<input type=\"checkbox\" class=\"jobtemplateSelector\">"));
            el.appendTo(jobtemplateEl);
            var jobtemplateList = this.renderAnsibleJobTemplates(jobtemplate,[]);
            $("#" + jobtemplate.name.replace(/ /g, '') + "-jobtemplate")
              .find(".accordion-inner")
              .empty()
              .append(jobtemplateList);
          }
          this.recalculateAnsibleBadges();
          Common.vent.trigger("jobtemplatesLoaded");
        },

        renderAnsibleJobTemplates: function(jobtemplate, selected ) {
          var ul = $("<ul class=\"ansibleJobTemplates\"></ul>");
          var checked = (selected.indexOf(jobtemplate.id) !== -1) ? "checked=\"true\"": "";
          $("<li></li>")
            .data("ansibleJobTemplate", jobtemplate)
            .append("<input type=\"checkbox\" " + checked +
              " class=\"ansibleJobTemplateSelector\" />")
            .append("<span class=\"ansibleJobTemplate\">" + jobtemplate.name + "</span>")
            .appendTo(ul);
          return ul;
        },

        recalculateAnsibleBadges: function() {
          var badgeCount = 0;
          var ansibleContainer = $("#ansible-selection");

          var allChecked = ansibleContainer.find("input[type=\"checkbox\"]:checked")
            .filter(function() {
              return !$(this).parent().hasClass("accordion-heading");
            });

          ansibleContainer.closest(".accordion-group")
            .find(".accordion-toggle:first span.badge:first")
            .text(allChecked.length ? allChecked.length : "");

          var jobtemplates = $("ansible-selection>.accordion-group");
          jobtemplates.each(function() {
            var jobtemplate = $(this);
            var badge = jobtemplate.find(".accordion-toggle:first span.badge:first");
            allChecked = jobtemplate.find("input[type=\"checkbox\"]:checked")
              .filter(function(){
                return !$(this).parent().hasClass("accordion-heading");
              });
            jobtemplate.find(".accordion-toggle:first span.badge:first")
              .text(allChecked.length ? allChecked.length : "");
          });
          this.trigger("badge-refresh", {badgeCount: badgeCount});
          Common.vent.trigger("ansibleSelectionChanged");
        },

        jobtemplateChangeHandler: function() {
          this.recalculateAnsibleBadges();
        },
        // End Ansible
        //
        close: function(){
            this.$el.empty();
            this.undelegateEvents();
            this.stopListening();
            this.unbind();
        }
    });
    return ConfigListView;
});
