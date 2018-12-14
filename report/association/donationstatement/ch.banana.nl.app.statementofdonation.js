// Copyright [2018] [Banana.ch SA - Lugano Switzerland]
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// @id = ch.banana.nl.app.statementofdonation.js
// @api = 1.0
// @pubdate = 2018-12-14
// @publisher = Banana.ch SA
// @description = Kwitantie voor giften in Nederland
// @description.nl = Kwitantie voor giften in Nederland
// @description.en = Statement of donation for Associations in Netherlands
// @doctype = *
// @task = app.command

/*
*   This BananaApp prints a donation statement for all the selected donators and period.
*   Donators can be:
*   - a single donator (with or without ";") => (i.e. "10001" or  ";10011")
*   - more donators (with or without ";") separated by "," => (i.e. "10001, ;10011,;10012")
*   - all the donators (empty field) => (i.e. "")
*   
*   It works for a single donation or multiple donations during the selected period.
*   It works for simple and double accounting files.
*/

var texts;

/* Main function that is executed when starting the app */
function exec(inData, options) {
    
    if (!Banana.document) {
        return "@Cancel";
    }

    texts = loadTexts(Banana.document);
    var userParam = initUserParam();

    // Retrieve saved param
    var savedParam = Banana.document.getScriptSettings();
    if (savedParam && savedParam.length > 0) {
        userParam = JSON.parse(savedParam);
    }

    // If needed show the settings dialog to the user
    if (!options || !options.useLastSettings) {
        userParam = settingsDialog(); // From properties
    }

    if (!userParam) {
        return "@Cancel";
    }

    /* 3) Creates the report */
    var report = createReport(Banana.document, userParam.selectionStartDate, userParam.selectionEndDate, userParam);            
    var stylesheet = createStyleSheet(userParam);
    Banana.Report.preview(report, stylesheet);
}

