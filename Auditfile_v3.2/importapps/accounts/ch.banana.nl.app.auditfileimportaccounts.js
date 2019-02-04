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
// @id = ch.banana.nl.app.auditfileimportaccounts.js
// @api = 1.0
// @pubdate = 2019-01-30
// @publisher = Banana.ch SA
// @description.en = Auditfile NL - Import Accounts (BETA)
// @description.nl = Auditfile NL - Invoerrekeningen (BETA)
// @doctype = *
// @encoding = utf-8
// @task = import.accounts
// @outputformat = tablewithheaders
// @inputdatasource = openfiledialog
// @inputencoding = utf-8
// @inputfilefilter = XML files (*.xml);;All files (*.*)

/*
*   SUMMARY
*
*   Import the accounts taken from the xml file.
*   Accounts that already exist are not imported.
*
*/


// Main function
function exec(inData) {

    if (!Banana.document) {
      return "@Cancel";
    }

    // Load the form with all the accounts row data
    var form = [];
    loadForm(inData,form);

    // Create the file used to import in Banana
    var importAccountsFile = createImportAccountsFile(form);

    return importAccountsFile;
}

// Load the form that contains all the data used to import
function loadForm(inData, form) {

    /* Read the xml file and extract accounts data (account and description) */

    var xmlFile = Banana.Xml.parse(inData);
    var xmlRoot = xmlFile.firstChildElement('auditfile');
    var companyNode = xmlRoot.firstChildElement('company');
    
    // Get the list of customers/suppliers accounts
    var customersSuppliersList = [];
    if (companyNode.hasChildElements('customersSuppliers')) {
        var customersSuppliersNode = companyNode.firstChildElement('customersSuppliers');
        if (customersSuppliersNode.hasChildElements('customerSupplier')) {
            var customerSupplierNode = customersSuppliersNode.firstChildElement('customerSupplier'); // First customerSupplier
            customersSuppliersList = getCustomerSuppliers(customerSupplierNode);
        }
    }

    //**********************************
    // ACCOUNTS (no customers/suppliers)
    //**********************************
    var openingBalanceList = loadOpeningBalances(companyNode);

    var generalLedgerNode = companyNode.firstChildElement('generalLedger');
    var ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount'); // First ledgerAccount
    loadAccounts(form, ledgerAccountNode, customersSuppliersList, openingBalanceList);

    //*********************************
    // CUSTOMERS / SUPPLIERS
    //*********************************
    if (customersSuppliersList.length > 0) {
        loadCustomersSuppliers(form, customerSupplierNode, customersSuppliersList);
    }

    //Banana.console.log(customersSuppliersList);
    //Banana.console.log(JSON.stringify(form, "", " "));
}

