'use strict';


/*************************** Underscore.js **********************************/
var underscore = angular.module('underscore', []);
underscore.factory('_', function () {
    return window._; //Underscore must already be loaded on the page
});


/************************ Main App **************************************/


var cassApp = angular.module('cassApp', ['ngAnimate', 'ngCookies', 'underscore', 'ng-slide-down', 'ngScrollbar', 'ui.grid', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.pinning', 'ui.grid.selection', 'ui.grid.resizeColumns', 'ui.bootstrap']);


/********** Configurations *********************************************************/

cassApp.constant('TIMEOUT', 100);

/********** Directives *********************************************************/

cassApp.directive('loadingSpinner', function () {
    return {
        templateUrl: '/views/loader.html',
        link: function (scope, element, arrts) {

        }
    }
});


cassApp.directive('resultsView', function (cassandraService) {
    return {
        scope: {
            query: '='
        },
        restrict: 'E',
        templateUrl: '/views/table.html',
        controller: function ($scope) {
            $scope.getData = function (query) {
                cassandraService.executeCql(query).success(function (data) {
                    $scope.dataToRender = data;
                }).error(function (error) {

                });
            }
        },
        link: function (scope, elem, attrs) {
            scope.$watch('query', function (newVal) {
                scope.getData(scope.query);
            });

            console.log(scope.dataToRender);
        }
    }

});

/********** Services *********************************************************/


cassApp.factory('loaderService', function () {
    return {
        showLoader: function (msg) {
            this.showSpinner = true;
            this.loadingText = (msg ? msg : '');
        },
        hideLoader: function () {
            this.showSpinner = false;
            this.loadingText = '';
        },
        showSpinner: false,
        loadingText: ''
    }
});

cassApp.factory('errorService', function () {
    return {
        showError: function (msg, details) {
            this.showLogingError = true;
            this.logInErrorMessage = msg;
            this.logInErrorDetails = (details ? details : '');
        },
        hideError: function () {
            this.showLogingError = false;
            this.logInErrorMessage = '';
        },
        showErrorWidget: function (msg, details) {
            this.showErrorSmall = true;
            this.smallErrorMessage = msg;
            this.smallErrorDetails = (details ? details : '');
        },
        hideErrorSmall: function () {
            this.showErrorSmall = false;
            this.smallErrorMessage = '';
            this.smallErrorDetails = '';
        },
        showLogingError: false,
        logInErrorMessage: '',
        logInErrorDetails: '',
        showErrorSmall: false,
        smallErrorMessage: '',
        smallErrorDetails: ''
    }
});


cassApp.factory('successfulWidget', function ($timeout) {
    return {
        showSuccessWidget: function (msg) {
            this.showWidgetFlag = true;
            this.successMsg = msg;
        },
        hideSuccessWidget: function () {
            this.showWidgetFlag = false;
            this.successMsg = '';
        },
        showWidgetFlag: false,
        successMsg: ''
    }
});

cassApp.factory('utilService', function ($cookieStore) {
    var apiKey = '';
    return {
        setApiKey: function (key) {
            apiKey = key;
            $cookieStore.put('apiKey', key);
        },
        getApiKey: function () {
            return $cookieStore.get('apiKey');
        }, logOut: function () {
            $cookieStore.remove('apiKey');
        }
    }
});

cassApp.factory('cassandraService', function ($http, $location, utilService) {
    var apiKey = utilService.getApiKey();
    var rootPath = '/api';
    var doRequest = function (query) {
        return $http.post(rootPath + '/execute_cql?apiKey=' + apiKey, {
            query: query
        });
    };
    return {
        getKeyspaces: function () {
            return doRequest('select keyspace_name from system.schema_keyspaces')
        },
        getClusterInfo: function () {
            return doRequest('select cluster_name, partitioner from system.local')
        },
        getTables: function (keyspaceName) {
            return doRequest("select keyspace_name, columnfamily_name, type from system.schema_columnfamilies where keyspace_name ='" + keyspaceName + "'");
        },
        getAllTables: function () {
            return doRequest('select keyspace_name, columnfamily_name from system.schema_columnfamilies');
        },
        loadData: function (keyspace, table) {
            return doRequest('select * from ' + keyspace + '.' + table);
        },
        getColumns: function (keyspace, table) {
            return doRequest("select keyspace_name, columnfamily_name, column_name, type, validator from system.schema_columns where keyspace_name = '" + keyspace + "' and columnfamily_name = '" + table + "'");
        },
        executeCql: function (query) {
            return doRequest(query);
        },
        updateTable: function (id, keyspace, table, value, field, id_field) {
            return doRequest("UPDATE " + keyspace + "." + table + " SET " + field + " = " + value + " WHERE " + id_field + " IN (" + id + ")");
        },
        insertInTable: function (keyspace, table, col, value) {
            return doRequest("INSERT INTO " + keyspace + "." + table + " (" + col + ") VALUES (" + value + ")")
        },
        deleteRow: function (keyspace, table, id, id_field) {
            return doRequest("DELETE FROM " + keyspace + "." + table + " WHERE " + id_field + " IN (" + id + ")");
        }
    }
});

cassApp.factory('breadcrumbService', function(){
    return {
        breadcrumb : '',
        setBreadcrumb : function(arr){

        }
    }
});


/*
 cassApp.filter('stringArrayFilter', function() {
 return function(myArray) {
 var res = [];
 Object.keys(myArray).forEach(function(key) {
 res.push(myArray[key]);
 });
 console.log(res.join(","));
 return res.join(",");
 };
 });*/


/********** Controllers *********************************************************/

cassApp.controller('MainCtrl', function ($scope, $timeout, $location, TIMEOUT, utilService) {
    //default
    $scope.signedIn = (utilService.getApiKey() ? true : false);
    $scope.$on('startDashboard', function (event, args) {
        $scope.signedIn = true;
        $scope.dashboardLoaderText = args.msg;
    });

    $scope.$on('startLogin', function (event, args) {
        $scope.signedIn = false;
    })
    console.log($location.path());
});


cassApp.controller('LoggingCtrl', function ($scope, $rootScope, $timeout, $http, TIMEOUT, loaderService, errorService, utilService) {

    $scope.loader = loaderService;
    $scope.error = errorService;

    var iniCtrlView = function () {
        if (!$scope.signedIn) {
            $scope.loader.showLoader();
            $timeout(function () {
                $scope.address = "localhost";
                $scope.username = "cassandra";
                $scope.password = "cassandra";
                $scope.loader.hideLoader();
                $scope.showLoginLanding = true;
            }, TIMEOUT)
        }
    };

    iniCtrlView();


    $scope.submitForm = function () {
        $scope.showLoginLanding = false;
        $timeout(function () {
            var loaderMsg = "Connecting to " + $scope.address;
            $scope.loader.showLoader(loaderMsg);
            $http.post('/api/connect', {address: $scope.address, username: $scope.username, password: $scope.password})
                .success(function (data, status, headers, config) {
                    $scope.loader.hideLoader();
                    $scope.hideLoginCtrl = true;
                    utilService.setApiKey(data.apiKey);
                    $rootScope.$broadcast("startDashboard", {msg: loaderMsg})
                })
                .error(function (data, status, headers, config) {
                    $scope.loader.hideLoader();
                    $scope.error.showError(data.message, data.details.message);
                });
        }, TIMEOUT)


    }
    $scope.loginErrotBackClk = function (e) {
        $scope.error.hideError();
        $scope.showLoginLanding = true;
    }
});


cassApp.controller('DashboardCtrl', function ($scope, $rootScope, $timeout, $q, _, loaderService, errorService, TIMEOUT, utilService, cassandraService, successfulWidget, $modal) {

    $scope.loader = loaderService;
    $scope.error = errorService;
    $scope.success = successfulWidget;

    $scope.showSidebarContainer = false;

    $scope.showSuccessWidgetTimeout = function (msg) {
        $scope.success.showSuccessWidget(msg);
        $timeout(function () {
            $scope.success.hideSuccessWidget();
        }, 3000);
    };

    $scope.showErrorWidgetTimeout = function (msg, details) {
        $scope.error.showErrorWidget(msg, details);
        $timeout(function () {
            $scope.error.hideErrorSmall();
        }, 5000);
    };

    var iniCtrlView = function () {
        if ($scope.signedIn) {
            $scope.loader.showLoader($scope.dashboardLoaderText);
            $timeout(function () {
                //Get the data async using promises
                refreshData();
                //$scope.showSidebar = true;
            }, TIMEOUT)
        }
    };


    iniCtrlView();



    $scope.$on('updateTablesData', function(event, args){
        //Update the tables data for the sidebar
        $scope.tablesData.push({keyspace_name: args.keyspace_name, columnfamily_name: args.columnfamily_name});
    });

    $scope.$on('deleteTablesData', function(event, args){
        $scope.tablesData = _.without($scope.tablesData, _.findWhere($scope.tablesData, {columnfamily_name: args.columnfamily_name, keyspace_name: args.keyspace_name}));
    });

    //TODO: Load the content of the DB by creating a service

    var refreshData = function(){
        $q.all([cassandraService.getKeyspaces(), cassandraService.getClusterInfo(), cassandraService.getAllTables()]).then(function (results) {
                    //obtain the data from the promises
                    var keyspaces = results[0].data.results.rows;
                    var clusterInfo = results[1].data.results.rows[0];
                    var allTables = results[2].data.results.rows;
                    //console.log(_.indexBy(results[2].data.results.rows, 'column_name'));

                    //To pass them to the sidebar
                    $scope.tablesData = allTables;
                    $scope.keyspacesSidebar = keyspaces;

                    //handle the keyspace data
                    //$scope.keyspaces = chunk(keyspaces, 4);
                    $scope.keyspaces = keyspaces;

                    //$scope.keyspaces = keyspaces.concat(keyspaces.slice(0));

                    //Hanle the cluster Info data
                    $scope.clusterData = clusterInfo;

                    //Show dashboard and hide the loader
                    $scope.loader.hideLoader();
                    $scope.selectedPage = "keyspaces";
                    $scope.showDashboardCtrl = true;

                }, function (error) {
                    //Handle the errors from the promises
                    $scope.loader.hideLoader();
                    $scope.error.showError(error.statusText + " " + error.status);
                });
    }

    //Events functions ********************************************************
    $scope.logOut = function () {
        $scope.showDashboardCtrl = false;
        utilService.logOut();
        $timeout(function () {
            //timeout for the animation
            $rootScope.$broadcast('startLogin');
        }, 500)
    };


    $scope.errorLogOut = function () {
        $scope.showDashboardCtrl = false;
        $scope.error.hideError();
        utilService.logOut();
        $timeout(function () {
            //timeout for the animation
            $rootScope.$broadcast('startLogin');
        }, 500)
    };

    $scope.selectedIndex = -1;
    $scope.selectKeyspace = function (keyspace) {

        $scope.showSidebarContainer = true;

        $timeout(function(){
            $scope.selectedPage = 'keyspace_main';
            $scope.SelectedKeyspaceView = 'keyspace';
            $scope.showSidebar = true;
        }, 100);

        //Launch the scrollbar
        // $scope.$broadcast('rebuild:me');
        $scope.selectedKeyspace = keyspace;
        var index = -1;
        if ($scope.selectedIndex !== -1) {
            $scope.keyspacesSidebar[$scope.selectedIndex].expand = false;
        }
        _.find($scope.keyspacesSidebar, function (Item, Idx) {
            if (Item.keyspace_name === keyspace) {
                index = Idx;
                return true;
            }
        });
        $scope.selectedIndex = index;
        $scope.keyspacesSidebar[index].expand = true;

        //wait until the container is expanded and then fire-up the scrollbar
        $timeout(function () {
            $scope.$broadcast('rebuild:me');
        }, 500)
    };

    
    $scope.deleteKeyspace = function ($event, keyspace) {
        $event.stopPropagation();

        var deleteOperation = function(keyspace){
            var query = "DROP KEYSPACE " + keyspace ; 
            cassandraService.executeCql(query).success(function(data){
                $scope.showSuccessWidgetTimeout("The keyspace "+keyspace+" is successfully deleted.");
                refreshData();

            }).error(function(data){
                $scope.showErrorWidgetTimeout(data.message, data.details.message);

            });
        }

        if(confirm("Are you sure you want to delete " + keyspace + " ?")) {
            deleteOperation(keyspace);
        }
    };

    $scope.createKeyspace = function () {
        var modalInstance = $modal.open({
            templateUrl: 'createKeyspace.html',
            controller: 'CreateKeyspaceModalCtrl'
        });

        modalInstance.result.then(function(results){
            var keyspaceName = results.keyspaceName;

            $scope.showSuccessWidgetTimeout("Keyspace " + keyspaceName + " was successfully created.");
            refreshData();
        });

    };

    $scope.selectMainDashboard = function () {
        _.each($scope.keyspacesSidebar, function (value) {
            value.expand = false;
        });



        $scope.showSidebar = false;
        $timeout(function () {
            $scope.selectedPage = 'keyspaces';
            $scope.showDashboardCtrl = true;
            $scope.showSidebarContainer = false;
        }, 500);
    };

});

cassApp.controller('CreateKeyspaceModalCtrl', function ($scope, $modalInstance, cassandraService) {

    var replicationDefault = "{ 'class' : 'SimpleStrategy', 'replication_factor' : 3 }";
    var durableDefault = true;

    $scope.showError = false;

    $scope.replicationClass = replicationDefault;
    $scope.durableWrite = durableDefault;

    $scope.ok = function () {
        if($scope.inputKeyspaceName && $scope.replicationClass){
            cassandraService.executeCql("CREATE KEYSPACE "+ $scope.inputKeyspaceName
            + " WITH REPLICATION = " + $scope.replicationClass + " AND DURABLE_WRITES = " + $scope.durableWrite).success(function(data){

                $modalInstance.close({keyspaceName:$scope.inputKeyspaceName})

            }).error(function(data){
                $scope.errorMsg = data.message;
                $scope.errorDetails = data.details.message;
                $scope.showError = true;
            });
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});


cassApp.controller('SidebarCtrl', function ($scope, _, $timeout, $rootScope) {


    $scope.filterTablesData = function (keyspace) {
        return _.where($scope.tablesData, {keyspace_name: keyspace})
    };




    $scope.activeClassTable = '';

    // Subside bar specifics variables and handlers
    $scope.lastSelectedSub = -1;
    $scope.expandSub = function (index) {

        $scope.clickedTable = '';

        if ($scope.lastSelectedSub != -1 && $scope.lastSelectedSub !== index) {
            $scope.keyspacesSidebar[$scope.lastSelectedSub].expand = false;
        }

        $scope.lastSelectedSub = index;
        if (index !== $scope.selectedIndex) {
            $scope.keyspacesSidebar[$scope.selectedIndex].expand = false;
        }
        if ($scope.keyspacesSidebar[index].expand === undefined) {
            $scope.keyspacesSidebar[index].expand = true;
        } else {
            $scope.keyspacesSidebar[index].expand = !$scope.keyspacesSidebar[index].expand;
        }

        //wait until the container is expanded and then fire-up the scrollbar
        $timeout(function () {
            $scope.$broadcast('rebuild:me');
        }, 500);

        //Open keyspace view
        $scope.openKeyspace($scope.keyspacesSidebar[index].keyspace_name);

    };


    $scope.clickedTable = '';

    $scope.activeClass = function (index) {
        return ($scope.keyspacesSidebar[index].expand === true) ? 'active' : '';
    };

    $scope.activeTableClass = function(table){
           return $scope.clickedTable === table ? 'color: #ffffff' : '';
    } ;




    $scope.openTable = function (keyspace, table) {
        $rootScope.$broadcast('openTableView', {keyspace: keyspace, table: table});
        $scope.clickedTable = table;
    };

    $scope.openKeyspace = function (keyspace) {
        $rootScope.$broadcast('openKeyspaceMainView', {keyspace: keyspace});
    }

});

cassApp.controller('KeyspaceMainCtrl', function ($scope, $rootScope, $timeout, $q, cassandraService, errorService) {
    //Under keyspaceview, show keyspace info
    //It has table, SQL queries and everything that can be inherited from keyspace info

    //$scope.error = errorService;

    $scope.breadcrumb = [$scope.clusterData.cluster_name];

    $scope.$on('openKeyspaceMainView', function (event, args) {
        $scope.SelectedKeyspaceView = 'keyspace';
        $scope.selectedKeyspace = args.keyspace;
    });

    $scope.$on('openTableView', function (event, args) {
        $scope.SelectedKeyspaceView = 'table';
        $scope.selectedTable = args.table;
    });
});


cassApp.controller('TableCtrl', function ($scope, $rootScope) {

    //$rootScope.breadcrumb = [$scope.clusterData.cluster_name, $scope.selectedKeyspace, $scope.selectedTable];

    $scope.SelectedTableOperation = 'browse';

    $scope.openBrowse = function(){
        $scope.SelectedTableOperation = 'browse';
    };

    $scope.openSchema = function(){
        $scope.SelectedTableOperation = 'structure';
    };

    $scope.openCQL = function(){
        $scope.SelectedTableOperation = 'cql';
    };

    $scope.getActiveBtnCql = function(){
        if(  $scope.SelectedTableOperation === 'cql')
            return 'active';
        else
            return '';
    };

    $scope.getActiveBtnSchema = function(){
        if(  $scope.SelectedTableOperation === 'structure')
            return 'active';
        else
            return '';
    };

    $scope.getActiveBtnBrowse = function(){
        if(  $scope.SelectedTableOperation === 'browse')
            return 'active';
        else
            return '';
    };


    $scope.$watch('selectedTable', function(newVal){
        //$scope.SelectedTableOperation = 'data';
        $rootScope.$broadcast('renderTableDataView');
        $scope.SelectedTableOperation = 'browse';
        if($scope.breadcrumb.length === 3){
            $scope.breadcrumb.pop();
            $scope.breadcrumb.push($scope.selectedTable);
        } else {
            $scope.breadcrumb.push($scope.selectedTable);
        }

    });

});

cassApp.controller('KeyspaceCtrl', function($scope, $rootScope, $timeout){
    /*
    $timeout(function(){
        console.log(document.getElementsByClassName('ui-grid-viewport')[1]);
        document.getElementsByClassName('ui-grid-viewport')[1].style.height = 'auto';
        console.log (document.getElementsByClassName('ui-grid-viewport')[1]);

    }, 500);
    */

    //$scope.activeBtn = 'structure';
    $scope.SelectedKeyspaceOperation = 'structure';

    if($scope.breadcrumb.length === 1){
        $scope.breadcrumb.push($scope.selectedKeyspace);
    } else {
        $scope.breadcrumb.pop();
    }

     $scope.openCQL = function(){
         $scope.SelectedKeyspaceOperation = 'cql';
         //$scope.activeBtn = 'cql';
     };

    $scope.openSchema = function(){
        $scope.SelectedKeyspaceOperation = 'structure';
        //$scope.activeBtn = 'structure';
    };

    $scope.getActiveBtnCql = function(){
        if(  $scope.SelectedKeyspaceOperation === 'cql')
            return 'active';
        else
            return '';
    };

    $scope.getActiveBtnSchema = function(){
        if(  $scope.SelectedKeyspaceOperation === 'structure')
            return 'active';
        else
            return '';
    };

    $scope.$watch('selectedKeyspace', function(newVal){
        //$scope.SelectedTableOperation = 'data';
        $rootScope.$broadcast('renderKeyspaceStructureView');
        $scope.SelectedKeyspaceOperation = 'structure';

        if($scope.breadcrumb.length === 2){
            $scope.breadcrumb.pop();
            $scope.breadcrumb.push($scope.selectedKeyspace);
        } else {
            $scope.breadcrumb.push($scope.selectedKeyspace);
        }
    });

});


cassApp.factory('tableServices', function(){
    return {
        prepareColData : function(columns, indexName){
            //It will prepare it in format of {name: , field:}
            //TODO: Handle nested objects results
            var results = [];
            _.each(columns, function (data) {
                results.push({name: data[indexName], field: data[indexName], enableCellEdit: true});
            });
            return results;
        },
        prepareView : function (columns, data, indexName){
            console.log(columns);
            return {
                columnDefs: this.prepareColData(columns, indexName),
                data: data
            }
        },
        dataMap: {
            "org.apache.cassandra.db.marshal.UTF8Type" : "text",
            "org.apache.cassandra.db.marshal.Int32Type" : "int",
            "org.apache.cassandra.db.marshal.BytesType" : "blob",
            "org.apache.cassandra.db.marshal.TimeUUIDType" : "timeuuid",
            "org.apache.cassandra.db.marshal.UUIDType" : "uuid",
            "org.apache.cassandra.db.marshal.LongType" : "bigint",
            "org.apache.cassandra.db.marshal.MapType" : "map",
            "org.apache.cassandra.db.marshal.InetAddressType" : "inet",
            "org.apache.cassandra.db.marshal.TimestampType" : "timestamp",
            "org.apache.cassandra.db.marshal.DoubleType" : "double",
            "org.apache.cassandra.db.marshal.BooleanType" : "boolean",
            "org.apache.cassandra.db.marshal.FloatType" : "float",
            "org.apache.cassandra.db.marshal.DecimalType" : "decimal"
        }
    }
});


cassApp.controller('TableDataViewCtrl', function ($scope, _, cassandraService, $q, tableServices) {

    //$scope.error = errorService;
    var iniView = function () {
        $q.all([cassandraService.getColumns($scope.selectedKeyspace, $scope.selectedTable), cassandraService.loadData($scope.selectedKeyspace, $scope.selectedTable)]).then(function (results) {
            var columnsTorender = results[0].data.results.rows;
            var dataTorender = results[1].data.results.rows;

            //console.log(results);

            //Now fire the CQL and results view
            //TODO: Add query status check
            /*
             $rootScope.$broadcast('renderResultsView', {
             columns: columnsTorender,
             data: dataTorender,
             keyspace: args.keyspace,
             table: args.table
             }); */

            var sortedCols = _.sortBy(columnsTorender, 'type');
            //Store columns for reference later
            $scope.columnsRef = columnsTorender;
            $scope.keyspaceRef = $scope.selectedKeyspace;
            $scope.tableRef = $scope.selectedTable;
            $scope.gridOptions = tableServices.prepareView(sortedCols, dataTorender, 'column_name');
            $scope.cql_input = 'select * from ' + $scope.selectedKeyspace + '.' + $scope.tableRef;


        }, function (error) {
            //TODO: Add error widget
            //console.log(error);
            $scope.showErrorWidgetTimeout(error.data.message, error.data.details.message);
        });
    };



    //Define empty grid options to go around ui grid bug
    $scope.gridOptions = {
        enableColumnResizing: true
    };

    $scope.disableDelete = true;

    iniView();

    $scope.$on('renderTableDataView', function(event, args){
        iniView();
    });

    $scope.gridOptions.onRegisterApi = function (gridApi) {
        //set gridApi on scope
        $scope.gridApi = gridApi;
        gridApi.edit.on.afterCellEdit($scope, editAPI);
        gridApi.selection.on.rowSelectionChanged($scope, function (row) {
            if (row.isSelected) {
                $scope.disableDelete = false;
            } else {
                $scope.disableDelete = true;
            }
        });
    };



    $scope.addRow = function () {
        $scope.gridApi.cellNav.scrollTo($scope.gridOptions.data[$scope.gridOptions.data.length - 1], 0);
        $scope.gridOptions.data.push({});
        $scope.addValue = true;
    };

    $scope.deleteRows = function () {
        var colPrimaryKey = _.findWhere($scope.columnsRef, {type: "partition_key"});
        var selectedRows = $scope.gridApi.selection.getSelectedRows();
        _.each(selectedRows, function (row) {
            var colPrimaryValue = isNaN(row[colPrimaryKey.column_name]) ? "'" + row[colPrimaryKey.column_name] + "'" : row[colPrimaryKey.column_name];
            cassandraService.deleteRow($scope.keyspaceRef, $scope.tableRef, colPrimaryValue, colPrimaryKey.column_name).success(function (data) {

                $scope.gridOptions.data = _.without($scope.gridOptions.data, _.findWhere($scope.gridOptions.data, {$$hashKey: row["$$hashKey"]}));
                $scope.showSuccessWidgetTimeout("Query was executed successfully!");

            }).error(function (data) {
                //TODO: handle the error here
                //console.log(data);
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
            });
        });
    };

    var loadBackChanges = function(targetCol, oldValue, rowHashKey){
        var rowIndex = _.findIndex($scope.gridOptions.data, {$$hashKey: rowHashKey});
        $scope.gridOptions.data[rowIndex][targetCol] = oldValue;
    };

    var editAPI = function (rowEntity, colDef, newValue, oldValue) {
        ///Before we procced to edit, we will need to get the type of columns for reference
        // We support ONLY partition key as a refernce and ID type ONLY!!!
        var colPrimaryKey = _.findWhere($scope.columnsRef, {type: "partition_key"});
        var colClusteringKey = _.findWhere($scope.columnsRef, {type: "clustering_key"});
        //console.log(colPrimaryKey);

        //console.log(rowEntity)
        //Several Checks here
        var newValueModified = isNaN(newValue) ? "'" + newValue + "'" : newValue;
        if((colDef.name === colPrimaryKey.column_name && oldValue) || (colDef.name !== colPrimaryKey.column_name && rowEntity[colPrimaryKey.column_name])){
            cassandraService.updateTable(rowEntity[colPrimaryKey.column_name], $scope.keyspaceRef, $scope.tableRef, newValueModified, colDef.name, colPrimaryKey.column_name).success(function (data) {

                $scope.showSuccessWidgetTimeout("Query was executed successfully!");

            }).error(function (data) {
                //TODO: Error handler
                //console.log($scope);
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
                loadBackChanges(colDef.name, oldValue, rowEntity["$$hashKey"]);
            });
        } else {
            //New data 'INSERT'
            cassandraService.insertInTable($scope.keyspaceRef, $scope.tableRef, colDef.name, newValueModified).success(function (data) {

                $scope.showSuccessWidgetTimeout("Query was executed successfully!");

            }).error(function (data) {
                //TODO: Error handler
                //console.log(data);
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
                loadBackChanges(colDef.name, oldValue, rowEntity["$$hashKey"]);
            });
        }


        //buildUpdateCQL(newValue, oldValue, colDef.name, colPrimaryKey, rowEntity);
        //console.log(rowEntity);

    };

});

cassApp.controller('TableStructureViewCtrl', function ($scope, cassandraService, tableServices, _) {

    var iniView = function(){
         cassandraService.getColumns($scope.selectedKeyspace, $scope.selectedTable).success(function(data){

             var columnsTorender = [{name: 'column_name'}, {name: 'validator'}, {name: 'type'}];

             var formateData = function(data){
                 var results = [];
                 _.each(data, function(value, key){
                     value.validator = tableServices.dataMap[value.validator];
                     results.push(value);
                     //validator
                 });
                 return results;
             };

             var dataTorender = formateData(data.results.rows);

             $scope.gridOptions = tableServices.prepareView(columnsTorender, dataTorender, 'name');

             //Disable type edit
             $scope.gridOptions.columnDefs[2].enableCellEdit = false;

             $scope.columnsRef = columnsTorender;
             $scope.keyspaceRef = $scope.selectedKeyspace;
             $scope.tableRef = $scope.selectedTable;

         }).error(function(data){
             $scope.showErrorWidgetTimeout(data.message, data.details.message);
         });
    };

    $scope.gridOptions = {
        enableColumnResizing: true
    };

    $scope.disableDelete = true;

    $scope.$on('renderTableDataView', function(event, args){
        iniView();
    });

    iniView();

    //$scope.gridOptions.columnDefs.type.enableCellEdit = false;

    $scope.gridOptions.onRegisterApi = function (gridApi) {
        //set gridApi on scope
        $scope.gridApi = gridApi;
        gridApi.edit.on.afterCellEdit($scope, editAPI);
        gridApi.selection.on.rowSelectionChanged($scope, function (row) {
            if (row.isSelected) {
                $scope.disableDelete = false;
            } else {
                $scope.disableDelete = true;
            }
        });
    };


    var editAPI = function (rowEntity, colDef, newValue, oldValue) {
        var colPrimaryKey = _.findWhere($scope.columnsRef, {type: "partition_key"});
        var colClusteringKey = _.findWhere($scope.columnsRef, {type: "clustering_key"});

        //First Rename
        if(colDef.name === 'column_name' && oldValue) {
           //Rename Table
            cassandraService.executeCql("ALTER TABLE "+$scope.keyspaceRef+"."+$scope.tableRef + " RENAME "+oldValue+" TO "+newValue).success(function(data){
                $scope.showSuccessWidgetTimeout("Query was executed successfully!");
            }).error(function(data){
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
                iniView();
            })
        } else if (colDef.name === 'validator' && rowEntity.type){
            //Alter type
            cassandraService.executeCql("ALTER TABLE "+$scope.keyspaceRef+"."+$scope.tableRef + " ALTER "+rowEntity.column_name+" TYPE "+newValue).success(function(data){
                $scope.showSuccessWidgetTimeout("Query was executed successfully!");
            }).error(function(data){
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
                iniView();
            })
        } else if(!rowEntity.type && colDef.name === 'validator') {
             //Insert
             cassandraService.executeCql("ALTER TABLE "+$scope.keyspaceRef+"."+$scope.tableRef + " ADD " + rowEntity.column_name + " "+newValue).success(function(data){
                 $scope.showSuccessWidgetTimeout("Query was executed successfully!");
                 //Update the array
                 $scope.gridOptions.data = _.each($scope.gridOptions.data, function(value, key){
                    if(value.$$hashKey === rowEntity["$$hashKey"]){
                        value.type =  "regular";
                    }
                 });
             }).error(function(data){
                 $scope.showErrorWidgetTimeout(data.message, data.details.message);
                 iniView();
             })
        }

    };

    $scope.addCols= function () {
        $scope.gridApi.cellNav.scrollTo($scope.gridOptions.data[$scope.gridOptions.data.length - 1], 0);
        $scope.gridOptions.data.push({});
        $scope.addValue = true;
    };


    $scope.dropCols = function () {
        var selectedRows = $scope.gridApi.selection.getSelectedRows();
        _.each(selectedRows, function (row) {
            cassandraService.executeCql("ALTER TABLE "+$scope.keyspaceRef+"."+$scope.tableRef+" DROP " + row.column_name).success(function (data) {

                $scope.gridOptions.data = _.without($scope.gridOptions.data, _.findWhere($scope.gridOptions.data, {$$hashKey: row["$$hashKey"]}));
                $scope.showSuccessWidgetTimeout("Query was executed successfully!");

            }).error(function (data) {
                //TODO: handle the error here
                console.log(data);
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
            });
        });
    };

});

cassApp.controller('KeyspaceStructureViewCtrl', function($scope, _, cassandraService, tableServices, $q, $modal, $rootScope){
      var iniView = function() {
          $q.all([cassandraService.getTables($scope.selectedKeyspace), cassandraService.executeCql("SELECT * FROM system.schema_keyspaces WHERE keyspace_name = '" + $scope.selectedKeyspace + "'")]).then(function (results) {
              var columnsTorender = [{name: 'columnfamily_name'}, {name: 'type'}];
              var dataTorender = results[0].data.results.rows;
              $scope.gridOptions = tableServices.prepareView(columnsTorender, dataTorender, 'name');

              $scope.keyspaceInfo = results[1].data.results.rows[0];

              //Disable type edit
              $scope.gridOptions.columnDefs[0].enableCellEdit = false;
              $scope.gridOptions.columnDefs[1].enableCellEdit = false;


              $scope.columnsRef = columnsTorender;
              $scope.keyspaceRef = $scope.selectedKeyspace;
          }, function (error) {
              $scope.showErrorWidgetTimeout(error.data.message, error.data.details.message);
          });
      }


    $scope.gridOptions = {
        enableColumnResizing: false,
        enableHorizontalScrollbar: 0,
        enableVerticalScrollbar:2
    };

    $scope.disableDelete = true;

    $scope.$on('renderKeyspaceStructureView', function(event, args){
       iniView();
    });

    iniView();


    $scope.gridOptions.onRegisterApi = function (gridApi) {
        //set gridApi on scope
        $scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function (row) {
            if (row.isSelected) {
                $scope.disableDelete = false;
            } else {
                $scope.disableDelete = true;
            }
        });
    };

    $scope.addTable = function(){
        var modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: 'CreateTableModalCtrl',
            resolve: {
                selectedKeyspace: function(){
                    return $scope.selectedKeyspace;
                }
            }
        });


        modalInstance.result.then(function(results){
            var tableName = results.tableNames;
            var colName = results.colNames;
            $scope.showSuccessWidgetTimeout("Query was executed successfully!");
            iniView();
            $scope.$emit('updateTablesData', {columnfamily_name: tableName, keyspace_name: $scope.selectedKeyspace});
        });
    };



    $scope.dropTables = function () {
        var selectedRows = $scope.gridApi.selection.getSelectedRows();
        _.each(selectedRows, function (row) {
            cassandraService.executeCql("DROP TABLE "+$scope.keyspaceRef+"." + row.columnfamily_name).success(function (data) {
                //$scope.gridOptions.data = _.without($scope.gridOptions.data, _.findWhere($scope.gridOptions.data, {$$hashKey: row["$$hashKey"]}));
                iniView();
                $scope.showSuccessWidgetTimeout("Query was executed successfully!");
                $scope.$emit('deleteTablesData', {columnfamily_name: row.columnfamily_name, keyspace_name: $scope.keyspaceRef});

            }).error(function (data) {
                //TODO: handle the error here
                console.log(data);
                $scope.showErrorWidgetTimeout(data.message, data.details.message);
            });
        });
    };
});


cassApp.controller('CreateTableModalCtrl', function ($scope, $modalInstance, selectedKeyspace, cassandraService) {

    $scope.showError = false;

    $scope.ok = function () {

        if($scope.inputTableName && $scope.columnsNames){
            cassandraService.executeCql("CREATE TABLE "+selectedKeyspace + "." +$scope.inputTableName+" (" + $scope.columnsNames + ")").success(function(data){
                //$scope.gridOptions.data.push({columnfamily_name : tableName});
                $modalInstance.close({tableNames:$scope.inputTableName, colNames:$scope.columnsNames});
            }).error(function(data){
                $scope.errorMsg = data.message;
                $scope.errorDetails = data.details.message;
                $scope.showError = true;
            });
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});


cassApp.controller('CQLDataCtrl', function($scope, tableServices, cassandraService, _){

    $scope.showResults = false;

    $scope.gridOptions = {
        enableColumnResizing: false
    };

    $scope.runQuery = function () {
        var query = $scope.cql_input;
        //TODO: Add string check here

        cassandraService.executeCql(query).success(function (data) {
            //TODO: Add query status check
            if(!_.isEmpty(data.results.rows)) {
                var colResults = data.results.meta.columns;
                var dataResults = data.results.rows;
                console.log(dataResults);
                $scope.gridOptions = tableServices.prepareView(colResults, dataResults, 'name');
                //console.log($scope.gridOptions);
                //console.log(data);
                $scope.showSuccessWidgetTimeout("Query was executed successfully!");
                $scope.showResults = true;
            } else {
                $scope.showSuccessWidgetTimeout("The table is empty!");
            }


        }).error(function (error) {
            //TODO: Add error widget
            console.log(error);
            $scope.showErrorWidgetTimeout(error.message, error.details.message);
        });
    };

});