/* The report is created using the selected period and the data of the dialog */
function createReport(banDoc, startDate, endDate, userParam) {

    var report = Banana.Report.newReport(texts.reportTitle);
    var lang = getLang(banDoc);

    // Get the list of all the donors (CC3)
    var membershipList = getCc3Accounts(banDoc);
    var donorsToPrint = [];

    if (userParam.costcenter) {
        var list = userParam.costcenter.split(",");
        for (var i = 0; i < list.length; i++) {
            list[i] = list[i].trim();
            
            // If user insert the Cc3 account without ";" we add it
            if (list[i].substring(0,1) !== ";") {
                list[i] = ";"+list[i];
            }

            if (membershipList.indexOf(list[i]) > -1) { //Cc3 exists
                donorsToPrint.push(list[i]);           
            }
            else { // Cc3 does not exists
                Banana.document.addMessage(texts.warningMessage + ": <" + list[i] + ">");              
            }
        }
        if (donorsToPrint.length < 1) {
            return "@Cancel";
        }
    }
    else if (!userParam.costcenter || userParam.costcenter === "" || userParam.costcenter === undefined) { //Empty field, so we take all the Cc3
        donorsToPrint = membershipList;
    }

    // Create the report for the inserted cc3 accounts (or all cc3 accounts if empty)
    for (var k = 0; k < donorsToPrint.length; k++) {

        var transactionsObj = calculateTotalTransactions(banDoc, donorsToPrint[k], startDate, endDate);
        var totalOfDonations = transactionsObj.total;
        var numberOfDonations = transactionsObj.numberOfTransactions;
        var trDate = getTransactionDate(banDoc, donorsToPrint[k], startDate, endDate);
        var titleText = "";
        var text = "";
        
        // Address of the sender (Organization)
        var company = banDoc.info("AccountingDataBase","Company");
        var name = banDoc.info("AccountingDataBase","Name");
        var familyName = banDoc.info("AccountingDataBase","FamilyName");
        var address1 = banDoc.info("AccountingDataBase","Address1");
        var address2 = banDoc.info("AccountingDataBase","Address2");
        var zip = banDoc.info("AccountingDataBase","Zip");
        var city = banDoc.info("AccountingDataBase","City");
        var country = banDoc.info("AccountingDataBase","Country");
        var phone = banDoc.info("AccountingDataBase","Phone");
        var web = banDoc.info("AccountingDataBase","Web");
        var email = banDoc.info("AccountingDataBase","Email");

        var tableAddress = report.addTable("tableAddress");
        tableAddress.setStyleAttributes("width:100%");
        var col1 = tableAddress.addColumn("col1").setStyleAttributes("width:60%");
        var col2 = tableAddress.addColumn("col2").setStyleAttributes("width:40%");
        
        var row = tableAddress.addRow();
        var addressCell = row.addCell();
        if (company) {
            addressCell.addParagraph(company, "");
        }
        if (name && familyName) {
            addressCell.addParagraph(name + " " + familyName, "");
        } else if (!name && familyName) {
            addressCell.addParagraph(familyName, "");
        } else if (name && !familyName) {
            addressCell.addParagraph(name, "");
        }

        if (address1) {
            addressCell.addParagraph(address1, "");
        }
        if (address2) {
            addressCell.addParagraph(address2, "");
        }

        if (zip && city) {
            addressCell.addParagraph(zip + " " + city, "");
        }

        if (phone) {
            addressCell.addParagraph("Tel. " + phone);
        } else {
            addressCell.addParagraph(" ", "");
        }

        if (web) {
            addressCell.addParagraph("Web: " + web);
        } else {
            addressCell.addParagraph(" ", "");
        }

        if (email) {
            addressCell.addParagraph("Email: " + email);
        } else {
            addressCell.addParagraph(" ", "");
        }

        // Address of the membership (donor)
        var address = getAddress(banDoc, donorsToPrint[k]);
        if (address.nameprefix) {
            var row = tableAddress.addRow();
            row.addCell(" ", "", 1);
            row.addCell(address.nameprefix, "", 1);
        }

        if (address.firstname && address.familyname) {
            var row = tableAddress.addRow();
            row.addCell(" ", "", 1);
            row.addCell(address.firstname + " " + address.familyname, "", 1);
        } else if (!address.firstname && address.familyname) {
            var row = tableAddress.addRow();
            row.addCell(" ", "", 1);
            row.addCell(address.familyname, "", 1);
        }

        if (address.street) {
            var row = tableAddress.addRow();
            row.addCell(" ", "", 1);
            row.addCell(address.street, "", 1);
        }

        if (address.postalcode && address.locality) {
            var row = tableAddress.addRow();
            row.addCell(" ", "", 1);
            row.addCell(address.postalcode + " " + address.locality, "", 1);
        }

        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");

        // Title, text and table details of donations
        titleText = convertFields(banDoc, userParam.titleText, address, trDate, startDate, endDate, totalOfDonations, donorsToPrint[k]);
        report.addParagraph(titleText, "bold");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        if (userParam.text1) {
            text = convertFields(banDoc, userParam.text1, address, trDate, startDate, endDate, totalOfDonations, donorsToPrint[k]);
            addNewLine(report, text);
            report.addParagraph(" ", "");
        }   
        if (userParam.text2) {
            text = convertFields(banDoc, userParam.text2, address, trDate, startDate, endDate, totalOfDonations, donorsToPrint[k]);
            addNewLine(report, text);
            report.addParagraph(" ", "");
        }
        if (userParam.text3) {
            text = convertFields(banDoc, userParam.text3, address, trDate, startDate, endDate, totalOfDonations, donorsToPrint[k]);
            addNewLine(report, text);
            report.addParagraph(" ", "");
        }
        if (userParam.text4) {
            text = convertFields(banDoc, userParam.text4, address, trDate, startDate, endDate, totalOfDonations, donorsToPrint[k]);
            addNewLine(report, text);
            report.addParagraph(" ", "");
        }

        // Print a transactions detail in case there is more than one donation
        if (userParam.details) {
            report.addParagraph(" ", "");
            printTransactionTable(banDoc, report, donorsToPrint[k], startDate, endDate);
            report.addParagraph(" ", "");
            report.addParagraph(" ", "");
        }

        // Signature
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        report.addParagraph(" ", "");
        
        var tableSignature = report.addTable("table04");
        tableSignature.setStyleAttributes("width:100%");
        var col1 = tableSignature.addColumn("col1").setStyleAttributes("width:60%");
        var col2 = tableSignature.addColumn("col2").setStyleAttributes("width:40%");

        tableRow = tableSignature.addRow();
        tableRow.addCell(userParam.localityAndDate, "bold", 1);
        tableRow.addCell(userParam.signature, "bold", 1);
        tableRow = tableSignature.addRow();
        tableRow.addCell();
        tableRow.addCell(company, "");

        if (userParam.printLogo) {
            tableRow = tableSignature.addRow();
            tableRow.addCell();
            tableRow.addCell().addImage(userParam.signatureImage, "imgSignature");
        }

        // Page break at the end of all the pages (except the last)
        if (k < donorsToPrint.length-1) {
            report.addPageBreak();
        }
    }

    return report;
}