// Reads the xml and for each customer/supplier adds the data to the form
function loadCustomersSuppliers(form, customerSupplierNode, customersSuppliersList) {

    while (customerSupplierNode) { // For each customerSupplierNode
        
        var accountNumber = "";
        var accountDescription = "";
        var gr = "";
        var bclass = ""; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
        var accountOpening = "";
        var nameprefix = "";
        var firstname = "";
        var familyname = "";
        var street = "";
        var zip = "";
        var locality = "";
        var countryCode = "";
        var phoneMain = "";
        var fax = "";
        var email = "";
        var website = "";
        var bankiban = "";   

        accountNumber = customerSupplierNode.firstChildElement('custSupID').text;
        accountDescription = customerSupplierNode.firstChildElement('custSupName').text;

        //Take the "account___description" of each customer/supplier
        for (var i = 0; i < customersSuppliersList.length; i++) {
            if (customersSuppliersList[i].split("_____")[0] === accountNumber) {
                if (customersSuppliersList[i].split("_____")[1]) {
                    accountDescription = customersSuppliersList[i].split("_____")[1];
                }
            }
        }

        if (customerSupplierNode.hasChildElements('custSupTp')) {
            var customerSupplierType = customerSupplierNode.firstChildElement('custSupTp').text;
            bclass = setBclassByAccount(accountNumber,customerSupplierType);
        }
        
        if (customerSupplierNode.hasChildElements('contact')) {
            var str = customerSupplierNode.firstChildElement('contact').text;
            var res = str.split(" ");
            firstname = res[0];
            for (var i = 1; i < res.length; i++) {
                familyname += res[i] + " ";
            }
        }

        if (customerSupplierNode.hasChildElements('telephone')) {
            phoneMain = customerSupplierNode.firstChildElement('telephone').text;
        }
        if (customerSupplierNode.hasChildElements('fax')) {
            fax = customerSupplierNode.firstChildElement('fax').text;
        }
        if (customerSupplierNode.hasChildElements('eMail')) {
            email = customerSupplierNode.firstChildElement('eMail').text;
        }
        if (customerSupplierNode.hasChildElements('website')) {
            website = customerSupplierNode.firstChildElement('website').text;
        }

        if (customerSupplierNode.hasChildElements('streetAddress')) {
            var streetAddressNode = customerSupplierNode.firstChildElement('streetAddress');
            if (streetAddressNode.hasChildElements('streetname')) {
                street = streetAddressNode.firstChildElement('streetname').text;
            }
            if (streetAddressNode.hasChildElements('postalCode')) {
                zip = streetAddressNode.firstChildElement('postalCode').text;
            }
            if (streetAddressNode.hasChildElements('city')) {
                locality = streetAddressNode.firstChildElement('city').text;
            }
            if (streetAddressNode.hasChildElements('country')) {
                countryCode = streetAddressNode.firstChildElement('country').text;
            }
        }

        if (customerSupplierNode.hasChildElements('bankAccount')) {
            var bankAccountNode = customerSupplierNode.firstChildElement('bankAccount');
            if (bankAccountNode.hasChildElements('bankAccNr')) {
                bankiban = bankAccountNode.firstChildElement('bankAccNr').text;
            }
        }

        form.push({
            "Section":"",
            "Group":"",
            "Account":accountNumber,
            "Description":accountDescription,
            "BClass":bclass,
            "Gr":gr,
            "Opening":accountOpening,
            "NamePrefix":nameprefix,
            "FirstName":firstname,
            "FamilyName":familyname,
            "Street":street,
            "PostalCode":zip,
            "Locality":locality,
            "CountryCode":countryCode,
            "PhoneMain":phoneMain,
            "Fax":fax,
            "EmailWork":email,
            "Website":website,
            "BankIban":bankiban
        });

        customerSupplierNode = customerSupplierNode.nextSiblingElement('customerSupplier'); // Next customerSupplier
    }
}

// Reads the xml and for each accounts adds the data to the form
function loadAccounts(form, ledgerAccountNode, customersSuppliersList, openingBalanceList) {
    while (ledgerAccountNode) { // For each ledgerAccountNode
        var accountNumber = ledgerAccountNode.firstChildElement('accID').text;
        var accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;
        var accType = ledgerAccountNode.firstChildElement('accTp').text;
        var gr = setGrByAccount(accountNumber);
        var bclass = setBclassByAccount(accountNumber, accType);
        var opening = "";

        //Take the "account___amount___amounttype" of each opening balance
        for (var i = 0; i < openingBalanceList.length; i++) {
            if (openingBalanceList[i].split("_____")[0] === accountNumber) {
                var amnt = openingBalanceList[i].split("_____")[1];
                var amntTp = openingBalanceList[i].split("_____")[2];
                if (amntTp === "D") {
                    opening = amnt;
                }
                else if (amntTp === "C") {
                    opening = Banana.SDecimal.invert(amnt);
                }
            }
        }

        // if (ledgerAccountNode.hasChildElements('leadCode')) {
        //     gr = ledgerAccountNode.firstChildElement('leadCode').text; 
        // } else {
        //     gr = setGrByAccount(accountNumber);
        // }

        // if (ledgerAccountNode.hasChildElements('leadDescription')) {
        //     var groupDescription = ledgerAccountNode.firstChildElement('leadDescription').text;
        // } else {
        //     var groupDescription = "";
        // }

        // if (ledgerAccountNode.hasChildElements('leadReference')) {
        //     var value = ledgerAccountNode.firstChildElement('leadReference').text;
        //     if (value === "1" || value === "2" || value === "3" || value === "4") {
        //         bclass = value;
        //     } else {
        //         bclass = setBclassByAccount(accountNumber, accType);
        //     }
        // } else {
        //     bclass = setBclassByAccount(accountNumber, accType);
        // }
        

        //We take all the accounts that are not customers or suppliers
        //because we want all the normal accounts at the beginning,
        //and customers/suppliers at the end.
        if (customersSuppliersList.indexOf(accountNumber) < 0) {

            form.push({
                "Section":"",
                "Group":"",
                "Account":accountNumber,
                "Description":accountDescription,
                "BClass":bclass,
                "Gr":gr,
                "Opening":opening,
                "NamePrefix":"",
                "FirstName":"",
                "FamilyName":"",
                "Street":"",
                "PostalCode":"",
                "Locality":"",
                "CountryCode":"",
                "PhoneMain":"",
                "Fax":"",
                "EmailWork":"",
                "Website":"",
                "BankIban":""
            });
        }

        // For each customer/supplier account, we replace it with "account_____description"
        // We will use these descriptions in the loadCustomersSuppliers() function
        for (var i = 0; i < customersSuppliersList.length; i++) {
            if (customersSuppliersList[i] === accountNumber) {
                customersSuppliersList[i] = customersSuppliersList[i]+"_____"+accountDescription;
            }
        }

        ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount'); // Next ledgerAccount
    }
}


