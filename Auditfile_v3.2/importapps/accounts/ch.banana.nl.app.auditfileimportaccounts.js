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
// @pubdate = 2019-01-23
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

    /* Read the xml file and extract accounts data (account and description)
        
        <auditfile>
            <company>
                <generalLedger>
                    <ledgerAccount>
                        <accID>0100</accID>
                        <accDesc>Goodwill</accDesc>
                        <accTp>B</accTp>
                        <leadCode>1A</leadCode>
                        <leadDescription>Totaal Immateriële vaste activa</leadDescription>
                        <leadReference>1</leadReference>
                        <leadCrossRef/>
                    </ledgerAccount>
                </generalLedger>
            </company>
        </auditfile>
    
    */

    var xmlFile = Banana.Xml.parse(inData);
    var xmlRoot = xmlFile.firstChildElement('auditfile');
    var companyNode = xmlRoot.firstChildElement('company');
    var generalLedgerNode = companyNode.firstChildElement('generalLedger');
    var ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount'); // First ledgerAccount

    while (ledgerAccountNode) { // For each ledgerAccountNode
        var accountNumber = ledgerAccountNode.firstChildElement('accID').text;
        var accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;
        var accType = ledgerAccountNode.firstChildElement('accTp').text;
        var gr = setGrByAccount(accountNumber);
        var bclass = setBclassByAccount(accountNumber, accType);

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
        
        form.push({"Section":"", "Group":"", "Account":accountNumber, "Description":accountDescription, "BClass":bclass, "Gr":gr});
        ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount'); // Next ledgerAccount
    }
    //Banana.console.log(JSON.stringify(form, "", " "));
}


// Create the import text file that is used to import the accounts table in Banana
function createImportAccountsFile(form) {
    var importAccountsFile = "";

    // Header
    importAccountsFile += "Section\tGroup\tAccount\tDescription\tBClass\tGr\n";
    
    // Rows with data
    for (var i = 0; i < form.length; i++) {
        importAccountsFile += form[i].Section+"\t"+form[i].Group+"\t"+form[i].Account+"\t"+form[i].Description+"\t"+form[i].BClass+"\t"+form[i].Gr+"\n";
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
    // from xml file: 
    // B=balance => BClass 1 or 2
    // P=profit/loss => BClass 3 or 4
    var bclass = "";
    if (accType === "B") {
        bclass = "1";
    }
    else if (accType === "P") {
        bclass = "3"
    }
    return bclass;
}