/* Function that converts a month to a readable string */
function getMonthText(date, lang) {
    var month = "";
    if (lang === "nl") {
        switch (date.getMonth()) {
            case 0:
                month = "januari";
                break;
            case 1:
                month = "februari";
                break;
            case 2:
                month = "maart";
                break;
            case 3:
                month = "april";
                break;
            case 4:
                month = "mei";
                break;
            case 5:
                month = "juni";
                break;
            case 6:
                month = "juli";
                break;
            case 7:
                month = "augustus";
                break;
            case 8:
                month = "september";
                break;
            case 9:
                month = "oktober";
                break;
            case 10:
                month = "november";
                break;
            case 11:
                month = "december";
        }
    }
    else {
        switch (date.getMonth()) {
            case 0:
                month = "January";
                break;
            case 1:
                month = "February";
                break;
            case 2:
                month = "March";
                break;
            case 3:
                month = "April";
                break;
            case 4:
                month = "May";
                break;
            case 5:
                month = "June";
                break;
            case 6:
                month = "July";
                break;
            case 7:
                month = "August";
                break;
            case 8:
                month = "September";
                break;
            case 9:
                month = "October";
                break;
            case 10:
                month = "November";
                break;
            case 11:
                month = "December";
        }
    }
    return month;
}

/* Function that converts quarters and semesters to a readable string */
function getPeriodText(period, lang) {
    var periodText = "";
    if (lang === "nl") {
        switch (period) {
            case "Q1":
                periodText = "1ste kwartaal";
                break;
            case "Q2":
                periodText = "2e kwartaal";
                break;
            case "Q3":
                periodText = "3e kwartaal";
                break;
            case "Q4":
                periodText = "4e kwartaal";
                break;
            case "S1":
                periodText = "1ste semester";
                break;
            case "S2":
                periodText = "2e semester";
        }
    }
    else {
        switch (period) {
            case "Q1":
                periodText = "1. Quarter";
                break;
            case "Q2":
                periodText = "2. Quarter";
                break;
            case "Q3":
                periodText = "3. Quarter";
                break;
            case "Q4":
                periodText = "4. Quarter";
                break;
            case "S1":
                periodText = "1. Semester";
                break;
            case "S2":
                periodText = "2. Semester";
        }
    }
    return periodText;
}

/* Function that converts a period defined by startDate and endDate to a readable string */
function getPeriod(banDoc, startDate, endDate) {

    var lang = getLang(banDoc);
    if (!lang) {
        lang = "en";
    }

    var res = "";
    var year = Banana.Converter.toDate(startDate).getFullYear();
    var startDateDay = Banana.Converter.toDate(startDate).getDate(); //1-31
    var endDateDay = Banana.Converter.toDate(endDate).getDate(); //1-31
    var startDateMonth = Banana.Converter.toDate(startDate).getMonth(); //0=january ... 11=december
    var endDateMonth = Banana.Converter.toDate(endDate).getMonth(); //0=january ... 11=december

    /*
        CASE 1: all the year yyyy-01-01 - yyyy-12-31(i.e. "2018")
    */
    if (startDateMonth == 0 && startDateDay == 1 && endDateMonth == 11 && endDateDay == 31) {
        res = year;
    }

    /*
        CASE 2: single month (i.e. "January 2018")
    */
    else if (startDateMonth == endDateMonth) {
        res = getMonthText(Banana.Converter.toDate(startDate), lang);
        res += " " + year;
    }

    /* 
        CASE 3: period in the year (i.e. "First quarter 2018", "Second semester 2018")
    */
    else if (startDateMonth != endDateMonth) {

        //1. Quarter (1.1 - 31.3)
        if (startDateMonth == 0 && endDateMonth == 2) {
            res = getPeriodText("Q1",lang);
            res += " " + year;
        }   

        //2. Quarter (1.4 - 30.6)
        else if (startDateMonth == 3 && endDateMonth == 5) {
            res = getPeriodText("Q2",lang);
            res += " " + year;          
        }

        //3. Quarter (1.7 - 30.9)
        else if (startDateMonth == 6 && endDateMonth == 8) {
            res = getPeriodText("Q3",lang);
            res += " " + year;
        }

        //4. Quarter (1.10- 31.12)
        else if (startDateMonth == 9 && endDateMonth == 11) {
            res = getPeriodText("Q4",lang);
            res += " " + year;
        }

        //1. Semester (1.1 - 30.6)
        else if (startDateMonth == 0 && endDateMonth == 5) {
            res = getPeriodText("S1",lang);
            res += " " + year;
        }
        //2. Semester (1.7 - 31.12)
        else if (startDateMonth == 6 && endDateMonth == 11) {
            res = getPeriodText("S2",lang);
            res += " " + year;
        }

        /* 
            CASE 4: other periods
        */
        else {
            res = Banana.Converter.toLocaleDateFormat(startDate) + " - " + Banana.Converter.toLocaleDateFormat(endDate);
        }
    }

    return res;
}

