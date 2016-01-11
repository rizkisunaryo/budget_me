// Initialize your app
var myApp = new Framework7({
    swipePanel: 'left',
    modalTitle: 'Budget Me',
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

// enable BACK button
$$('.panel-left').on('opened', function () {
  isLeftPanelOpen = 1;
});
$$('.panel-left').on('close', function () {
  isLeftPanelOpen = 0;
});

document.addEventListener("backbutton", onBackKeyDown, false);
function onBackKeyDown(e) {
  if (isLeftPanelOpen==1) {
    myApp.closePanel();
    isLeftPanelOpen = 0;
  } else {
    mainView.router.back();
  }
  
  e.preventDefault();
}

// database
if (window.openDatabase) {
  var mydb = openDatabase("budget_me", "0.1", "Budget Me DB", 1024 * 1024 * 50);

  mydb.transaction(function (t) {
    t.executeSql("CREATE TABLE IF NOT EXISTS spending (id INTEGER PRIMARY KEY ASC, name, brand, descr, spent, spent_date, is_del, upd_date)");
    t.executeSql("CREATE TABLE IF NOT EXISTS budget (month_year, budget, is_del, upd_date)");
    t.executeSql("CREATE TABLE IF NOT EXISTS name (name PRIMARY KEY)");
    t.executeSql("CREATE TABLE IF NOT EXISTS brand (name PRIMARY KEY)");
  });
} else {
  myApp.alert("Browser Anda tidak mendukung WebSQL!");
}

// autocomplete
function setAutoComplete(t, tableName, selectorLabel) {
  t.executeSql("SELECT * FROM " + tableName + " ORDER BY name", [], function (transaction, results) {
    var availableTags = [];
    for (i=0; i<results.rows.length; i++) 
      availableTags.push(results.rows.item(i).name);
    $(selectorLabel).autocomplete({
      delay: 0,
      source: availableTags
    });
  });
}

// input for number only
function isNumberKey(evt){
    var charCode = (evt.which) ? evt.which : evt.keyCode
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
}
function numberWithCommas(x) {
    //remove commas
    retVal = x ? parseFloat(x.replace(/,/g, '')) : 0;
    if (retVal==0) return '';

    //apply formatting
    return retVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// format date
function getFormattedDate(dateYmd) {
  var d = new Date(dateYmd);

  var day = d.getDay();
  var date = d.getDate();
  var month = d.getMonth();
  var year = d.getFullYear();

  var dayStr = '';
  switch (day) {
    case 0:
        dayStr = "Minggu";
        break;
    case 1:
        dayStr = "Senin";
        break;
    case 2:
        dayStr = "Selasa";
        break;
    case 3:
        dayStr = "Rabu";
        break;
    case 4:
        dayStr = "Kamis";
        break;
    case 5:
        dayStr = "Jum'at";
        break;
    case 6:
        dayStr = "Sabtu";
        break;
  } 

  var monthStr = '';
  switch (month) {
    case 0:
      monthStr = 'Januari';
      break;
    case 1:
      monthStr = 'Februari';
      break;
    case 2:
      monthStr = 'Maret';
      break;
    case 3:
      monthStr = 'April';
      break;
    case 4:
      monthStr = 'Mei';
      break;
    case 5:
      monthStr = 'Juni';
      break;
    case 6:
      monthStr = 'Juli';
      break;
    case 7:
      monthStr = 'Agustus';
      break;
    case 8:
      monthStr = 'September';
      break;
    case 9:
      monthStr = 'Oktober';
      break;
    case 10:
      monthStr = 'November';
      break;
    case 11:
      monthStr = 'Desember';
      break;
  }

  return dayStr+', '+date+' '+monthStr+' '+year;
}

// Callbacks to run specific code for specific pages, for example for About page:
myApp.onPageInit('about', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});







