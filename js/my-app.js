var fs_from_spending_dateCal;
var fs_to_spending_dateCal;

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

// database
if (window.openDatabase) {
  var mydb = openDatabase("budget_me", "0.1", "Budget Me DB", 1024 * 1024 * 50);

  mydb.transaction(function (t) {
    t.executeSql("CREATE TABLE IF NOT EXISTS spending (id INTEGER PRIMARY KEY ASC, name, brand, location, descr, spent, spending_date, is_del, upd_date)");
    t.executeSql("CREATE TABLE IF NOT EXISTS budget (month_year PRIMARY KEY, budget, is_del, upd_date)");
    t.executeSql("CREATE TABLE IF NOT EXISTS name (name PRIMARY KEY)");
    t.executeSql("CREATE TABLE IF NOT EXISTS brand (name PRIMARY KEY)");
    t.executeSql("CREATE TABLE IF NOT EXISTS location (name PRIMARY KEY)");
  });
} else {
  myApp.alert("Not supported on your phone.");
}

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

// check whether empty
function isEmpty(value) {
  if (typeof value === 'undefined' || value.trim()==='')
    return true;
  return false;
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

// add 0 to number -- 2 digits
Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}

// format date to yyyy-MM-dd hh:mm:ss
function getFormattedDateYMDHMS (d) {
  return [d.getFullYear(),
              (d.getMonth()+1).padLeft(),
               d.getDate().padLeft(),
               ].join('-') +' ' +
              [d.getHours().padLeft(),
               d.getMinutes().padLeft(),
               d.getSeconds().padLeft()].join(':');
}

function getMonthString(month) {
  var monthStr = '';
  var monthNumber = Number(month);

  switch (monthNumber) {
    case 1:
        monthStr = "January";
        break;
    case 2:
        monthStr = "February";
        break;
    case 3:
        monthStr = "March";
        break;
    case 4:
        monthStr = "April";
        break;
    case 5:
        monthStr = "May";
        break;
    case 6:
        monthStr = "June";
        break;
    case 7:
        monthStr = "July";
        break;
    case 8:
        monthStr = "August";
        break;
    case 9:
        monthStr = "September";
        break;
    case 10:
        monthStr = "October";
        break;
    case 11:
        monthStr = "November";
        break;
    case 12:
        monthStr = "December";
        break;
  }

  return monthStr;
}

// convert date to GMT+7
function convertDateToGMT7(rawD) {
  return new Date(rawD.getTime() + rawD.getTimezoneOffset()*60*1000 + 7*60*60*1000);
}







myApp.onPageInit('spending', function (page) {
  listSpending();
});

myApp.onPageInit('spendingAdd', function (page) {
    var spending_dateCal = myApp.calendar({
        input: '#spending_date',
        closeOnSelect: true,
    });

    //check to ensure the mydb object has been created
    if (mydb) {
        //Get all the cars from the database with a select statement, set outputCarList as the callback function for the executeSql command
        mydb.transaction(function (t) {
            setAutoComplete(t,'name','#name');
            setAutoComplete(t,'brand','#brand');
            setAutoComplete(t,'location','#location');
        });
    } 
});