/* Function that replaces the tags with the respective data */
function convertFields(banDoc, text, address, trDate, startDate, endDate, totalOfDonations, account) {

    if (text.indexOf("<Period>") > -1) {
        var period = getPeriod(banDoc, startDate, endDate);
        text = text.replace(/<Period>/g,period);
    }
    if (text.indexOf("<Account>") > -1) {
        text = text.replace(/<Account>/g,account);
    }
    if (text.indexOf("<FirstName>") > -1) {
        var firstname = address.firstname;
        text = text.replace(/<FirstName>/g,firstname);
    }
    if (text.indexOf("<FamilyName>") > -1) {
        var familyname = address.familyname;
        text = text.replace(/<FamilyName>/g,familyname);
    }    
    if (text.indexOf("<Address>") > -1) {
        var address = address.street + ", " + address.postalcode + " " + address.locality;
        text = text.replace(/<Address>/g,address);
    }
    if (text.indexOf("<TrDate>") > -1) {
        var trdate = Banana.Converter.toLocaleDateFormat(trDate);
        text = text.replace(/<TrDate>/g,trdate);
    }
    if (text.indexOf("<StartDate>") > -1) {
        var startdate = Banana.Converter.toLocaleDateFormat(startDate);
        text = text.replace(/<StartDate>/g,startdate);
    }
    if (text.indexOf("<EndDate>") > -1) {
        var enddate = Banana.Converter.toLocaleDateFormat(endDate);
        text = text.replace(/<EndDate>/g,enddate);
    }
    if (text.indexOf("<Currency>") > -1) {
        var currency = banDoc.info("AccountingDataBase", "BasicCurrency");
        text = text.replace(/<Currency>/g,currency);
    }
    if (text.indexOf("<Amount>") > -1) {
        var amount = Banana.Converter.toLocaleNumberFormat(totalOfDonations);
        text = text.replace(/<Amount>/g,amount);
    }
    return text;
}

/* Function that add a new line to the paragraph */
function addNewLine(reportElement, text) {

    var str = text.split("\n");

    for (var i = 0; i < str.length; i++) {
        addMdParagraph(reportElement, str[i]);
    }
}

/* Function that add bold style to the text between '**' */
function addMdParagraph(reportElement, text) {
    
    /*
    * BOLD TEXT STYLE
    *
    * Use '**' characters where the bold starts and/or ends.
    *
    * - set bold all the paragraph => **This is bold text
    *                              => **This is bold text**
    *
    * - set bold single/multiple words => This is **bold** text
    *                                  => This **is bold** text
    *                                  => **This** is **bold** text
    */

    var p = reportElement.addParagraph();
    var printBold = false;
    var startPosition = 0;
    var endPosition = -1;

    do {
        endPosition = text.indexOf("**", startPosition);
        var charCount = endPosition === -1 ? text.length - startPosition :  endPosition - startPosition;
        if (charCount > 0) {
            //Banana.console.log(text.substr(startPosition, charCount) + ", " + printBold);
            var span = p.addText(text.substr(startPosition, charCount), "");
            if (printBold)
                span.setStyleAttribute("font-weight", "bold");
        }
        printBold = !printBold;
        startPosition = endPosition >= 0 ? endPosition + 2 : text.length;
    } while (startPosition < text.length && endPosition >= 0);
}