function loadOpeningBalances(companyNode) {

    var openingBalanceList = [];

    if (companyNode.hasChildElements('openingBalance')) {
        var openingBalanceNode = companyNode.firstChildElement('openingBalance');
        
        if (openingBalanceNode.hasChildElements('obLine')) {
            var obLineNode = openingBalanceNode.firstChildElement('obLine');
        
            while (obLineNode) { // For each openingBalance

                if (obLineNode.hasChildElements('accID')) {
                    var accID = obLineNode.firstChildElement('accID').text;
                }
                if (obLineNode.hasChildElements('amnt')) {
                    var amnt = obLineNode.firstChildElement('amnt').text;
                }
                if (obLineNode.hasChildElements('amntTp')) {
                    var amntTp = obLineNode.firstChildElement('amntTp').text;
                }
            
                openingBalanceList.push(accID+"_____"+amnt+"_____"+amntTp);
                obLineNode = obLineNode.nextSiblingElement('obLine'); // Next obLine
            }
        }
    }
    return openingBalanceList;
}

// Get a list of all the customers and suppliers accounts
function getCustomerSuppliers(customerSupplierNode) {
    var customersSuppliersList = [];
    while (customerSupplierNode) { // For each customerSupplierNode
        var accountNumber = customerSupplierNode.firstChildElement('custSupID').text;
        customersSuppliersList.push(accountNumber); //Add the account to the list
        customerSupplierNode = customerSupplierNode.nextSiblingElement('customerSupplier'); // Next customerSupplier
    }
    //Removing duplicates
    for (var i = 0; i < customersSuppliersList.length; i++) {
        for (var x = i+1; x < customersSuppliersList.length; x++) {
            if (customersSuppliersList[x] === customersSuppliersList[i]) {
                customersSuppliersList.splice(x,1);
                --x;
            }
        }
    }
    return customersSuppliersList;
}

// Create the import text file that is used to import the accounts table in Banana
function createImportAccountsFile(form) {
    var importAccountsFile = "";

    // Header
    importAccountsFile += 
        "Section\t"+
        "Group\t"+
        "Account\t"+
        "Description\t"+
        "BClass\t"+
        "Gr\t"+
        "Opening\t"+
        "NamePrefix\t"+
        "FirstName\t"+
        "FamilyName\t"+
        "Street\t"+
        "PostalCode\t"+
        "Locality\t"+
        "CountryCode\t"+
        "PhoneMain\t"+
        "Fax\t"+
        "EmailWork\t"+
        "Website\t"+
        "BankIban\n";
    
    // Rows with data
    for (var i = 0; i < form.length; i++) {
        importAccountsFile += 
            form[i].Section+"\t"+
            form[i].Group+"\t"+
            form[i].Account+"\t"+
            form[i].Description+"\t"+
            form[i].BClass+"\t"+
            form[i].Gr+"\t"+
            form[i].Opening+"\t"+
            form[i].NamePrefix+"\t"+
            form[i].FirstName+"\t"+
            form[i].FamilyName+"\t"+
            form[i].Street+"\t"+
            form[i].PostalCode+"\t"+
            form[i].Locality+"\t"+
            form[i].CountryCode+"\t"+
            form[i].PhoneMain+"\t"+
            form[i].Fax+"\t"+
            form[i].EmailWork+"\t"+
            form[i].Website+"\t"+
            form[i].BankIban+"\n";
    }

    //Banana.console.log(importAccountsFile);
    return importAccountsFile;    
}

// Return the group (Gr) for the given account
function setGrByAccount(account) {
    var gr = "";
    //....
    return gr;
}

// Return the BClass for the given account
function setBclassByAccount(account,accType) {
    /* from xml file:
    
    Accounts:
        B=balance => BClass 1 or 2
        P=profit/loss => BClass 3 or 4

    Customers / Suppliers:
        C=customer
        S=supplier
        B=both customer and supplier
        O=Other, no customer or supplier
    */

    var bclass = "";
    if (accType === "B") {
        bclass = ""; // 1 or 2
    }
    else if (accType === "P") {
        bclass = ""; // 3 or 4
    }
    else if (accType === "C") {
        bclass = "1";
    }
    else if (accType === "S") {
        bclass = "2";
    }
    return bclass;
}