myApp.onPageInit('spendingFilter', function (page) {
    mydb.transaction(function (t) {
      setAutoComplete(t,'name','#fs_name');
      setAutoComplete(t,'brand','#fs_brand');
      setAutoComplete(t,'location','#fs_location');
    });

    fs_from_spending_dateCal = myApp.calendar({
        input: '#fs_from_spending_date',
        closeOnSelect: true,
        onClose: function (p, values, displayValues) {
                    localStorage.fs_from_spending_date = document.getElementById('fs_from_spending_date').value;
                  }
    });
    if (!isEmpty(localStorage.fs_from_spending_date)) {
      document.getElementById('fs_from_spending_date').value = localStorage.fs_from_spending_date;
    }

    fs_to_spending_dateCal = myApp.calendar({
        input: '#fs_to_spending_date',
        closeOnSelect: true,
        onClose: function (p, values, displayValues) {
                    localStorage.fs_to_spending_date = document.getElementById('fs_to_spending_date').value;
                  }
    });
    if (!isEmpty(localStorage.fs_to_spending_date)) {
      document.getElementById('fs_to_spending_date').value = localStorage.fs_to_spending_date;
    }

    $('#fs_name').focusout(function() {
      localStorage.fs_name = document.getElementById('fs_name').value;
    });
    if (!isEmpty(localStorage.fs_name)) {
      document.getElementById('fs_name').value = localStorage.fs_name;
    }

    $('#fs_brand').focusout(function() {
      localStorage.fs_brand = document.getElementById('fs_brand').value;
    });
    if (!isEmpty(localStorage.fs_brand)) {
      document.getElementById('fs_brand').value = localStorage.fs_brand;
    }

    $('#fs_location').focusout(function() {
      localStorage.fs_location = document.getElementById('fs_location').value;
    });
    if (!isEmpty(localStorage.fs_location)) {
      document.getElementById('fs_location').value = localStorage.fs_location;
    }
});







// Add SPENDING
function spendingAdd() {
  //check to ensure the mydb object has been created
  if (mydb) {
      //get the values of the make and model text inputs
      var name = document.getElementById("name").value;
      var brand = document.getElementById("brand").value;
      var location = document.getElementById("location").value;
      var descr = document.getElementById("descr").value;
      var spent = document.getElementById("spent").value;
      var spending_date = document.getElementById("spending_date").value;
      var is_del = 0;
      var upd_date = getFormattedDateYMDHMS(convertDateToGMT7(new Date()));

      //Test to ensure that the user has entered both a make and model
      if (name!=="" && spent!=="" && spending_date!=="") {
          //Insert the user entered details into the cars table, note the use of the ? placeholder, these will replaced by the data passed in as an array as the second parameter
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO spending (name, brand, location, descr, spent, spending_date, is_del, upd_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [name, brand, location, descr, spent, spending_date, is_del, upd_date]);              
              listSpending();
              mainView.router.back();
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO name (name) VALUES (?)", [name]);
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO brand (name) VALUES (?)", [brand]);
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO location (name) VALUES (?)", [location]);
          });
      } else {
          myApp.alert("Input not complete!");
      }
  } else {
      myApp.alert("Not supported on your phone.");
      mainView.router.back();
  }
}

// Edit SPENDING
function spendingEdit(id) {
  //check to ensure the mydb object has been created
  if (mydb) {
      //get the values of the make and model text inputs
      var name = document.getElementById("name").value;
      var brand = document.getElementById("brand").value;
      var location = document.getElementById("location").value;
      var descr = document.getElementById("descr").value;
      var spent = document.getElementById("spent").value;
      var spending_date = document.getElementById("spending_date").value;
      var is_del = 0;
      var upd_date = getFormattedDateYMDHMS(convertDateToGMT7(new Date()));

      //Test to ensure that the user has entered both a make and model
      if (name!=="" && spent!=="" && spending_date!=="") {
          //Insert the user entered details into the cars table, note the use of the ? placeholder, these will replaced by the data passed in as an array as the second parameter
          mydb.transaction(function (t) {
              t.executeSql("UPDATE spending SET name=?, brand=?, location=?, descr=?, spent=?, spending_date=?, is_del=?, upd_date=? WHERE id=?", [name, brand, location, descr, spent, spending_date, is_del, upd_date, id]);              
              listSpending();
              mainView.router.back();
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO name (name) VALUES (?)", [name]);
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO brand (name) VALUES (?)", [brand]);
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO location (name) VALUES (?)", [location]);
          });
      } else {
          myApp.alert("Input not complete!");
      }
  } else {
      myApp.alert("Not supported on your phone.");
      mainView.router.back();
  }
}

// Delete SPENDING
function spendingDel(id) {
  //check to ensure the mydb object has been created
  if (mydb) {
    mydb.transaction(function (t) {
      t.executeSql("DELETE FROM spending WHERE id=?", [id]);
      listSpending();
      mainView.router.back();
    });
  } else {
      myApp.alert("Not supported on your phone.");
      mainView.router.back();
  }
}