/* Function that retrieves the address of the given account */
function getAddress(banDoc, accountNumber) {
    var address = {};
    var table = banDoc.table("Accounts");
    for (var i = 0; i < table.rowCount; i++) {
        var tRow = table.row(i);
        var account = tRow.value("Account");

        if (accountNumber === account) {

            address.nameprefix = tRow.value("NamePrefix");
            address.firstname = tRow.value("FirstName");
            address.familyname = tRow.value("FamilyName");
            address.street = tRow.value("Street");
            address.postalcode = tRow.value("PostalCode");
            address.locality = tRow.value("Locality");
        }
    }
    return address;
}

/* Function that retrieves the transaction date */
function getTransactionDate(banDoc, costcenter, startDate, endDate) {
    var transTab = banDoc.table("Transactions");
    costcenter = costcenter.substring(1); //remove first character ;
    
    for (var i = 0; i < transTab.rowCount; i++) {
        var tRow = transTab.row(i);
        var date = tRow.value("Date");
        var cc3 = tRow.value("Cc3");

        if (date >= startDate && date <= endDate) {
            if (costcenter && costcenter === cc3) {
                return date;
            }
        }
    }
}

/* Function that calculates the total of the transactions for the given account and period */
function calculateTotalTransactions(banDoc, costcenter, startDate, endDate) {
    var transTab = banDoc.table("Transactions");
    var date = "";
    var total = "";
    var numberOfTransactions = 0;
    var transactionsObj = {};
    costcenter = costcenter.substring(1); //remove first character ;

    for (var i = 0; i < transTab.rowCount; i++) {
        var tRow = transTab.row(i);
        date = tRow.value("Date");
        transactionsObj.date = date;
        var cc3 = tRow.value("Cc3");

        if (date >= startDate && date <= endDate) {

            if (costcenter && costcenter === cc3) {

                /*  If simple accounting, amount=Income column of transaction
                    If double accounting, amount=Amount column of transaction */
                if (banDoc.table('Categories')) {
                    var amount = tRow.value("Income");
                } else {
                    var amount = tRow.value("Amount");
                }

                total = Banana.SDecimal.add(total, amount);
                numberOfTransactions++;
            }
        }
    }

    transactionsObj.total = total;
    transactionsObj.numberOfTransactions = numberOfTransactions;
    
    return transactionsObj;
}

/* Function that prints the transaction table */
function printTransactionTable(banDoc, report, costcenter, startDate, endDate) {

    var transTab = banDoc.table("Transactions");
    var total = "";
    costcenter = costcenter.substring(1); //remove first character ";"

    var table = report.addTable("table02");
    if (banDoc.info("AccountingDataBase","Company")) {
        table.setStyleAttributes("width:70%");
    } else {
        table.setStyleAttributes("width:50%");
    }

    var rowCnt = 0;
    for (var i = 0; i < transTab.rowCount; i++) {
        var tRow = transTab.row(i);
        tableRow = table.addRow();

        var date = tRow.value("Date");
        var cc3 = tRow.value("Cc3");

        if (date >= startDate && date <= endDate) {

            if (costcenter && costcenter === cc3) {

                /*  If simple accounting, amount=Income column of transaction
                    If double accounting, amount=Amount column of transaction */
                if (banDoc.table('Categories')) {
                    var amount = tRow.value("Income");
                } else {
                    var amount = tRow.value("Amount");
                }

                rowCnt++;
                tableRow.addCell(rowCnt, "borderBottom", 1); //sequencial numbers
                tableRow.addCell(Banana.Converter.toLocaleDateFormat(tRow.value("Date")), "borderBottom", 1);
                tableRow.addCell(banDoc.info("AccountingDataBase", "BasicCurrency"), "borderBottom");
                tableRow.addCell(Banana.Converter.toLocaleNumberFormat(amount), "right borderBottom", 1);
                if (banDoc.info("AccountingDataBase","Company")) {
                    tableRow.addCell(banDoc.info("AccountingDataBase","Company"), "borderBottom right");
                } else {
                    tableRow.addCell();
                }
                total = Banana.SDecimal.add(total, amount);
            }
        }
    }

    tableRow = table.addRow();
    tableRow.addCell("", "borderTop borderBottom", 1);
    tableRow.addCell("", "borderTop borderBottom", 1);
    tableRow.addCell(texts.text06, "bold borderTop borderBottom", 1);
    tableRow.addCell(Banana.Converter.toLocaleNumberFormat(total), "bold right borderTop borderBottom", 1);
    tableRow.addCell("", "borderTop borderBottom", 1);
}

