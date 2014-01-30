/*!
 * StackStudio 2.0.0-rc.1 <http://stackstudio.transcendcomputing.com>
 * (c) 2012 Transcend Computing <http://www.transcendcomputing.com/>
 * Available under ASL2 license <http://www.apache.org/licenses/LICENSE-2.0.html>
 */
/*jshint smarttabs:true */
/*global define:true console:true alert:true*/
define([
        'jquery',
        'underscore',
        'backbone',
        'views/dialogView',
        'models/account',
        'text!templates/account/stackplaceLoginTemplate.html',
        'text!templates/account/stackstudioLoginTemplate.html',
        'views/account/newLoginView',
        'common'      
], function( $, _, Backbone, DialogView, Account, stackplaceLoginTemplate, stackstudioLoginTemplate, NewLoginView, Common ) {
    
    var AccountLoginView = DialogView.extend({

        events: {
            "dialogclose": "close"
        },

        initialize: function() {
            
        },

        render: function() {
            var accountLoginView = this,
                title, template;
            
            if (window.app === "stackplace") {
                title = "GitHub Login";
                template = _.template( stackplaceLoginTemplate );
            } else {
                title = "Login";
                template = _.template( stackstudioLoginTemplate );
            }
            
            this.$el.html( template );

            this.$el.dialog({
                title: title,
                autoOpen: true,
                width:325,
                minHeight: 150,
                resizable: false,
                modal: true,
                buttons: [
                    {
                        text: "Login",
                        click: function() {
                            accountLoginView.login();
                        }
                    },
                    {
                        text: "Register",
                        click: function() {
                            accountLoginView.createNew();
                        }
                    },
                    {
                        text: "Cancel",
                        click: function() {
                            accountLoginView.cancel();
                        }
                    }
                ]
            });
            this.$el.keypress(function(e) {
                if(e.keyCode === $.ui.keyCode.ENTER) {
                    accountLoginView.login();
                }
            });
            this.$(".accordion").accordion();
            this.$el.dialog('open');
        },
        
        login: function() {
            var accountLoginView = this;
            var username = $('input#username').val(),
                password = $('input#password').val();
            if (window.app === "stackplace") {
                this.model.githubLogin(username, password);
            } else {
                var url = Common.apiUrl + "/identity/v1/accounts/auth";
                
                $.ajax({
                    url: url,
                    type: 'POST',
                    contentType: 'application/x-www-form-urlencoded',
                    dataType: 'json',
                    data: {
                        'login' : username,
                        'password' : password
                    },
                    success: function(data) {
                        accountLoginView.successfulLogin(data);
                    },
                    error: function(jqXHR) {
                        Common.errorDialog(jqXHR.statusText, jqXHR.responseText);
                    }
                });
            }
        },
        
        successfulLogin: function(data) {
            if(typeof(Storage) !== "undefined") {
                sessionStorage.account_id = data.account.id;
                sessionStorage.login = data.account.login;
                sessionStorage.first_name = data.account.first_name;
                sessionStorage.last_name = data.account.last_name;
                sessionStorage.company = data.account.company;
                sessionStorage.email = data.account.email;
                sessionStorage.org_id = data.account.org_id;
                sessionStorage.cloud_credentials = JSON.stringify(data.account.cloud_credentials);
                sessionStorage.permissions = JSON.stringify(data.account.permissions);
                sessionStorage.project_memeberships = JSON.stringify(data.account.project_memberships);
                sessionStorage.group_policies = JSON.stringify(data.account.group_policies);
                
                sessionStorage.rss_url = data.account.rss_url;
                
                console.log("session login:" + sessionStorage.login);
                Common.vent.trigger("loginSuccess");
                
                if(data.account.cloud_credentials && data.account.cloud_credentials.length > 0) {
                    Common.router.navigate("#resources", {trigger: true});
                }else {
                    Common.router.navigate("#account/management/home", {trigger: true});
                }
                Common.router.navigate("#account/management/newuser", {trigger: true});
            }else {
                Common.errorDialog("Browser Issue", "Your browser does not support web storage.");
            }
            this.$el.dialog('close');
        },
        
        createNew: function() {
            new NewLoginView();
        }

    });
    
    return AccountLoginView;
});