// list SPENDING
function listSpending() {
  //check to ensure the mydb object has been created
  if (mydb) {
      //Get all the cars from the database with a select statement, set outputCarList as the callback function for the executeSql command
      mydb.transaction(function (t) {
          var sqlStr = "SELECT * FROM spending WHERE 1 ";
          if (!isEmpty(localStorage.fs_from_spending_date)) {
            sqlStr += "AND spending_date >= '"+localStorage.fs_from_spending_date+"' ";
          } else
          if (!isEmpty(localStorage.fs_to_spending_date)) {
            sqlStr += "AND spending_date <= '"+localStorage.fs_to_spending_date+"' ";
          }
          if (!isEmpty(localStorage.fs_name)) {
            sqlStr += "AND name = '"+localStorage.fs_name+"' ";
          }
          if (!isEmpty(localStorage.fs_brand)) {
            sqlStr += "AND brand = '"+localStorage.fs_brand+"' ";
          }
          if (!isEmpty(localStorage.fs_location)) {
            sqlStr += "AND location = '"+localStorage.fs_location+"' ";
          }
          sqlStr += 'ORDER BY spending_date ASC';
          t.executeSql(sqlStr, [], listSpendingGenerate);
      });
  } else {
      listSpendingGenerate2();
  }
}

// generate list view for SPENDING
function listSpendingGenerate(transaction, results) {
  if (results.rows.length < 1) {
    document.getElementById('spendingWelcome').innerHTML = '<p>No data. Please edit filter or add spending.</p>';
    var spendingListContainer = document.getElementById('spendingListContainer');
    spendingListContainer.innerHTML = '';
  } else {
    document.getElementById('spendingWelcome').innerHTML = '';

    var spendingListContainer = document.getElementById('spendingListContainer');
    var i;
    var theInnerHtml = '';
    var itemsDateArray = [];
    var prevSpendingDate = '';
    var spendingTotalPerDay = 0;
    for (i = 0; i < results.rows.length; i++) {
        var row = results.rows.item(i);

        if (typeof itemsDateArray[row.spending_date] === 'undefined') {
            itemsDateArray[row.spending_date] = [];
        }

        if (prevSpendingDate!=row.spending_date && prevSpendingDate!=='') {
          theInnerHtml += 
            '<div class="content-block-title" id="spendingHistoryTitle_'+prevSpendingDate+'">'+getFormattedDate(prevSpendingDate)+'<br />'+numberWithCommas(spendingTotalPerDay.toString())+'</div>\n' + 
            '<div class="list-block virtual-list media-list" id="spendingHistoryList_'+prevSpendingDate+'"></div>\n';

          spendingTotalPerDay = 0;
        }
        spendingTotalPerDay += Number(row.spent.split(',').join(''));

        var jsonData = {};
        jsonData['id'] = row.id;
        jsonData['name'] = row.name;
        jsonData['location'] = row.location;
        jsonData['descr'] = row.descr;
        jsonData['spent'] = row.spent;
        itemsDateArray[row.spending_date].push(jsonData);

        prevSpendingDate = row.spending_date;
    }
    theInnerHtml += 
      '<div class="content-block-title" id="spendingHistoryTitle_'+prevSpendingDate+'">'+getFormattedDate(prevSpendingDate)+'<br />'+numberWithCommas(spendingTotalPerDay.toString())+'</div>\n' + 
      '<div class="list-block virtual-list media-list" id="spendingHistoryList_'+prevSpendingDate+'"></div>\n';

    spendingListContainer.innerHTML = theInnerHtml;

    for (var k in itemsDateArray){
        myApp.virtualList('#spendingHistoryList_'+k, {
            // Array with plain HTML items
            items: itemsDateArray[k],
            // Template 7 template to render each item
            template: 
            '<li>\n' + 
            '  <a href="#" class="item-link item-content spending-edit" data-id="{{id}}">\n' + 
            '    <div class="item-inner" style="height:77px;">\n' + 
            '      <div class="item-title-row">\n' + 
            '        <div class="item-title">{{name}}</div>\n' + 
            '        <div class="item-after">{{spent}}</div>\n' + 
            '      </div>\n' + 
            '      <div class="item-subtitle">{{location}}</div>\n' + 
            '      <div class="item-text">{{descr}}</div>\n' + 
            '    </div>\n' + 
            '  </a>\n' + 
            '</li>',
            height:77
        });
    }

    $$('.spending-edit').on('click', function () {
      loadSpendingEdit($$(this).data('id'));
    });
  }
}