/* Function that retrieves in a list all the CC3 accounts */
function getCc3Accounts(banDoc) {
    var membershipList = [];
    var accountsTable = banDoc.table("Accounts");
    for (var i = 0; i < accountsTable.rowCount; i++) {
        var tRow = accountsTable.row(i);
        var account = tRow.value("Account");
        if (account.substring(0,1) === ";") {
            membershipList.push(account);
        }
    }
    return membershipList;
}

/* Function that converts parameters of the dialog */
function convertParam(userParam) {

    var convertedParam = {};
    convertedParam.version = '1.0';
    convertedParam.data = []; /* array dei parametri dello script */

    //Cc3 (donor)
    var currentParam = {};
    currentParam.name = 'costcenter';
    currentParam.title = texts.accountNumber;
    currentParam.type = 'string';
    currentParam.value = '';
    currentParam.readValue = function() {
        userParam.costcenter = this.value;
    }
    convertedParam.data.push(currentParam);

    // Texts
    var currentParam = {};
    currentParam.name = 'texts';
    currentParam.title = texts.textsGroup;
    currentParam.type = 'string';
    currentParam.value = userParam.texts ? userParam.texts : '';
    currentParam.readValue = function() {
        userParam.texts = this.value;
    }
    convertedParam.data.push(currentParam);

    // Default text
    var currentParam = {};
    currentParam.name = 'useDefaultTexts';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.useDefaultTexts;
    currentParam.type = 'bool';
    currentParam.value = userParam.useDefaultTexts ? true : false;
    currentParam.readValue = function() {
        userParam.useDefaultTexts = this.value;
    }
    convertedParam.data.push(currentParam);

    //Title
    var currentParam = {};
    currentParam.name = 'titleText';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.titleText;
    currentParam.type = 'string';
    currentParam.value = userParam.titleText ? userParam.titleText : '';
    currentParam.readValue = function() {
        if (userParam.useDefaultTexts) {
            userParam.titleText = texts.title;
        } else {
            userParam.titleText = this.value;
        }
    }
    convertedParam.data.push(currentParam);

    //Free text 1
    var currentParam = {};
    currentParam.name = 'text1';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.text1;
    currentParam.type = 'string';
    currentParam.value = userParam.text1 ? userParam.text1 : '';
    currentParam.readValue = function() {
        if (userParam.useDefaultTexts) {
            userParam.text1 = texts.multiTransactionText;
        } else {
            userParam.text1 = this.value;
        }
    }
    convertedParam.data.push(currentParam);

    //Free text 2
    var currentParam = {};
    currentParam.name = 'text2';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.text2;
    currentParam.type = 'string';
    currentParam.value = userParam.text2 ? userParam.text2 : '';
    currentParam.readValue = function() {
        if (userParam.useDefaultTexts) {
            userParam.text2 = "";
        } else {
            userParam.text2 = this.value;
        }
    }
    convertedParam.data.push(currentParam);

    //Free text 3
    var currentParam = {};
    currentParam.name = 'text3';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.text3;
    currentParam.type = 'string';
    currentParam.value = userParam.text3 ? userParam.text3 : '';
    currentParam.readValue = function() {
        if (userParam.useDefaultTexts) {
            userParam.text3 = "";
        } else {
            userParam.text3 = this.value;
        }
    }
    convertedParam.data.push(currentParam);

    //Free text 4
    var currentParam = {};
    currentParam.name = 'text4';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.text4;
    currentParam.type = 'string';
    currentParam.value = userParam.text4 ? userParam.text4 : '';
    currentParam.readValue = function() {
        if (userParam.useDefaultTexts) {
            userParam.text4 = "";
        } else {
            userParam.text4 = this.value;
        }
    }
    convertedParam.data.push(currentParam);

    // donation details
    var currentParam = {};
    currentParam.name = 'details';
    currentParam.parentObject = 'texts';
    currentParam.title = texts.details;
    currentParam.type = 'bool';
    currentParam.value = userParam.details ? true : false;
    currentParam.readValue = function() {
     userParam.details = this.value;
    }
    convertedParam.data.push(currentParam);

    // signature
    var currentParam = {};
    currentParam.name = 'signature';
    currentParam.title = texts.signature;
    currentParam.type = 'string';
    currentParam.value = userParam.signature ? userParam.signature : '';
    currentParam.readValue = function() {
        userParam.signature = this.value;
    }
    convertedParam.data.push(currentParam);

    // locality and date
    var currentParam = {};
    currentParam.name = 'localityAndDate';
    currentParam.parentObject = 'signature';
    currentParam.title = texts.localityAndDate;
    currentParam.type = 'string';
    currentParam.value = userParam.localityAndDate ? userParam.localityAndDate : '';
    currentParam.readValue = function() {
        userParam.localityAndDate = this.value;
    }
    convertedParam.data.push(currentParam);

    // image for signature
    var currentParam = {};
    currentParam.name = 'printLogo';
    currentParam.parentObject = 'signature';
    currentParam.title = texts.signature_image;
    currentParam.type = 'bool';
    currentParam.value = userParam.printLogo ? true : false;
    currentParam.readValue = function() {
     userParam.printLogo = this.value;
    }
    convertedParam.data.push(currentParam);

    // image for signature
    var currentParam = {};
    currentParam.name = 'signatureImage';
    currentParam.parentObject = 'signature';
    currentParam.title = texts.signatureImage;
    currentParam.type = 'string';
    currentParam.value = userParam.signatureImage ? userParam.signatureImage : 'documents:<image_id>';
    currentParam.readValue = function() {
     userParam.signatureImage = this.value;
    }
    convertedParam.data.push(currentParam);

    // image height
    var currentParam = {};
    currentParam.name = 'imageHeight';
    currentParam.parentObject = 'signature';
    currentParam.title = texts.imageHeight;
    currentParam.type = 'number';
    currentParam.value = userParam.imageHeight ? userParam.imageHeight : '10';
    currentParam.readValue = function() {
     userParam.imageHeight = this.value;
    }
    convertedParam.data.push(currentParam);

    return convertedParam;
}

