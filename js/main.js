
"use strict";

require.config({
    paths : {
        'angular' : './lib/angular.min',
        'domReady': './lib/domReady',
        'ui-bootstrap' : './lib/ui-bootstrap.min'
    },
    shim: {
        'angular' : {
            exports : 'angular'
        },
        'ui-bootstrap' : {
            deps : ['angular']
        }
    }
});

require([
    'domReady',
], function(domReady) {

    domReady(function () {

        require(['angular', "qmgrav"], function(){
            angular.bootstrap(document, ['qmgrav']);
        });
    });
});