// DUMMY generate list view for SPENDING
function listSpendingGenerate2() {
  var results = [
    {
      id: '1',
      name: 'name A',
      location: 'location A',
      descr: '',
      spent: '20,000',
      spending_date: '2016-01-11'
    },
    {
      id: '2',
      name: 'name A',
      location: '',
      descr: '',
      spent: '20,000',
      spending_date: '2016-01-11'
    },
    {
      id: '3',
      name: 'name A',
      location: 'location A',
      descr: 'adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf ',
      spent: '20,000',
      spending_date: '2016-01-11'
    },
    {
      id: '4',
      name: 'name A',
      location: 'location A',
      descr: 'adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf adfadsf asdfasfdasf asdfasf ',
      spent: '20,000',
      spending_date: '2016-01-12'
    },
  ];

  if (results.length < 1) {
    document.getElementById('spendingWelcome').innerHTML = '<p>No data. Please edit filter or add spending.</p>';
    var spendingListContainer = document.getElementById('spendingListContainer');
    spendingListContainer.innerHTML = '';
  } else {
    document.getElementById('spendingWelcome').innerHTML = '';

    var spendingListContainer = document.getElementById('spendingListContainer');
    var i;
    var theInnerHtml = '';
    var itemsDateArray = [];
    var prevSpendingDate = '';
    var spendingTotalPerDay = 0;
    for (i = 0; i < results.length; i++) {
        var row = results[i];

        if (typeof itemsDateArray[row.spending_date] === 'undefined') {
            itemsDateArray[row.spending_date] = [];
        }

        if (prevSpendingDate!=row.spending_date && prevSpendingDate!=='') {
          theInnerHtml += 
            '<div class="content-block-title" id="spendingHistoryTitle_'+prevSpendingDate+'">'+getFormattedDate(prevSpendingDate)+'<br />'+numberWithCommas(spendingTotalPerDay.toString())+'</div>\n' + 
            '<div class="list-block virtual-list media-list" id="spendingHistoryList_'+prevSpendingDate+'"></div>\n';

          spendingTotalPerDay = 0;
        }
        spendingTotalPerDay += Number(row.spent.split(',').join(''));

        var jsonData = {};
        jsonData['id'] = row.id;
        jsonData['name'] = row.name;
        jsonData['location'] = row.location;
        jsonData['descr'] = row.descr;
        jsonData['spent'] = row.spent;
        itemsDateArray[row.spending_date].push(jsonData);

        prevSpendingDate = row.spending_date;
    }
    theInnerHtml += 
      '<div class="content-block-title" id="spendingHistoryTitle_'+prevSpendingDate+'">'+getFormattedDate(prevSpendingDate)+'<br />'+numberWithCommas(spendingTotalPerDay.toString())+'</div>\n' + 
      '<div class="list-block virtual-list media-list" id="spendingHistoryList_'+prevSpendingDate+'"></div>\n';

    spendingListContainer.innerHTML = theInnerHtml;

    for (var k in itemsDateArray){
        myApp.virtualList('#spendingHistoryList_'+k, {
            // Array with plain HTML items
            items: itemsDateArray[k],
            // Template 7 template to render each item
            template: 
            '<li>\n' + 
            '  <a href="#" class="item-link item-content spending-edit" data-id="{{id}}">\n' + 
            '    <div class="item-inner" style="height:77px;">\n' + 
            '      <div class="item-title-row">\n' + 
            '        <div class="item-title">{{name}}</div>\n' + 
            '        <div class="item-after">{{spent}}</div>\n' + 
            '      </div>\n' + 
            '      <div class="item-subtitle">{{location}}</div>\n' + 
            '      <div class="item-text">{{descr}}</div>\n' + 
            '    </div>\n' + 
            '  </a>\n' + 
            '</li>',
            height:77
        });
    }

    $$('.spending-edit').on('click', function () {
      loadSpendingEdit($$(this).data('id'));
    });
  }
}