/* Function that initializes the user parameters */
function initUserParam() {
    var userParam = {};
    userParam.costcenter = '';
    userParam.texts = '';
    userParam.useDefaultTexts = false;
    userParam.titleText = texts.title;
    userParam.text1 = texts.multiTransactionText;
    userParam.text2 = '';
    userParam.text3 = '';
    userParam.text4 = '';
    userParam.details = true;
    userParam.signature = '';
    userParam.localityAndDate = '';
    userParam.printLogo = '';
    userParam.signatureImage = '';
    userParam.imageHeight = '';
    return userParam;
}

function parametersDialog(userParam) {

    if (typeof(Banana.Ui.openPropertyEditor) !== 'undefined') {
        var dialogTitle = texts.dialogTitle;
        var convertedParam = convertParam(userParam);
        var pageAnchor = 'dlgSettings';
        if (!Banana.Ui.openPropertyEditor(dialogTitle, convertedParam, pageAnchor)) {
            return null;
        }
        
        for (var i = 0; i < convertedParam.data.length; i++) {
            // Read values to userParam (through the readValue function)
            convertedParam.data[i].readValue();
        }
        
        //  Reset reset default values
        userParam.useDefaultTexts = false;
    }
    
    return userParam;
}

function settingsDialog() {

    texts = loadTexts(Banana.document);
    var scriptform = initUserParam();
    
    // Retrieve saved param
    var savedParam = Banana.document.getScriptSettings();
    if (savedParam && savedParam.length > 0) {
        scriptform = JSON.parse(savedParam);
    }

    //We take the accounting "starting date" and "ending date" from the document. These will be used as default dates
    var docStartDate = Banana.document.startPeriod();
    var docEndDate = Banana.document.endPeriod();   
    
    //A dialog window is opened asking the user to insert the desired period. By default is the accounting period
    var selectedDates = Banana.Ui.getPeriod(texts.reportTitle, docStartDate, docEndDate, 
        scriptform.selectionStartDate, scriptform.selectionEndDate, scriptform.selectionChecked);
        
    //We take the values entered by the user and save them as "new default" values.
    //This because the next time the script will be executed, the dialog window will contains the new values.
    if (selectedDates) {
        scriptform["selectionStartDate"] = selectedDates.startDate;
        scriptform["selectionEndDate"] = selectedDates.endDate;
        scriptform["selectionChecked"] = selectedDates.hasSelection;    
    } else {
        //User clicked cancel
        return null;
    }

    scriptform = parametersDialog(scriptform); // From propertiess
    if (scriptform) {
        var paramToString = JSON.stringify(scriptform);
        Banana.document.setScriptSettings(paramToString);
    }

    return scriptform;
}

/* Function that takes the locale language of Banana */
function getLang(banDoc) {
    var lang = banDoc.locale;
    if (lang && lang.length > 2)
        lang = lang.substr(0, 2);
    return lang;
}

