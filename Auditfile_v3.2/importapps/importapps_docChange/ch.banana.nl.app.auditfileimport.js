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

            // add the changes on the file properties
            this.createJsonDocument_AddFileProperties(jsonDoc, srcFileName, companyNode, openingBalanceList);
            //add the accounts
            this.createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, openingBalanceList);

            //add the transactions
            this.createJsonDocument_AddTransactions(jsonDoc, xmlRoot, companyNode, srcFileName);

        }

        this.jsonDocArray.push(jsonDoc);

    }

    createJsonDocument_AddFileProperties(jsonDoc, srcFileName, companyNode, openingBalanceList){
        var companyName=companyNode.firstChildElement('companyName').text;
        var streetAddress = companyNode.firstChildElement('streetAddress');

        var streetName = streetAddress.firstChildElement('streetname').text;
        var number= streetAddress.firstChildElement('number').text;
        var city= streetAddress.firstChildElement('city').text;

        var row = {};
        row.operation = {};
        row.operation.name = "modify";
        row.operation.srcFileName = srcFileName;
        row.fields = {};
        row.fields["SectionXml"] = "Base";
        row.fields["IdXml"] = "HeaderLeft";
        row.fields["ValueXml"] = companyName;

        var rowLists = jsonDoc.document.dataUnits["0"].data.rowLists[0];
        var index = parseInt(rowLists.rows.length);
        rowLists.rows[index.toString()] = row;



    }

    createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, openingBalanceList) {


        var generalLedgerNode = companyNode.firstChildElement('generalLedger');
        var ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount'); // First ledgerAccount


        while (ledgerAccountNode) {
            var accountNumber = ledgerAccountNode.firstChildElement('accID').text;


            var accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;
            var accType = ledgerAccountNode.firstChildElement('accTp').text;
            var gr = this.setGrByAccount(accountNumber);
            var bclass = this.setBclassByAccount(accountNumber, accType);
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
            row.fields["Date"] = "Data ultima modifica conto";
            row.fields["Account"] = accountNumber;
            row.fields["Description"] = accountDescription;
            row.fields["BClass"] = bclass;
            row.fields["Gr"] = gr;
            row.fields["Opening"] = opening;

            var rowLists = jsonDoc.document.dataUnits["1"].data.rowLists[0];
            var index = parseInt(rowLists.rows.length);
            rowLists.rows[index.toString()] = row;

            ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount');
        }
    }

    createJsonDocument_AddTransactions(jsonDoc, srcFileName, companyNode) {

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

                    var rowLists = jsonDoc.document.dataUnits["1"].data.rowLists[0];
                    var index = parseInt(rowLists.rows.length);
                    rowLists.rows[index.toString()] = row;


                    trLineNode = trLineNode.nextSiblingElement('trLine'); // Next trLine
                } //trLineNode


                transactionNode = transactionNode.nextSiblingElement('transaction'); // Next transaction
            } // transactionNode

            journalNode = journalNode.nextSiblingElement('journal'); // Next journal
        } //journalNode
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
        // viene definito cosa contiene il documento "document", e per ogni modifica crea le dataUnits
        var jsonDoc = {};
        jsonDoc.document = {};
        jsonDoc.fileVersion = "1.0.0";

        var dataUnitFilePorperties = {};
        jsonDoc.document.dataUnits=[];
        jsonDoc.document.dataUnits["0"] = dataUnitFilePorperties;
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists[0] = {};
        dataUnitFilePorperties.data.rowLists[0].rows = [];
        dataUnitFilePorperties.id = "FileInfo";//controllare se questo campo serve
        dataUnitFilePorperties.nameXml = "FileInfo";
        dataUnitFilePorperties.nid = 100;

        var dataUnitAccounts = {};
        jsonDoc.document.dataUnits = [];
        jsonDoc.document.dataUnits["1"] = dataUnitAccounts;
        dataUnitAccounts.data = {};
        dataUnitAccounts.data.rowLists = [];
        dataUnitAccounts.data.rowLists[0] = {};
        dataUnitAccounts.data.rowLists[0].rows = [];
        dataUnitAccounts.id = "Accounts";
        dataUnitAccounts.nameXml = "Accounts";
        dataUnitAccounts.nid = 101;

        var dataUnitTransactions = {};
        jsonDoc.document.dataUnits["2"] = dataUnitTransactions;
        dataUnitTransactions.data = {};
        dataUnitTransactions.data.rowLists = [];
        dataUnitTransactions.data.rowLists[0] = {};
        dataUnitTransactions.data.rowLists[0].rows = [];
        dataUnitTransactions.id = "Transactions";
        dataUnitTransactions.nameXml = "Transactions";
        dataUnitTransactions.nid = 102;

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