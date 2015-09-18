/*
    Copyright (C) 2015  Joulesmith Energy Technologies, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/



define([
    'angular',
    'ui-bootstrap'
], function (angular){
    "use strict";

    var me = 9.109E-31;
    var hbar = 1.0545718E-34;

    var app = angular.module('qmgrav', ['ui.bootstrap']);

    app.controller('mainCtrl', [
        '$scope',
        '$interval',
        function($scope, $interval){
            $scope.function = {
                type : 'series',
                update : true,
                data : {
                    series : {
                        'real' : {
                            x : [],
                            y : [],
                            color : '#ff0000'
                        },
                        'imaginary' : {
                            x : [],
                            y : [],
                            color : '#00ff00'
                        },
                        'magnitude' : {
                            x : [],
                            y : [],
                            color : '#ffffff'
                        }
                    }
                },
                layout : {
                    ymin : -1,
                    ymax : 3,
                    xmin : 0,
                    xmax : 1,
                    width : 400,
                    height : 400
                }
            };





            var t0 = Date.now();
            var t = 0;

            var N = 100;
            var phi = {
                cur : {
                    real : {
                        f : [],
                        dfdt : []
                    },
                    imaginary : {
                        f : [],
                        dfdt : []
                    }
                },
                next : {
                    real : {
                        f : [],
                        dfdt : []
                    },
                    imaginary : {
                        f : [],
                        dfdt : []
                    }
                },
            };

            var constant = 2;
            var dt = 1E-2;

            var x = $scope.function.data.series.real.x;

            for(var i = 0; i < N; i++) {
                x[i] = i/(N-1);
            }

            $scope.function.data.series.imaginary.x = x;
            $scope.function.data.series.magnitude.x = x;

            var init = function () {
                for(var i = 0; i < N; i++) {

                    phi.cur.imaginary.f[i] = 0;
                    phi.cur.imaginary.dfdt[i] = 0;
                    phi.cur.real.f[i] = Math.sin(x[i] * Math.PI);
                    phi.cur.real.dfdt[i] = 0;

                    phi.next.imaginary.f[i] = 0;
                    phi.next.imaginary.dfdt[i] = 0;
                    phi.next.real.f[i] = Math.sin(x[i] * Math.PI);
                    phi.next.real.dfdt[i] = 0;
                }
            };

            var g = 0;
            $scope.g = g;


            $scope.change_g = function(){

                if (g === 0) {
                    g = 1;
                }else{
                    //init();
                    g = 0;
                }

                $scope.g = g;
            };

            init();

            var iterate = function () {
                for(var i = 1; i < N-1; i++) {
                    phi.cur.real.dfdt[i] = - constant * (phi.cur.imaginary.f[i-1] - 2 *phi.cur.imaginary.f[i] + phi.cur.imaginary.f[i+1]);
                    phi.cur.imaginary.dfdt[i] = constant * (phi.cur.real.f[i-1] - 2 *phi.cur.real.f[i] + phi.cur.real.f[i+1]);
                    phi.next.real.dfdt[i] = - constant * (phi.next.imaginary.f[i-1] - 2 *phi.next.imaginary.f[i] + phi.next.imaginary.f[i+1]);
                    phi.next.imaginary.dfdt[i] = constant * (phi.next.real.f[i-1] - 2 *phi.next.real.f[i] + phi.next.real.f[i+1]);
                }

                for(i = 1; i < N-1; i++) {
                    phi.next.real.f[i] = phi.cur.real.f[i] + Math.exp(g * x[i]) * dt * (phi.cur.real.dfdt[i] + phi.next.real.dfdt[i])/2;
                    phi.next.imaginary.f[i] = phi.cur.imaginary.f[i] + Math.exp(g * x[i]) * dt * (phi.cur.imaginary.dfdt[i] + phi.next.imaginary.dfdt[i])/2;
                }
            };

            var step = function() {
                for(var i = 0; i < N; i++) {
                    x[i] = i/(N-1);

                    phi.cur.imaginary.f[i] = phi.next.imaginary.f[i];
                    phi.cur.imaginary.dfdt[i] = phi.next.imaginary.dfdt[i];
                    phi.cur.real.f[i] = phi.next.real.f[i];
                    phi.cur.real.dfdt[i] = phi.next.real.dfdt[i];
                }
            };


            $interval(function() {

                var sum = 0;

                for(var sub = 0; sub < 2000; sub++) {
                    for(var it = 0; it < 3; it++) {

                        iterate();
                    }

                    step();
                }



                for(var i = 0; i < N; i++) {
                    //y[i] = phi_r[i]*phi_r[i] + phi_i[i]*phi_i[i];

                    $scope.function.data.series.real.y[i] = phi.cur.real.f[i];
                    $scope.function.data.series.imaginary.y[i] = phi.cur.imaginary.f[i];
                    $scope.function.data.series.magnitude.y[i] = phi.cur.imaginary.f[i] * phi.cur.imaginary.f[i] + phi.cur.real.f[i] * phi.cur.real.f[i];
                    sum += $scope.function.data.series.magnitude.y[i] / (N-1);
                }


                for(var i = 0; i < N; i++) {

                    $scope.function.data.series.magnitude.y[i] /= sum;
                }

                $scope.function.changed = Date.now();

            }, 100);
	}]);

    app.directive('plot', function($compile){
        return {
            restrict : 'A',
            scope : {
                plot : '='
            },
            template : '<canvas></canvas>',
            replace : true,
            link : function($scope, elem, attr, ctrl) {

                $scope.$watch(function($scope){return $scope.plot.changed}, function() {
                    var canvas = elem[0];
                    canvas.width = $scope.plot.layout.width;
                    canvas.height = $scope.plot.layout.height;

                    var ctx = canvas.getContext('2d');

                    plotters[$scope.plot.type](ctx, $scope.plot.data, $scope.plot.layout);
                });
            }
        };
    });

    var plotters = {};

    plotters['series'] = function(ctx, data, layout) {

        var yFactor = layout.height/(layout.ymax-layout.ymin);
        var xFactor = layout.width/(layout.xmax-layout.xmin);

        var legend_offset = 0;

        for(var series_name in data.series) {
            var series = data.series[series_name];

            ctx.strokeStyle = series.color;

            legend_offset += 20;
            ctx.font = "20px Courier";
            ctx.strokeText(series_name, 0, legend_offset);

            ctx.beginPath();

            ctx.moveTo(xFactor * (series.x[0] - layout.xmin), layout.height - (yFactor * (series.y[0] - layout.ymin)));
            for(var i = 1; i < series.x.length; i++) {
                ctx.lineTo(xFactor * (series.x[i] - layout.xmin), layout.height - (yFactor * (series.y[i] - layout.ymin)));
            }


            ctx.stroke();
        }
    };

    return app;
});