// load spending data to edit
function loadSpendingEdit(id) {
  if (mydb) {
      //Get all the cars from the database with a select statement, set outputCarList as the callback function for the executeSql command
      mydb.transaction(function (t) {
          t.executeSql("SELECT * FROM spending WHERE id=?", [id], function (transaction, results) {
            if (results.rows.length>=1) {
              loadSpendingEditPage(results.rows.item(0));
            }
          });
          // t.executeSql("SELECT * FROM name", [], showNames);
      });
  } else {
      var data = {};
      data['id']=1;
      data['spending_date']='2015-12-12';
      data['name']='Sepatu';
      loadSpendingEditPage(data);
  }
}

// load Edit Spending page
function loadSpendingEditPage (data) {
  mainView.router.loadContent(
    '<!-- Top Navbar-->\n' + 
    '<div class="navbar">\n' + 
    '  <div class="navbar-inner">\n' + 
    '    <div class="left"><a href="#" class="back link"> <i class="icon icon-back"></i><span>Back</span></a></div>\n' + 
    '    <div class="center sliding">Edit Spending</div>\n' + 
    '    <div class="right">\n' + 
    '      <a href="#" class="link icon-only open-panel"> <i class="icon icon-bars"></i></a>\n' + 
    '    </div>\n' + 
    '  </div>\n' + 
    '</div>\n' + 
    '<div class="pages">\n' + 
    '  <!-- Page, data-page contains page name-->\n' + 
    '  <div data-page="spendingAdd" class="page">\n' + 
    '    <!-- Scrollable page content-->\n' + 
    '    <div class="page-content">\n' + 
    '      <div class="content-block">\n' + 
    '        <div class="list-block">\n' + 
    '          <ul>\n' + 
    '            <li>\n' + 
    '              <div class="item-content">\n' + 
    '                <div class="item-inner">\n' + 
    '                  <div class="item-input">\n' + 
    '                    <input type="text" placeholder="Spending date" readonly id="spending_date" value="'+data.spending_date+'">\n' + 
    '                  </div>\n' + 
    '                </div>\n' + 
    '              </div>\n' + 
    '            </li>\n' + 
    '            <li>\n' + 
    '              <div class="item-content">\n' + 
    '                <div class="item-inner">\n' + 
    '                  <div class="item-input">\n' + 
    '                    <input type="text" placeholder="Name" id="name" value="'+data.name+'">\n' + 
    '                  </div>\n' + 
    '                </div>\n' + 
    '              </div>\n' + 
    '            </li>\n' + 
    '            <li>\n' + 
    '              <div class="item-content">\n' + 
    '                <div class="item-inner">\n' + 
    '                  <div class="item-input">\n' + 
    '                    <input type="text" placeholder="Brand" id="brand" value="'+data.brand+'">\n' + 
    '                  </div>\n' + 
    '                </div>\n' + 
    '              </div>\n' + 
    '            </li>\n' + 
    '            <li>\n' + 
    '              <div class="item-content">\n' + 
    '                <div class="item-inner">\n' + 
    '                  <div class="item-input">\n' + 
    '                    <input type="text" placeholder="Where do you buy?" id="location" value="'+data.location+'">\n' + 
    '                  </div>\n' + 
    '                </div>\n' + 
    '              </div>\n' + 
    '            </li>\n' + 
    '            <li>\n' + 
    '              <div class="item-content">\n' + 
    '                <div class="item-inner">\n' + 
    '                  <div class="item-input">\n' + 
    '                    <input type="text" placeholder="Description" id="descr" value="'+data.descr+'">\n' + 
    '                  </div>\n' + 
    '                </div>\n' + 
    '              </div>\n' + 
    '            </li>\n' + 
    '            <li>\n' + 
    '              <div class="item-content">\n' + 
    '                <div class="item-inner">\n' + 
    '                  <div class="item-input">\n' + 
    '                    <input type="tel" placeholder="How much?" onkeypress="return isNumberKey(event);" onkeyup="this.value=numberWithCommas(this.value);" id="spent" value="'+data.spent+'">\n' + 
    '                  </div>\n' + 
    '                </div>\n' + 
    '              </div>\n' + 
    '            </li>\n' + 
    '          </ul>\n' + 
    '        </div>\n' + 
    '        <div class="row">\n' + 
    '          <div class="col-50">\n' + 
    '            <a href="#" class="button button-big button-fill color-gray" style="background-color:red;" onclick="spendingDel('+data.id+');">Delete</a>\n' + 
    '          </div>\n' + 
    '          <div class="col-50">\n' + 
    '            <a href="#" class="button button-big button-fill color-gray" style="background-color:grey;" onclick="spendingEdit('+data.id+');">Edit</a>\n' + 
    '          </div>\n' + 
    '        </div>\n' + 
    '      </div>\n' + 
    '    </div>\n' + 
    '  </div>\n' + 
    '</div>\n'
  );
  return;
}

