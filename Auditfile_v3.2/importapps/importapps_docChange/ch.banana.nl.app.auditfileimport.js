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
//
// @id = ch.banana.nl.app.auditfileimporttransactions.js
// @api = 1.0
// @pubdate = 2021-04-30
// @publisher = Banana.ch SA
// @description = Import audit file Netherlands
// @doctype = *
// @encoding = utf-8
// @task = import.rows
// @outputformat = tablewithheaders
// @inputdatasource = openfiledialog
// @inputencoding = utf-8
// @inputfilefilter = XML files (*.xml);;All files (*.*)

/*
 *   SUMMARY
 *
 *   Import the transactions and the accounts taken from the xml file.
 */

/**
 * function called from converter
 */
function setup() {}


/**
 * 
 * @param {*} banDocument the current Banana file
 */
var NlAuditFilesImport = class NlAuditFilesImport {
    constructor(banDocument) {
        this.version = '1.0';
        this.banDocument = banDocument;
        // this.initParam();
        this.ledgerGr="";

        //array dei patches
        this.jsonDocArray = [];

        //errors
        this.ID_ERR_ = "ID_ERR_";

    }

    /**
     * Il metodo createJsonDocument() riprende i dati dal file xml e li trasforma
     * in formato json per essere importati nella tabella Registrazioni
     * @param {*} inData 
     */
    createJsonDocument(inData) {

        var jsonDoc = this.createJsonDocument_Init();

        for (var srcFileName in inData) {

            //seleziona singolo file xml
            var xmlFile = Banana.Xml.parse(inData[srcFileName]);
            if (!xmlFile)
                continue;

            var xmlRoot = xmlFile.firstChildElement('auditfile');
            if (!xmlRoot)
                continue;

            var companyNode = xmlRoot.firstChildElement('company');

            var openingBalanceList = this.loadOpeningBalances(companyNode);
            /*********************************************************************
             * ADD THE FILE PROPERTIES
             *********************************************************************/
            this.createJsonDocument_AddFileProperties(jsonDoc, srcFileName,companyNode);
            /*********************************************************************
             * ADD THE ACCOUNTS
             *********************************************************************/
            this.createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, openingBalanceList);

            /*********************************************************************
             * ADD THE COSTUMERS/SUPPLIERS
             *********************************************************************/
            var customersSuppliersList = [];
            if (companyNode.hasChildElements('customersSuppliers')) {
                var customersSuppliersNode = companyNode.firstChildElement('customersSuppliers');
                if (customersSuppliersNode.hasChildElements('customerSupplier')) {
                    var customerSupplierNode = customersSuppliersNode.firstChildElement('customerSupplier'); // First customerSupplier
                    customersSuppliersList = this.getCustomerSuppliers(customerSupplierNode);
                }
            }
            this.createJsonDocument_AddCostumersSuppliers(jsonDoc,srcFileName,customerSupplierNode, customersSuppliersList);

            /*********************************************************************
            * ADD THE TRANSACTIONS
            *********************************************************************/
            this.createJsonDocument_AddTransactions(jsonDoc, xmlRoot, companyNode, srcFileName);

        }

        this.jsonDocArray.push(jsonDoc);

    }

    /**
     * 
     * @returns the list of the file properties fields i want to modify/add
     */
    getFileInfoFields(){
        var propertyFields=[];

        propertyFields[0]="Company";
        propertyFields[1]="Address1";
        propertyFields[2]="City";

        return propertyFields;

    }
    /**
     * 
     * @param {*} companyNode the xml company node
     * @returns the values i want to put in the file properties fields
     */
    getCompanyInfo(companyNode){

        var companyInfos=[];

        var companyName=companyNode.firstChildElement('companyName').text;
        var streetAddress = companyNode.firstChildElement('streetAddress');

        companyInfos[0]=companyName;
        companyInfos[1] = streetAddress.firstChildElement('streetname').text+" "+streetAddress.firstChildElement('number').text;
        companyInfos[2]= streetAddress.firstChildElement('city').text;

        return companyInfos;
    }

    createJsonDocument_AddFileProperties(jsonDoc, srcFileName,companyNode){

        var rows = [];

        var fileInfoFields=this.getFileInfoFields();
        var companyInfos=this.getCompanyInfo(companyNode);

        for (var i=0;i<fileInfoFields.length;i++){
            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["SectionXml"] = "AccountingDataBase";
            row.fields["IdXml"] = fileInfoFields[i];
            row.fields["ValueXml"] = companyInfos[i];

            rows.push(row);
        }

        var dataUnitFilePorperties = {}; 
        dataUnitFilePorperties.nameXml="FileInfo";
        dataUnitFilePorperties.data={};
        dataUnitFilePorperties.data.rowLists=[];
        dataUnitFilePorperties.data.rowLists.push({"rows":rows});

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);

    }

    createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, openingBalanceList) {

        var rows = [];

        var generalLedgerNode = companyNode.firstChildElement('generalLedger');
        var ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount');


        while (ledgerAccountNode) {

            var accountNumber = ledgerAccountNode.firstChildElement('accID').text;


            var accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;
            var accType = ledgerAccountNode.firstChildElement('accTp').text;
            var gr = ledgerAccountNode.firstChildElement('leadCode').text; //this.setGrByAccount(accountNumber);
            var bclass = ledgerAccountNode.firstChildElement('leadReference').text; //this.setBclassByAccount(accountNumber, accType);
            var opening = "";


            //Take the "account___amount___amounttype" of each opening balance
            for (var i = 0; i < openingBalanceList.length; i++) {
                if (openingBalanceList[i].split("_____")[0] === accountNumber) {
                    var amnt = openingBalanceList[i].split("_____")[1];
                    var amntTp = openingBalanceList[i].split("_____")[2];
                    if (amntTp === "D") {
                        opening = amnt;
                    } else if (amntTp === "C") {
                        opening = Banana.SDecimal.invert(amnt);
                    }
                }
            }

            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["Account"] = accountNumber;
            row.fields["Description"] = accountDescription;
            row.fields["BClass"] = bclass;
            row.fields["Gr"] = gr;
            row.fields["Opening"] = opening;


            //se il gruppo è diverso da quello precedente, allora inserisco una voce di raggruppamento
            //row=createJsonDocument_AddGrLine(gr)


            rows.push(row);

            this.ledgerGr=gr;

            ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount');
        }
    
        var dataUnitFilePorperties = {}; 
        dataUnitFilePorperties.nameXml="Accounts";
        dataUnitFilePorperties.data={};
        dataUnitFilePorperties.data.rowLists=[];
        dataUnitFilePorperties.data.rowLists.push({"rows":rows});

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);
    

    }

    createJsonDocument_AddCostumersSuppliers(jsonDoc,srcFileName,customerSupplierNode, customersSuppliersList) {

        //creates the row that indicates
        //fare in modo che vengano divisi i clienti con i fornitori nel piano dei conti

        var rows = [];

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
    
            var accountNumber = customerSupplierNode.firstChildElement('custSupID').text;
            var accountDescription = customerSupplierNode.firstChildElement('custSupName').text;
    
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
               // bclass = setBclassByAccount(accountNumber,customerSupplierType);
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
    
            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["Account"] = accountNumber;
            row.fields["Description"] = accountDescription;
            row.fields["BClass"] = bclass;
            row.fields["Gr"] = gr;
            row.fields["Opening"] = accountOpening;
            row.fields["NamePrefix"] = nameprefix;
            row.fields["FirstName"] = firstname;
            row.fields["FamilyName"] = familyname;
            row.fields["Street"] = street;
            row.fields["PostalCode"] = zip;
            row.fields["Locality"] = locality;
            row.fields["CountryCode"] = countryCode;
            row.fields["PhoneMain"] = phoneMain;
            row.fields["Fax"] = fax;
            row.fields["EmailWork"] = email;
            row.fields["Website"] = website;
            row.fields["BankIban"] = bankiban;


            //se il gruppo è diverso da quello precedente, allora inserisco una voce di raggruppamento
            //row=createJsonDocument_AddGrLine(gr)


            rows.push(row);

            this.ledgerGr=gr;
    
            customerSupplierNode = customerSupplierNode.nextSiblingElement('customerSupplier'); // Next customerSupplier
        }

        var dataUnitFilePorperties = {}; 
        dataUnitFilePorperties.nameXml="Accounts";
        dataUnitFilePorperties.data={};
        dataUnitFilePorperties.data.rowLists=[];
        dataUnitFilePorperties.data.rowLists.push({"rows":rows});

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);


    }

    // Get a list of all the customers and suppliers accounts
     getCustomerSuppliers(customerSupplierNode) {
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


    createJsonDocument_AddTransactions(jsonDoc, srcFileName, companyNode) {

        var rows = [];

        var transactionsNode = companyNode.firstChildElement('transactions');
        var journalNode = transactionsNode.firstChildElement('journal');


        while (journalNode) {

            var transactionNode = journalNode.firstChildElement('transaction'); // First transaction
            while (transactionNode) {
                var nr = "";
                var desc = "";
                var trDt = "";

                if (transactionNode.hasChildElements('nr')) {
                    nr = transactionNode.firstChildElement('nr').text;
                }
                if (transactionNode.hasChildElements('desc')) {
                    desc = transactionNode.firstChildElement('desc').text;
                }
                if (transactionNode.hasChildElements('trDt')) {
                    trDt = transactionNode.firstChildElement('trDt').text;
                }
                //Banana.console.log("NEW TRANSACTION: " + nr + "; " + desc + "; " + trDt);

                var trLineNode = transactionNode.firstChildElement('trLine');
                while (trLineNode) {

                    var trLineNr = "";
                    var trLineAccID = "";
                    var trLineDocRef = "";
                    var trLineEffDate = "";
                    var trLineDesc = "";
                    var trLineAmnt = "";
                    var trLineAmntTp = "";

                    if (trLineNode.hasChildElements('nr')) {
                        trLineNr = trLineNode.firstChildElement('nr').text;
                    }
                    if (trLineNode.hasChildElements('accID')) {
                        trLineAccID = trLineNode.firstChildElement('accID').text;
                    }
                    if (trLineNode.hasChildElements('docRef')) {
                        trLineDocRef = trLineNode.firstChildElement('docRef').text;
                    }
                    if (trLineNode.hasChildElements('effDate')) {
                        trLineEffDate = trLineNode.firstChildElement('effDate').text;
                    }
                    if (trLineNode.hasChildElements('desc')) {
                        trLineDesc = trLineNode.firstChildElement('desc').text;
                    }
                    if (trLineNode.hasChildElements('amnt')) {
                        trLineAmnt = trLineNode.firstChildElement('amnt').text;
                    }
                    if (trLineNode.hasChildElements('amntTp')) {
                        trLineAmntTp = trLineNode.firstChildElement('amntTp').text;
                    }

                    // Description of the transaction
                    var transactionDescription = "";
                    if (desc) {
                        transactionDescription = desc + ", " + trLineDesc;
                    } else {
                        transactionDescription = trLineDesc;
                    }

                    // Account and ContraAccount of the transaction
                    if (trLineAmntTp === "D") {
                        var transactionDebitAccount = trLineAccID;
                        var transactionCreditAccount = "";
                    } else if (trLineAmntTp === "C") {
                        var transactionDebitAccount = "";
                        var transactionCreditAccount = trLineAccID;
                    }

                    var row = {};
                    row.operation = {};
                    row.operation.name = "add";
                    row.operation.srcFileName = srcFileName;
                    row.fields = {};
                    row.fields["Date"] = trLineEffDate;
                    row.fields["Doc"] = nr;
                    row.fields["Doctype"] = "";
                    row.fields["Description"] = transactionDescription;
                    row.fields["AccountDebit"] = transactionDebitAccount;
                    row.fields["AccountCredit"] = transactionCreditAccount;
                    row.fields["Amount"] = Banana.SDecimal.abs(trLineAmnt);

                    rows.push(row);

                    trLineNode = trLineNode.nextSiblingElement('trLine'); // Next trLine
                } //trLineNode


                transactionNode = transactionNode.nextSiblingElement('transaction'); // Next transaction
            } // transactionNode

            journalNode = journalNode.nextSiblingElement('journal'); // Next journal
        } //journalNode

        var dataUnitFilePorperties = {}; 
        dataUnitFilePorperties.nameXml="Transactions";
        dataUnitFilePorperties.data={};
        dataUnitFilePorperties.data.rowLists=[];
        dataUnitFilePorperties.data.rowLists.push({"rows":rows});

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);
    }

    loadOpeningBalances(companyNode) {

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

                    openingBalanceList.push(accID + "_____" + amnt + "_____" + amntTp);
                    obLineNode = obLineNode.nextSiblingElement('obLine'); // Next obLine
                }
            }
        }
        return openingBalanceList;
    }

    setGrByAccount(account) {
        var gr = "";
        //....
        return gr;
    }

    setBclassByAccount(account, accType) {
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
            bclass = "1"; // 1 or 2
        } else if (accType === "P") {
            bclass = ""; // 3 or 4
        } else if (accType === "C") {
            bclass = "1";
        } else if (accType === "S") {
            bclass = "2";
        }
        return bclass;
    }

    createJsonDocument_Init() {

        var jsonDoc = {};
        jsonDoc.document = {};
        jsonDoc.document.dataUnitsfileVersion = "1.0.0";
        jsonDoc.document.dataUnits=[];

        jsonDoc.creator = {};
        var d = new Date();
        var datestring = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        var timestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        jsonDoc.creator.executionDate = Banana.Converter.toInternalDateFormat(datestring, "yyyymmdd");
        jsonDoc.creator.executionTime = Banana.Converter.toInternalTimeFormat(timestring, "hh:mm");
        jsonDoc.creator.name = Banana.script.getParamValue('id');
        jsonDoc.creator.version = "1.0";

        return jsonDoc;

    }

    getAccountingInfo() {
        this.accountingInfo = {};
        this.accountingInfo.isDoubleEntry = false;
        this.accountingInfo.isIncomeExpenses = false;
        this.accountingInfo.isCashBook = false;
        this.accountingInfo.multiCurrency = false;
        this.accountingInfo.withVat = false;
        this.accountingInfo.vatAccount = "";
        this.accountingInfo.customersGroup = "";
        this.accountingInfo.suppliersGroup = "";

        if (this.banDocument) {
            var fileGroup = this.banDocument.info("Base", "FileTypeGroup");
            var fileNumber = this.banDocument.info("Base", "FileTypeNumber");
            var fileVersion = this.banDocument.info("Base", "FileTypeVersion");

            if (fileGroup == "100")
                this.accountingInfo.isDoubleEntry = true;
            else if (fileGroup == "110")
                this.accountingInfo.isIncomeExpenses = true;
            else if (fileGroup == "130")
                this.accountingInfo.isCashBook = true;

            if (fileNumber == "110") {
                this.accountingInfo.withVat = true;
            }
            if (fileNumber == "120") {
                this.accountingInfo.multiCurrency = true;
            }
            if (fileNumber == "130") {
                this.accountingInfo.multiCurrency = true;
                this.accountingInfo.withVat = true;
            }

            if (this.banDocument.info("AccountingDataBase", "VatAccount"))
                this.accountingInfo.vatAccount = this.banDocument.info("AccountingDataBase", "VatAccount");

            if (this.banDocument.info("AccountingDataBase", "CustomersGroup"))
                this.accountingInfo.customersGroup = this.banDocument.info("AccountingDataBase", "CustomersGroup");
            if (this.banDocument.info("AccountingDataBase", "SuppliersGroup"))
                this.accountingInfo.suppliersGroup = this.banDocument.info("AccountingDataBase", "SuppliersGroup");
        }
    }

    getErrorMessage(errorId) {
        switch (errorId) {
            case this.ID_ERR_:
                return "";
        }
        return "";
    }
}

function exec(inData) {

    if (!Banana.document || inData.length <= 0)
        return "@Cancel";

    var jsonData = {};
    try {
        jsonData = JSON.parse(inData);
    } catch (e) {
        jsonData[0] = inData;
    }

    if (!jsonData)
        return "@Cancel";

    var nlAuditFilesImport = new NlAuditFilesImport(Banana.document);

    nlAuditFilesImport.createJsonDocument(jsonData);

    var jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = nlAuditFilesImport.jsonDocArray;

    return jsonDoc;

}