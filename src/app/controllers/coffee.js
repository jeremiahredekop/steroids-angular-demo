// Since we are using the Cordova SQLite plugin, initialize AngularJS only after deviceready
document.addEventListener("deviceready", function() {
  angular.bootstrap(document, ['coffeeApp']);
});

var coffeeApp = angular.module('coffeeApp', ['CoffeeModel', 'hmTouchevents']);

// Index: http://localhost/views/coffee/index.html
coffeeApp.controller('IndexCtrl', function ($scope, Coffee) {

  // Populated by $scope.loadCoffees
  $scope.coffees = [];

  // Helper function for opening new webviews
  $scope.open = function(id) {
    webView = new steroids.views.WebView("/views/coffee/show.html?id="+id);
    steroids.layers.push(webView);
  };

  $scope.loadCoffees = function() {
    $scope.loading = true;

    persistence.clean();  // Clean persistence.js cache before making a query

    // Persistence.js query for all coffees in the database
    Coffee.all().list(function(coffees) {
      $scope.coffees = coffees;
      $scope.loading = false;
      $scope.$apply();
    });

  };

  // Fetch all objects from the backend (see app/models/coffee.js)
  $scope.loadCoffees();

  // Get notified when an another webview modifies the data and reload
  window.addEventListener("message", function(event) {
    // reload data on message with reload status
    if (event.data.status === "reload") {
      $scope.loadCoffees();
    };
  });


  // -- Native navigation

  // Set up the navigation bar
  steroids.view.navigationBar.show("Coffee index");

  // Define a button for adding a new coffee
  var addButton = new steroids.buttons.NavigationBarButton();
  addButton.title = "Add";

  // Set a callback for the button's tap action...
  addButton.onTap = function() {
    var addView = new steroids.views.WebView("/views/coffee/new.html");
    steroids.modal.show(addView);
  };

  // ...and finally show it on the navigation bar.
  steroids.view.navigationBar.setButtons({
    right: [addButton]
  });


});


// Show: http://localhost/views/coffee/show.html?id=<id>

coffeeApp.controller('ShowCtrl', function ($scope, Coffee) {

  // Helper function for loading coffee data with spinner
  $scope.loadCoffee = function() {
    $scope.loading = true;

    persistence.clean(); // Clean persistence.js cache before making a query

    // Fetch a single object from the database
    Coffee.findBy(persistence, 'id', steroids.view.params.id, function(coffee) {
      $scope.coffee = coffee;
      $scope.loading = false;
      steroids.view.navigationBar.show(coffee.name);
      $scope.$apply();
    });

  };

  // Save current coffee id to localStorage (edit.html gets it from there)
  localStorage.setItem("currentCoffeeId", steroids.view.params.id);

  var coffee = new Coffee()
  $scope.loadCoffee()

  // When the data is modified in the edit.html, get notified and update (edit will be on top of this view)
  window.addEventListener("message", function(event) {
    if (event.data.status === "reload") {
      $scope.loadCoffee();
    };
  });

  // -- Native navigation
  var editButton = new steroids.buttons.NavigationBarButton();
  editButton.title = "Edit";

  editButton.onTap = function() {
    webView = new steroids.views.WebView("/views/coffee/edit.html");
    steroids.modal.show(webView);
  }

  steroids.view.navigationBar.setButtons({
    right: [editButton]
  });


});


// New: http://localhost/views/coffee/new.html

coffeeApp.controller('NewCtrl', function ($scope, Coffee) {

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.create = function(options) {
    $scope.loading = true;

    var coffee = new Coffee(options);

    // Add the new object to the database and then persist it with persistence.flush()
    persistence.add(coffee);
    persistence.flush(function() {

      // Notify index.html to reload data
      var msg = { status: 'reload' };
      window.postMessage(msg, "*");

      $scope.close();
      $scope.loading = false;

    }, function() {
      $scope.loading = false;

      alert("Error when creating the object, is SQLite configured correctly?");

    });

  }

  $scope.coffee = {};

});


// Edit: http://localhost/views/coffee/edit.html

coffeeApp.controller('EditCtrl', function ($scope, Coffee) {

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.update = function(options) {
    $scope.loading = true;

    var coffee = new Coffee(options);

    // Update the database by adding the updated object, then persist the change with persistence.flush()
    persistence.add(coffee);
    persistence.flush(function() {

      window.setTimeout(function(){
        // Notify show.html below to reload data
        var msg = { status: "reload" };
        window.postMessage(msg, "*");
        $scope.close();
      }, 1000);

      $scope.loading = false;

    });

  };

  // Helper function for loading coffee data with spinner
  $scope.loadCoffee = function() {
    $scope.loading = true;

    var id  = localStorage.getItem("currentCoffeeId");

    // Fetch a single object from the database
    Coffee.findBy(persistence, 'id', id, function(coffee) {
      $scope.coffee = coffee;
      $scope.loading = false;

      $scope.$apply();
    });
  };

  $scope.loadCoffee();

});