// clear spending filter
function spendingFilterClear() {
  fs_from_spending_dateCal.setValue('');
  fs_to_spending_dateCal.setValue('');
  document.getElementById('fs_name').value = '';
  document.getElementById('fs_brand').value = '';
  document.getElementById('fs_location').value = '';

  localStorage.fs_from_spending_date = '';
  localStorage.fs_to_spending_date = '';
  localStorage.fs_name = '';
  localStorage.fs_brand = '';
  localStorage.fs_location = '';
}



function budgetAdd() {
  if (mydb) {
      //get the values of the make and model text inputs
      var budget_month = document.getElementById('budget_month').value.trim();
      var budget_year = document.getElementById("budget_year").value.trim();
      var budget = document.getElementById("budget").value.trim();
      var budgetNumber = Number(budget.split(',').join(''));

      //Test to ensure that the user has entered both a make and model
      if (budget_month!=="" && budget_year!=="" && budget!=="" && budgetNumber!=0) {
        mydb.transaction(function (t) {  
          t.executeSql("SELECT COUNT(1) FROM budget WHERE month_year='"+budget_year+"-"+budget_month+"' ", [], 
            function (transaction, results) {
              if (results.rows.length>0 && Number(results.rows.item(0))>0) {
                myApp.prompt("Budget exists for "+getMonthString(budget_month)+" "+budget_year+".\n"+
                  "Please re-input month and year in MM-YYYY.\n"+
                  "E.g.: 01-2016", 
                  'Data Exists', 
                  function (value) {
                    mydb.transaction(function (t) {
                        t.executeSql("UPDATE budget ", [name, brand, location, descr, spent, spending_date, is_del, upd_date]);              
                        listSpending();
                        mainView.router.back();
                    });
                    myApp.alert('Budget for '+getMonthString(budget_month)+" "+budget_year+'\n'+
                      'is now '+budget); 
                  }
                );
              } else {

              }
            }
          );
        });

          //Insert the user entered details into the cars table, note the use of the ? placeholder, these will replaced by the data passed in as an array as the second parameter
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO spending (name, brand, location, descr, spent, spending_date, is_del, upd_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [name, brand, location, descr, spent, spending_date, is_del, upd_date]);              
              listSpending();
              mainView.router.back();
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO name (name) VALUES (?)", [name]);
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO brand (name) VALUES (?)", [brand]);
          });
          mydb.transaction(function (t) {
              t.executeSql("INSERT INTO location (name) VALUES (?)", [location]);
          });
      } else {
          myApp.alert("Invalid input or incomplete!");
      }
  } else {
      myApp.alert("Not supported on your phone.");
      mainView.router.back();
  }
}