/* Function that creates styles */
function createStyleSheet(userParam) {
    var stylesheet = Banana.Report.newStyleSheet();
    stylesheet.addStyle("@page", "margin:20mm 10mm 10mm 20mm;");
    stylesheet.addStyle("body", "font-family:Helvetica; font-size:10pt");
    stylesheet.addStyle(".bold", "font-weight:bold;");
    stylesheet.addStyle(".borderLeft", "border-left:thin solid black");
    stylesheet.addStyle(".borderTop", "border-top:thin solid black");
    stylesheet.addStyle(".borderRight", "border-right:thin solid black");
    stylesheet.addStyle(".borderBottom", "border-bottom:thin solid black");
    stylesheet.addStyle(".right", "text-align:right;");
    stylesheet.addStyle(".center", "text-align:center;");
    stylesheet.addStyle(".headerStyle", "background-color:#E0EFF6; text-align:center; font-weight:bold;");
    stylesheet.addStyle(".address", "font-size:11pt");
    
    style = stylesheet.addStyle(".imgSignature");
    style.setAttribute("height", userParam.imageHeight + "mm");

    return stylesheet;
}

/* Function that loads all the default texts used for the dialog and the report  */
function loadTexts(banDoc) {

    var texts = {};
    var lang = getLang(banDoc);
    if (!lang) {
        lang = "en";
    }

    if (lang === "nl") {
        texts.reportTitle = "Kwitantie voor giften";
        texts.dialogTitle = "Omgevingen";
        texts.title = "Kwitantie voor giften <Period>";
        texts.warningMessage = "Ongeldige rekening gever";
        texts.accountNumber = "Rekening gever invoeren (leeg = alles afdrukken)";
        texts.localityAndDate = "Plaats en datum";
        texts.signature = "Handtekening";
        texts.signature_image = "Handtekening met afbeelding";
        texts.signatureImage = "Afbeelding";
        texts.imageHeight = "Hoogte afbeelding (mm)";
        texts.donor = "Naam en adres van de gever";
        texts.memberAccount = "Rekening gever";
        texts.donationDate = "Periode";
        texts.titleText = "Titel";
        texts.text1 = "Tekst 1 (facultatief)";
        texts.text2 = "Tekst 2 (facultatief)";
        texts.text3 = "Tekst 3 (facultatief)";
        texts.text4 = "Tekst 4 (facultatief)";
        texts.useDefaultTexts = "Gebruik standaard teksten";
        //texts.singleTransactionText = "Wij verklaren hierbij dat **<FirstName> <FamilyName>**, **<Address>** op **<TrDate>** het bedrag van **<Currency> <Amount>** geschonken heeft aan onze instelling.";
        texts.multiTransactionText = "Wij verklaren hierbij dat **<FirstName> <FamilyName>**, **<Address>** tussen **<StartDate>** en **<EndDate>** het bedrag van **<Currency> <Amount>** geschonken heeft aan onze instelling.";
        texts.textsGroup = "Teksten";
        texts.details = "Giften detail opnemen";
    }
    else {
        texts.reportTitle = "Statement of donation";
        texts.dialogTitle = "Settings";
        texts.title = "Statement of donation <Period>";
        texts.warningMessage = "Invalid member account";
        texts.accountNumber = "Insert account member (empty = print all)";
        texts.localityAndDate = "Locality and date";
        texts.signature = "Signature";
        texts.signature_image = "Signature with image";
        texts.signatureImage = "Image";
        texts.imageHeight = "Image height (mm)";
        texts.donor = "Name and addres of the donor";
        texts.memberAccount = "Member account";
        texts.donationDate = "Period";
        texts.titleText = "Title";
        texts.text1 = "Text 1 (optional)";
        texts.text2 = "Text 2 (optional)";
        texts.text3 = "Text 3 (optional)";
        texts.text4 = "Text 4 (optional)";
        texts.useDefaultTexts = "Use standard texts";
        //texts.singleTransactionText = "We hereby declare that **<FirstName> <FamilyName>**, **<Address>** on **<TrDate>** donated **<Currency> <Amount>** to our Association.";
        texts.multiTransactionText = "We hereby declare that **<FirstName> <FamilyName>**, **<Address>** between **<StartDate>** and **<EndDate>** donated **<Currency> <Amount>** to our Association.";
        texts.textsGroup = "Texts";
        texts.details = "Include donation details";
    }

    return texts;
}
