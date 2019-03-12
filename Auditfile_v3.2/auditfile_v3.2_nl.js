// Copyright [2015] [Banana.ch SA - Lugano Switzerland]
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
// @id = ch.banana.nl.app.auditfile
// @api = 1.0
// @pubdate = 2019-03-12
// @publisher = Banana.ch SA
// @description = Export to Netherlands Financial Auditfile (BETA)
// @description.nl = Export naar Nederland Auditfile Financiëel (BETA)
// @task = app.command
// @doctype = 100.*;110.*
// @encoding = utf-8
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @timeout = -1
// @includejs = 


/*
*	SUMMARY
*   =======
*
*	This BananaApp creates an XML file containing Banana Accounting data.
*   The structure of the file and its content follows the Auditfile v3.2 for Netherland specifications.
*
*/


var ERROR_STRING_MIN_LENGTH = false;
var ERROR_STRING_MAX_LENGTH = false;
var ERROR_VALUE_NOT_ALLOWED = false;


/* Main function */
function exec() {

    //Check the version of Banana. If < than 9.0.3 the script does not start
    var requiredVersion = '9.0.3';
    if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, requiredVersion) >= 0) {

		// Opend a dialog. User must choose a period
        var dateform = null;
        if (options && options.useLastSettings) {
            dateform = getScriptSettings();
        } else {
            dateform = settingsDialog();
        }
        if (!dateform) {
            return;
        }

        var startDate = dateform.selectionStartDate;
        var endDate = dateform.selectionEndDate;

        /* 2) Create the xml document */
        var output = createXml(Banana.document, startDate, endDate);
        saveData(output, startDate, endDate);
    }
    else {
		Banana.document.addMessage('Banana Accounting ' + requiredVersion + ' is required.');	
    }
}

/* Creates the XML document */
function createXml(banDoc, startDate, endDate) {

    var xmlDocument = Banana.Xml.newDocument("auditfile");
    
    var auditfile = addSchemaAndNamespaces(xmlDocument);
    var header = addHeader(auditfile, banDoc, startDate, endDate);
    var company = addCompany(auditfile, banDoc, startDate, endDate);
    var customersSuppliers = addCustomersSuppliers(company, banDoc, startDate, endDate);
    var generalLedger = addGeneralLedger(company, banDoc, startDate, endDate);
    var vatCodes = addVatCodes(company, banDoc, startDate, endDate);
    var periods = addPeriods(company, banDoc, startDate, endDate);
    var openingBalance = addOpeningBalance(company, banDoc, startDate, endDate);
    var transactions = addTransactions(company, banDoc, startDate, endDate);

    var output = Banana.Xml.save(xmlDocument);

	return output;
}

/* Initialize the xml schema */
function initSchemarefs(param) {
    param.schemaRefs = [
        'http://www.auditfiles.nl/XAF/3.2'
    ];
}

/* Initialize the xml namespaces */
function initNamespaces(param) {
    param.namespaces = [
        {
          'namespace' : 'http://www.auditfiles.nl/XAF/3.2',
          'prefix' : 'xmlns'
        },
        {
          'namespace' : 'http://www.w3.org/2001/XMLSchema-instance',
          'prefix' : 'xmlns:xsi'
        }
    ];
}


/********************************
*
*	XML document creation
*
********************************/
/* Function that adds xml schema and namespaces */
function addSchemaAndNamespaces(xml) {
	var param = {};
    var auditfile = xml.addElement("auditfile");
    //initSchemarefs(param);
    initNamespaces(param);

    var attrsSchemaLocation = '';
    for (var i in param.schemaRefs) {
        var schema = param.schemaRefs[i];
        if (schema.length > 0) {
            attrsSchemaLocation += schema;
        }
    }
    if (attrsSchemaLocation.length > 0) {
        auditfile.setAttribute("xsi:schemaLocation", attrsSchemaLocation);
    }

    for (var i in param.namespaces) {
        var prefix = param.namespaces[i]['prefix'];
        var namespace = param.namespaces[i]['namespace'];
        auditfile.setAttribute(prefix, namespace);
    }
    return auditfile;
}

/* Function that creates the <header> element of the xml file */
function addHeader(xml, banDoc, startDate, endDate) {

	/*
		<header>
			<fiscalYear>2016</fiscalYear>
			<startDate>2016-01-01</startDate>
			<endDate>2016-12-31</endDate>
			<curCode>EUR</curCode>
			<dateCreated>2017-09-01</dateCreated>
			<softwareDesc>Boekhoudsoftware</softwareDesc>
			<softwareVersion>V10.2.1</softwareVersion>
		</header>
	*/

    var fiscalYear = Banana.Converter.toDate(startDate).getFullYear();
    var curCode = banDoc.info("AccountingDataBase", "BasicCurrency");
    var date = new Date();
	var day = '';
	var month = '';
	var year = date.getFullYear();
	var dateCreated = '';
	var softwareDesc = 'Banana Accounting';
	var softwareVersion = banDoc.info("Base","ProgramVersion");

    day = date.getDate().toString();
    if (day.length < 2) {
        day = "0" + day;
    }
    month = (date.getMonth() + 1).toString();
    if (month.length < 2) {
        month = "0" + month;
    }
	dateCreated = year + '-' + month + '-' + day; // YYYY-MM-DD

	checkStringLength(fiscalYear, 4, 9);
	checkStringLength(startDate, 10, 16);
	checkStringLength(endDate, 10, 16);
	checkStringLength(curCode, 3, 3);
	checkStringLength(dateCreated, 10, 16);
	checkStringLength(softwareDesc, 0, 50);
	checkStringLength(softwareVersion, 0, 20);

	var headerNode = xml.addElement('header');
	var fiscalYearNode = headerNode.addElement('fiscalYear').addTextNode(fiscalYear);
	var startDateNode = headerNode.addElement('startDate').addTextNode(startDate);
	var endDateNode = headerNode.addElement('endDate').addTextNode(endDate);
	var curCodeNode = headerNode.addElement('curCode').addTextNode(curCode);
	var dateCreatedNode = headerNode.addElement('dateCreated').addTextNode(dateCreated);
	var softwareDescNode = headerNode.addElement('softwareDesc').addTextNode(softwareDesc);
	var softwareVersionNode = headerNode.addElement('softwareVersion').addTextNode(softwareVersion);

    return headerNode;
}

/* Function that creates the <company> element of the xml file */
function addCompany(xml, banDoc, startDate, endDate) {
	/*
		<company>
			<companyIdent>ID123456</companyIdent>
			<companyName>Voorbeeldbedrijf</companyName>
			<taxRegistrationCountry>NL</taxRegistrationCountry>
			<taxRegIdent>String</taxRegIdent>
			<streetAddress>
				<streetname>Straatnaam</streetname>
				<number>15</number>
				<numberExtension>A</numberExtension>
				<property>1e etage</property>
				<city>Rommeldam</city>
				<postalCode>5555FF</postalCode>
				<region>String</region>
				<country>NL</country>
			</streetAddress>
			<postalAddress>
				<streetname>Postbus 45</streetname>
				<number/>
				<numberExtension/>
				<property/>
				<city>Rommeldam</city>
				<postalCode>5555AA</postalCode>
				<region>String</region>
				<country>NL</country>
			</postalAddress>
		
			...
	
		<company>
	*/

	var companyIdent = '';
	var companyName = '';
	var taxRegistrationCountry = 'NL'; // take from dialog?
	var taxRegIdent = '';
	var streetname = '';
	var number = '';
	var numberExtension = '';
	var property = '';
	var city = '';
	var postalCode = '';
	var region = '';
	var country = '';

	if (banDoc.info("AccountingDataBase", "Company")) {
		companyName = banDoc.info("AccountingDataBase", "Company");
	}

	if (banDoc.info("AccountingDataBase","VatNumber")) {
		taxRegIdent = banDoc.info("AccountingDataBase","VatNumber");
	}

    if (banDoc.info("AccountingDataBase", "Address1")) {
    	streetname = banDoc.info("AccountingDataBase", "Address1");
    }

    if (banDoc.info("AccountingDataBase", "City")) {
    	city = banDoc.info("AccountingDataBase", "City");
    }

    if (banDoc.info("AccountingDataBase", "Zip")) {
    	postalCode = banDoc.info("AccountingDataBase", "Zip");
    }

    if (banDoc.info("AccountingDataBase", "State")) {
    	region = banDoc.info("AccountingDataBase", "State");
    }

    if (banDoc.info("AccountingDataBase", "Country")) {
    	country = banDoc.info("AccountingDataBase", "Country");
    }

    checkStringLength(companyIdent, 0, 35);
    checkStringLength(companyName, 0, 255);
    checkStringLength(taxRegistrationCountry, 2, 2);
    checkStringLength(taxRegIdent, 0, 30);
    checkStringLength(streetname, 0, 100);
    checkStringLength(property, 0, 50);
    checkStringLength(city, 0, 50);
    checkStringLength(postalCode, 0, 10);
    checkStringLength(region, 0, 50);
    checkStringLength(country, 0, 2);

    var companyNode = xml.addElement('company');
    
    var companyIdentNode = companyNode.addElement('companyIdent').addTextNode(companyIdent);
    var companyNameNode = companyNode.addElement('companyName').addTextNode(companyName);
    var taxRegistrationCountryNode = companyNode.addElement('taxRegistrationCountry').addTextNode(taxRegistrationCountry);
    var taxRegIdentNode = companyNode.addElement('taxRegIdent').addTextNode(taxRegIdent);

    var streetAddressNode = companyNode.addElement('streetAddress');
    var streetnameNode = streetAddressNode.addElement('streetname').addTextNode(streetname);
    var numberNode = streetAddressNode.addElement('number').addTextNode(number);
    var numberExtensionNode = streetAddressNode.addElement('numberExtension').addTextNode(numberExtension);
    var propertyNode = streetAddressNode.addElement('property').addTextNode(property);
    var cityNode = streetAddressNode.addElement('city').addTextNode(city);
    var postalCodeNode = streetAddressNode.addElement('postalCode').addTextNode(postalCode);
    var regionNode = streetAddressNode.addElement('region').addTextNode(region);
    var countryNode = streetAddressNode.addElement('country').addTextNode(country);

    var postalAddressNode = companyNode.addElement('postalAddress');
    var streetnameNode = postalAddressNode.addElement('streetname').addTextNode(streetname);
    var numberNode = postalAddressNode.addElement('number').addTextNode(number);
    var numberExtensionNode = postalAddressNode.addElement('numberExtension').addTextNode(numberExtension);
    var propertyNode = postalAddressNode.addElement('property').addTextNode(property);
    var cityNode = postalAddressNode.addElement('city').addTextNode(city);
    var postalCodeNode = postalAddressNode.addElement('postalCode').addTextNode(postalCode);
    var regionNode = postalAddressNode.addElement('region').addTextNode(region);
    var countryNode = postalAddressNode.addElement('country').addTextNode(country);

    return companyNode;
}

/* Function that creates the <customersSuppliers> element of the xml file */
function addCustomersSuppliers(xml, banDoc, startDate, endDate) {

	var customersGroup = banDoc.info('AccountingDataBase','CustomersGroup');
	var suppliersGroup = banDoc.info('AccountingDataBase','SuppliersGroup');
	var mapGroup = {};
	loadMapGroup(banDoc, mapGroup);

	var customersSuppliers = xml.addElement('customersSuppliers');

	//Creates customers element
	if (customersGroup) {
		var customersList = createCustomersList(banDoc, mapGroup, customersGroup);
	}

	//Create suppliers element
	if (suppliersGroup) {
		var suppliersList = createSuppliersList(banDoc, mapGroup, suppliersGroup);
	}

	if (customersGroup && suppliersGroup) { //customers and suppliers exist
		var customersSuppliersList = customersList.concat(suppliersList);
		createCustomersSuppliers(customersSuppliers, customersSuppliersList);
	}
	else if (customersGroup && !suppliersGroup) { //only customers exist
		var customersSuppliersList = customersList;
		createCustomersSuppliers(customersSuppliers, customersSuppliersList);
	}
	else if (!customersGroup && suppliersGroup) { //only supplier exist
		var customersSuppliersList = suppliersList;
		createCustomersSuppliers(customersSuppliers, customersSuppliersList);
	}

	return customersSuppliers;
}

/* Function that creates the <generalLedger> element of the xml file */
function addGeneralLedger(xml, banDoc, startDate, endDate) {

	/*
	<generalLedger>
		<ledgerAccount>
			<accID>String</accID>
			<accDesc>String</accDesc>
			<accTp>B</accTp>
			<leadCode>String</leadCode>
			<leadDescription>String</leadDescription>
			<leadReference>String</leadReference>
		</ledgerAccount>
	</generalLedger>
	*/

	var accID = '';
	var accDesc = '';
	var accTp = ''; //B=Balance; M=Mixed; P=Profit and Loss
	var leadCode = ''; // Gr ??
	var leadDescription = ''; //Gr Description ??
	var leadReference = ''; //BClass??

	var generalLedgerNode = xml.addElement('generalLedger');

    //Accounts table
    var accLen = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < accLen; i++) {
		var tRow = banDoc.table('Accounts').row(i);
		
		//Check the first character of the account number
		if (tRow.value('Account') && 
			tRow.value('Account').substring(0,1) !== '.' &&
			tRow.value('Account').substring(0,1) !== ',' && 
			tRow.value('Account').substring(0,1) !== ';' &&
			tRow.value('Account').substring(0,1) !== ':') 
		{

	        accID = tRow.value('Account');
	    	accDesc = tRow.value('Description');
	    	
	    	if (tRow.value('Gr')) {
	    		leadCode = tRow.value('Gr');
				
				try {
		    		leadDescription = banDoc.table('Accounts').findRowByValue('Group',leadCode).value("Description");
		    	} catch(e) {}
			}
	    	
	    	if (!banDoc.table('Categories')) {
	    		if (tRow.value('BClass')) {
	    			leadReference = tRow.value('BClass');
	    		}
	    	}
	    	
	    	//accTp
	    	if (tRow.value('BClass') === '1' || tRow.value('BClass') === '2') {
	    		accTp = 'B';
	    	} else if (tRow.value('BClass') === '3' || tRow.value('BClass') === '4') {
	    		accTp = 'P';
	    	} else {
	    		accTp = 'M'; //?
	    	}

			checkStringLength(accID, 1, 35);
			checkStringLength(accDesc, 1, 255);
			checkStringLength(accTp, 1, 2);
			checkStringLength(leadCode, 0, 999);
			checkStringLength(leadDescription, 0, 999);
			checkStringLength(leadReference, 0, 999);

			var ledgerAccountNode = generalLedgerNode.addElement('ledgerAccount');
			var accIDNode = ledgerAccountNode.addElement('accID').addTextNode(accID);
			var accDescNode = ledgerAccountNode.addElement('accDesc').addTextNode(accDesc);
			var accTpNode = ledgerAccountNode.addElement('accTp').addTextNode(accTp);
			var leadCodeNode = ledgerAccountNode.addElement('leadCode').addTextNode(leadCode);
			var leadDescriptionNode = ledgerAccountNode.addElement('leadDescription').addTextNode(leadDescription);
			var leadReferenceNode = ledgerAccountNode.addElement('leadReference').addTextNode(leadReference);
		}  
	}

	//Check table Categories to take income/expenses accounts
	if (banDoc.table('Categories')) {
		var catLen = banDoc.table('Categories').rowCount;
		
		for (var i = 0; i < catLen; i++) {
			var tRow = banDoc.table('Categories').row(i);

			//Check the first character of the account number
			if (tRow.value('Category') && 
				tRow.value('Category').substring(0,1) !== '.' &&
				tRow.value('Category').substring(0,1) !== ',' && 
				tRow.value('Category').substring(0,1) !== ';' &&
				tRow.value('Category').substring(0,1) !== ':') 
			{

				accID = tRow.value('Category');
		    	accDesc = tRow.value('Description');
		    	accTp = 'P';
		    	if (tRow.value('Gr')) {
		    		leadCode = tRow.value('Gr');
		    	
		    		try {
						leadDescription = banDoc.table('Categories').findRowByValue('Group',leadCode).value("Description");
		    		} catch(e) {}
		    	}

				checkStringLength(accID, 1, 35);
				checkStringLength(accDesc, 1, 255);
				checkStringLength(accTp, 1, 2);
				checkStringLength(leadCode, 0, 999);
				checkStringLength(leadDescription, 0, 999);
				checkStringLength(leadReference, 0, 999);

				var ledgerAccountNode = generalLedgerNode.addElement('ledgerAccount');
				var accIDNode = ledgerAccountNode.addElement('accID').addTextNode(accID);
				var accDescNode = ledgerAccountNode.addElement('accDesc').addTextNode(accDesc);
				var accTpNode = ledgerAccountNode.addElement('accTp').addTextNode(accTp);
				var leadCodeNode = ledgerAccountNode.addElement('leadCode').addTextNode(leadCode);
				var leadDescriptionNode = ledgerAccountNode.addElement('leadDescription').addTextNode(leadDescription);
				var leadReferenceNode = ledgerAccountNode.addElement('leadReference').addTextNode(leadReference);
			}
		}
	}

	return generalLedgerNode;	
}

/* Function that creates the <vatCodes> element of the xml file */
function addVatCodes(xml, banDoc, startDate, endDate) {

	/*
	<vatCodes>
		<vatCode>
			<vatID>String</vatID>
			<vatDesc>String</vatDesc>
			<vatToPayAccID>String</vatToPayAccID>
			<vatToClaimAccID>String</vatToClaimAccID>
		</vatCode>
	</vatCodes>
	*/

    var vatID = '';
    var vatDesc = '';
    var vatToPayAccID = ''; //Conto creditore in cui è contabilizzata l'IVA da versare
    var vatToClaimAccID = ''; //Conto creditore sul quale è contabilizzata l'IVA da riscuotere

    //If the table VatCodes exists we take the values
    if (banDoc.table("VatCodes")) {

	    //Add vatCodes element to the xml document
		var vatCodesNode = xml.addElement('vatCodes');

	    var vatCodesTable = banDoc.table("VatCodes");
	    for (var i = 0; i < vatCodesTable.rowCount; i++) {
	        var tRow = vatCodesTable.row(i);

	        if (tRow.value("VatCode")) {
		        vatID = tRow.value("VatCode");
		        vatDesc = tRow.value("Description");
		        
		        if (tRow.value("VatAccount")) {
		        	vatToPayAccID = tRow.value("VatAccount"); //??
		        }
		        if (tRow.value("VatAccount")) {
		        	vatToClaimAccID = tRow.value("VatAccount"); //??
		        }

				checkStringLength(vatID, 1, 35);
				checkStringLength(vatDesc, 1, 100);
				checkStringLength(vatToPayAccID, 0, 35);
				checkStringLength(vatToClaimAccID, 0, 35);

				var vatCodeNode = vatCodesNode.addElement('vatCode');
				var vatIDNode = vatCodeNode.addElement('vatID').addTextNode(vatID);
				var vatDescNode = vatCodeNode.addElement('vatDesc').addTextNode(vatDesc);
				var vatToPayAccIDNode = vatCodeNode.addElement('vatToPayAccID').addTextNode(vatToPayAccID);
				var vatToClaimAccIDNode = vatCodeNode.addElement('vatToClaimAccID').addTextNode(vatToClaimAccID);

	    	}
	    }
	}

    return vatCodesNode;
}

/* Function that creates the <periods> element of the xml file */
function addPeriods(xml, banDoc, startDate, endDate) {
	/*
    <periods>
        <period>
            <periodNumber>1</periodNumber>
            <startDatePeriod>2016-01-01</startDatePeriod>
            <endDatePeriod>2016-01-31</endDatePeriod>
        </period>
        <period>
            <periodNumber>2</periodNumber>
            <startDatePeriod>2016-02-01</startDatePeriod>
            <endDatePeriod>2016-02-29</endDatePeriod>
        </period>
		...
    </periods>
	*/

	var year = Banana.Converter.toDate(startDate).getFullYear();
	var periodsNode = xml.addElement('periods');
	var periodNumber = "";
	var periodNumberNode = "";
	var startDatePeriodNode = "";
	var endDatePeriodNode = "";
	for (var i = 1; i <= 12; i++) {

		periodNumber = i;
		periodNode = periodsNode.addElement('period');
		periodNumberNode = periodNode.addElement('periodNumber').addTextNode(periodNumber);

		if (periodNumber == 1) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-01-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-01-31");
		}
		else if (periodNumber == 2) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-02-01");
			if (year === "2020" || year === "2024" || year === "2028") {
				endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-02-29");
			} else {
				endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-02-28");
			}
		}
		else if (periodNumber == 3) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-03-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-03-31");		
		}
		else if (periodNumber == 4) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-04-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-04-30");		
		}
		else if (periodNumber == 5) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-05-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-05-31");	
		}
		else if (periodNumber == 6) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-06-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-06-30");	
		}
		else if (periodNumber == 7) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-07-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-07-31");		
		}
		else if (periodNumber == 8) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-08-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-08-31");		
		}
		else if (periodNumber == 9) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-09-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-09-30");		
		}
		else if (periodNumber == 10) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-10-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-10-31");		
		}
		else if (periodNumber == 11) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-11-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-11-30");		
		}
		else if (periodNumber == 12) {
			startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(year + "-12-01");
			endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(year + "-12-31");		
		}
	}

	return periodsNode;
}

/* Function that creates the <openingBalance> element of the xml file (only if there are opening balances) */
function addOpeningBalance(xml, banDoc, startDate, endDate) {
	/*
	<openingBalance>
	   <opBalDate>2017-01-01</opBalDate>
	   <opBalDesc>openings balans</opBalDesc>
	   <linesCount>22</linesCount>
	   <totalDebit>1109753.22</totalDebit>
	   <totalCredit>1109753.22</totalCredit>
	   <obLine>
	      <nr>1</nr>
	      <accID>0020</accID>
	      <amnt>516225.00</amnt>
	      <amntTp>D</amntTp>
	   </obLine>
	   <obLine>
	      <nr>2</nr>
	      <accID>0025</accID>
	      <amnt>260000.00</amnt>
	      <amntTp>D</amntTp>
	   </obLine>
	   ...
	</openingBalance>
	*/

	var openingBalanceNode = '';
	var opBalDate = '';
	var opBalDesc = '';
	var linesCount = 0;
	var totalDebit = '';
	var totalCredit = '';
	var nr = 0;
	var accID = '';
	var amnt = '';
	var amntTp = '';

	var year = Banana.Converter.toDate(startDate).getFullYear();
	opBalDate = year+'-01-01';
	opBalDesc = 'Beginsaldi';

	//count lines number with opening balances and totalDebit/totalCredit amounts
    var accountsTable = banDoc.table("Accounts");
    for (var i = 0; i < accountsTable.rowCount; i++) {
        var tRow = accountsTable.row(i);
        if (tRow.value('Account') && tRow.value('Opening')) {
        	linesCount++;
        	if (Banana.SDecimal.sign(tRow.value('Opening')) == 1) {
	        	totalDebit = Banana.SDecimal.add(totalDebit,tRow.value('Opening'));
	        } else if (Banana.SDecimal.sign(tRow.value('Opening')) == -1) {
	        	totalCredit = Banana.SDecimal.add(totalCredit,tRow.value('Opening'));
	        }
        }
    }

	if (linesCount > 0) {
		var openingBalanceNode = xml.addElement('openingBalance');
		var opBalDateNode = openingBalanceNode.addElement('opBalDate').addTextNode(opBalDate);
		var opBalDescNode = openingBalanceNode.addElement('opBalDesc').addTextNode(opBalDesc);
		var linesCountNode = openingBalanceNode.addElement('linesCount').addTextNode(linesCount);
		var totalDebitNode = openingBalanceNode.addElement('totalDebit').addTextNode(totalDebit);
		var totalCreditNode = openingBalanceNode.addElement('totalCredit').addTextNode(Banana.SDecimal.abs(totalCredit));	
		
		// Get all the opening balances
	    var accountsTable = banDoc.table("Accounts");
	    for (var i = 0; i < accountsTable.rowCount; i++) {
	        
	        var tRow = accountsTable.row(i);
	        var account = tRow.value('Account');
	        var openingAmount = tRow.value('Opening');

	        if (account && openingAmount) {
		        nr = nr + 1;
		        accID = account;
		        amnt = Banana.SDecimal.abs(openingAmount);
		        if (Banana.SDecimal.sign(openingAmount) == 1) {
		        	amntTp = "D";
		        } else if (Banana.SDecimal.sign(openingAmount) == -1) {
		        	amntTp = "C";
		        }
				var obLineNode = openingBalanceNode.addElement('obLine');
				var nrNode = obLineNode.addElement('nr').addTextNode(nr);
				var accIDNode = obLineNode.addElement('accID').addTextNode(accID);
				var amntNode = obLineNode.addElement('amnt').addTextNode(amnt);
				var amntTpNode = obLineNode.addElement('amntTp').addTextNode(amntTp);
		    }
		}
		return openingBalanceNode;
	}
	else {
		//Returns the xml only if there are opening balances
		return;
	}
}

/* Function that creates the <transactions> element of the xml file */
function addTransactions(xml, banDoc, startDate, endDate) {

	/*
	<linesCount>1</linesCount>
	<totalDebit>3.14</totalDebit>
	<totalCredit>3.14</totalCredit>
	*/

	var linesCount = ''; //numero righe registrazioni
	var totalDebit = ''; //totale debit registrazioni
	var totalCredit = ''; //totale credit registrazioni

	linesCount = getTotalRowsTransactions(banDoc, startDate, endDate);
	totalDebit = getTotalDebitTransactions(banDoc, startDate, endDate);
	totalCredit = getTotalCreditTransactions(banDoc, startDate, endDate);

	checkStringLength(linesCount, 1, 10);

	var transactionsNode = xml.addElement('transactions');
	var linesCountNode = transactionsNode.addElement('linesCount').addTextNode(linesCount);
	var totalDebit = transactionsNode.addElement('totalDebit').addTextNode(totalDebit);
	var totalCredit = transactionsNode.addElement('totalCredit').addTextNode(totalCredit);
			
	//Add journal element
	var journal = addJournal(transactionsNode, banDoc, startDate, endDate);

	//Add subledgers element
	//var subledgers = addSubledgers(transactionsNode, banDoc, startDate, endDate);
	
	return transactionsNode;
}


/********************************
	CUSTOMERS/SUPPLIERS functions
********************************/
/* The function creates an array of group values for the given group */
function loadMapGroup(banDoc, mapGroup) {
	var len = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {
		var tRow = banDoc.table('Accounts').row(i);
		if (tRow.value('Group')) {
			//mapGroup[tRow.value('Group')].parent = tRow.value('Gr');
			mapGroup[tRow.value('Group')] = {'parent' : tRow.value('Gr')}
		}
	}
}

/* Function that checks the belonging of the groups */
function groupBelongToGroup(mapGroup, current, find, start) {

	if (!start) {
		start = current;
	}

	if (!current) {
		return false;
	}

	if (!find) {
		return false;
	}

	if (mapGroup[current].parent === find) {
		return true;
	}

	if (mapGroup[current].parent === start) {
		return false;
	}

	return groupBelongToGroup(mapGroup, mapGroup[current].parent, find, start);
}

/* Function that creates the customers list */
function createCustomersList(banDoc, mapGroup, customersGroup) {
	
	var list = [];

	var len = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {		
		var tRow = banDoc.table('Accounts').row(i);

		if (tRow.value('Gr') === customersGroup || groupBelongToGroup(mapGroup, tRow.value('Gr'), customersGroup)) {

			var customersList = {};

		    if (tRow.value('OrganisationName')) {
		    	var companyName = tRow.value('OrganisationName');
		    } else {
		    	var companyName = '';
		    }

		    if (tRow.value('FirstName') && tRow.value('FamilyName')) {
				var contact = tRow.value('FirstName') + ' ' + tRow.value('FamilyName');
			} else{
				var contact = '';
			}

			customersList.custSupID = tRow.value('Account');
			customersList.custSupName = companyName;
			customersList.contactPerson = contact;
		    customersList.telephone = tRow.value('PhoneMain');
		    customersList.fax = tRow.value('Fax');
		    customersList.eMail = tRow.value('EmailWork');
		    customersList.website = tRow.value('Website');
		    customersList.commerceNr = ''; //Dialog?
		    customersList.taxRegistrationCountry = tRow.value('CountryCode'); //?? Dialog?
		    customersList.taxRegIdent = ''; //Dialog?
		    customersList.relationshipID = tRow.value('VatNumber'); //We take the Vat Number??
		    customersList.custSupTp = 'C'; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
		    customersList.custSupGrpID = '';

			if (tRow.value('CreditLimit')) {
				customersList.custCreditLimit = tRow.value('CreditLimit'); //??? importo limite del debitore
			}
			
			// customersList.supplierLimit = ''; //??? importo limite del creditore

		    customersList.streetname = tRow.value('Street');
		    customersList.number = '';
		    customersList.numberExtension = '';
	        customersList.property = '';
	        customersList.city = tRow.value('Locality');
	        customersList.postalCode = tRow.value('PostalCode');
	        customersList.region = tRow.value('Region');
	        customersList.country = tRow.value('CountryCode');
	        
	        if (tRow.value('BankIban')) {
				customersList.bankAccNr = tRow.value('BankIban'); //Bank account number
				customersList.bankIdCd = '';
			}
			
			// customersList.userID = userID;
			// customersList.changeDateTime = changeDateTime;
			// customersList.changeDescription = changeDescription;
			
			list.push(customersList);
		}
	}

	return list;
}

/* Function that creates the suppliers list */
function createSuppliersList(banDoc, mapGroup, suppliersGroup) {

	var list = [];
	
	var len = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {
		var tRow = banDoc.table('Accounts').row(i);
		
		if (tRow.value('Gr') === suppliersGroup || groupBelongToGroup(mapGroup, tRow.value('Gr'), suppliersGroup)) {
		    
			var suppliersList = {};

		    if (tRow.value('OrganisationName')) {
		    	var companyName = tRow.value('OrganisationName');
		    } else {
		    	var companyName = '';
		    }

		    if (tRow.value('FirstName') && tRow.value('FamilyName')) {
				var contact = tRow.value('FirstName') + ' ' + tRow.value('FamilyName');
			} else{
				var contact = '';
			}

			suppliersList.custSupID = tRow.value('Account');
			suppliersList.custSupName = companyName;
			suppliersList.contactPerson = contact;
		    suppliersList.telephone = tRow.value('PhoneMain');
		    suppliersList.fax = tRow.value('Fax');
		    suppliersList.eMail = tRow.value('EmailWork');
		    suppliersList.website = tRow.value('Website');
		    suppliersList.commerceNr = ''; //Dialog?
		    suppliersList.taxRegistrationCountry = tRow.value('CountryCode'); //?? Dialog?
		    suppliersList.taxRegIdent = ''; //Dialog?
		    suppliersList.relationshipID = tRow.value('VatNumber'); //We take the Vat Number??
		    suppliersList.custSupTp = 'S'; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
		    suppliersList.custSupGrpID = '';

			if (tRow.value('CreditLimit')) {
				suppliersList.custCreditLimit = tRow.value('CreditLimit'); //??? importo limite del debitore
			}
			
			// suppliersList.supplierLimit = ''; //??? importo limite del creditore

		    suppliersList.streetname = tRow.value('Street');
		    suppliersList.number = '';
		    suppliersList.numberExtension = '';
	        suppliersList.property = '';
	        suppliersList.city = tRow.value('Locality');
	        suppliersList.postalCode = tRow.value('PostalCode');
	        suppliersList.region = tRow.value('Region');
	        suppliersList.country = tRow.value('CountryCode');
	        
	        if (tRow.value('BankIban')) {
				suppliersList.bankAccNr = tRow.value('BankIban'); //Bank account number
				suppliersList.bankIdCd = '';
			}
		
			// suppliersList.userID = userID;
			// suppliersList.changeDateTime = changeDateTime;
			// suppliersList.changeDescription = changeDescription;
		
			list.push(suppliersList);
		}
	}	
	return list;
}

/* Function thata crates all the customerSupplier elements */
function createCustomersSuppliers(xml, customersSuppliersList) {
	/*
	<customersSuppliers>
		<customerSupplier>
			<custSupID>Debiteur123</custSupID>
			<custSupName>VoorbeeldDebiteur</custSupName>
			<contact>Contactpersoon</contact>
			<telephone>+31 88 888111888</telephone>
			<fax>+31 88 88822888</fax>
			<eMail>info@voobeelden.info</eMail>
			<website>http://www.voorbeelden.info</website>
			<commerceNr>String</commerceNr>
			<taxRegistrationCountry>AD</taxRegistrationCountry>
			<taxRegIdent>String</taxRegIdent>
			<relationshipID>String</relationshipID>
			<custSupTp>B</custSupTp>
			<custSupGrpID>String</custSupGrpID>
			<custCreditLimit>3.14</custCreditLimit>
			<supplierLimit>3.14</supplierLimit>
			<streetAddress>
				<streetname>String</streetname>
				<number>String</number>
				<numberExtension>String</numberExtension>
				<property>String</property>
				<city>String</city>
				<postalCode>String</postalCode>
				<region>String</region>
				<country>AD</country>
			</streetAddress>
			<postalAddress>
				<streetname>String</streetname>
				<number>String</number>
				<numberExtension>String</numberExtension>
				<property>String</property>
				<city>String</city>
				<postalCode>String</postalCode>
				<region>String</region>
				<country>AD</country>
			</postalAddress>
			<bankAccount>
				<bankAccNr>String</bankAccNr>
				<bankIdCd>String</bankIdCd>
			</bankAccount>
			<changeInfo>
				<userID>String</userID>
				<changeDateTime>2001-12-17T09:30:47-05:00</changeDateTime>
				<changeDescription>String</changeDescription>
			</changeInfo>
			<customerSupplierHistory/>
		</customerSupplier>
	</customersSuppliers>
	*/
	var customerSupplierNode;
	
	for (var i = 0; i < customersSuppliersList.length; i++) {

		// Banana.document.addMessage(JSON.stringify(customersSuppliersList[i], "", ""));

		checkStringLength(customersSuppliersList[i].custSupID, 1, 35);
		checkStringLength(customersSuppliersList[i].custSupName, 0, 50);
		checkStringLength(customersSuppliersList[i].contactPerson, 0, 50);
		checkStringLength(customersSuppliersList[i].telephone, 0, 30);
		checkStringLength(customersSuppliersList[i].fax, 0, 30);
		checkStringLength(customersSuppliersList[i].eMail, 0, 255);
		checkStringLength(customersSuppliersList[i].website, 0, 255);
		checkStringLength(customersSuppliersList[i].commerceNr, 0, 100);
		checkStringLength(customersSuppliersList[i].taxRegistrationCountry, 0, 2);
		checkStringLength(customersSuppliersList[i].taxRegIdent, 0, 30);
		checkStringLength(customersSuppliersList[i].relationshipID, 0, 35);
		checkStringLength(customersSuppliersList[i].custSupTp, 0, 1);
		checkStringLength(customersSuppliersList[i].custSupGrpID, 0, 35);
		checkStringLength(customersSuppliersList[i].streetname, 0, 100);
		checkStringLength(customersSuppliersList[i].property, 0, 50);
		checkStringLength(customersSuppliersList[i].city, 0, 50);
		checkStringLength(customersSuppliersList[i].postalCode, 0, 10);
		checkStringLength(customersSuppliersList[i].region, 0, 50);
		checkStringLength(customersSuppliersList[i].country, 0, 2);

        customerSupplierNode = xml.addElement('customerSupplier');
		
		var custSupIDNode = customerSupplierNode.addElement('custSupID').addTextNode(customersSuppliersList[i].custSupID);
		var custSupNameNode = customerSupplierNode.addElement('custSupName').addTextNode(customersSuppliersList[i].custSupName);
		var contactNode = customerSupplierNode.addElement('contact').addTextNode(customersSuppliersList[i].contactPerson);
		var telephoneNode = customerSupplierNode.addElement('telephone').addTextNode(customersSuppliersList[i].telephone);
		var faxNode = customerSupplierNode.addElement('fax').addTextNode(customersSuppliersList[i].fax);
		var eMailNode = customerSupplierNode.addElement('eMail').addTextNode(customersSuppliersList[i].eMail);
		var websiteNode = customerSupplierNode.addElement('website').addTextNode(customersSuppliersList[i].website);
		var commerceNrNode = customerSupplierNode.addElement('commerceNr').addTextNode(customersSuppliersList[i].commerceNr);
		var taxRegistrationCountryNode = customerSupplierNode.addElement('taxRegistrationCountry').addTextNode(customersSuppliersList[i].taxRegistrationCountry);
		var taxRegIdentNode = customerSupplierNode.addElement('taxRegIdent').addTextNode(customersSuppliersList[i].taxRegIdent);
		var relationshipIDNode = customerSupplierNode.addElement('relationshipID').addTextNode(customersSuppliersList[i].relationshipID);
		var custSupTpNode = customerSupplierNode.addElement('custSupTp').addTextNode(customersSuppliersList[i].custSupTp);
		var custSupGrpIDNode = customerSupplierNode.addElement('custSupGrpID').addTextNode(customersSuppliersList[i].custSupGrpID);
		
		if (customersSuppliersList[i].custCreditLimit) {
        	checkStringLength(customersSuppliersList[i].custCreditLimit, 0, 20);
			var custCreditLimitNode = customerSupplierNode.addElement('custCreditLimit').addTextNode(customersSuppliersList[i].custCreditLimit);
		}

		// //supplierLimit element
		// checkStringLength(customersSuppliersList[i].supplierLimit, 0, 20);
		// var supplierLimitNode = customerSupplierNode.addElement('supplierLimit').addTextNode(customersSuppliersList[i].supplierLimit);

		var streedAddressNode = customerSupplierNode.addElement('streetAddress');
		var addressNode = streedAddressNode.addElement('streetname').addTextNode(customersSuppliersList[i].streetname);
		var numberNode = streedAddressNode.addElement('number').addTextNode(customersSuppliersList[i].number);
		var numberExtensionNode = streedAddressNode.addElement('numberExtension').addTextNode(customersSuppliersList[i].numberExtension);
		var propertyNode = streedAddressNode.addElement('property').addTextNode(customersSuppliersList[i].property);
		var cityNode = streedAddressNode.addElement('city').addTextNode(customersSuppliersList[i].city);
		var postalCodeNode = streedAddressNode.addElement('postalCode').addTextNode(customersSuppliersList[i].postalCode);
		var regionNode = streedAddressNode.addElement('region').addTextNode(customersSuppliersList[i].region);
		var countryNode = streedAddressNode.addElement('country').addTextNode(customersSuppliersList[i].country);

		// var postalAddressNode = customerSupplierNode.addElement('postalAddress');
		// var addressNode = postalAddressNode.addElement('streetname').addTextNode(customersSuppliersList[i].streetname);
		// var numberNode = postalAddressNode.addElement('number').addTextNode(customersSuppliersList[i].number);
		// var numberExtensionNode = postalAddressNode.addElement('numberExtension').addTextNode(customersSuppliersList[i].numberExtension);
		// var propertyNode = postalAddressNode.addElement('property').addTextNode(customersSuppliersList[i].property);
		// var cityNode = postalAddressNode.addElement('city').addTextNode(customersSuppliersList[i].city);
		// var postalCodeNode = postalAddressNode.addElement('postalCode').addTextNode(customersSuppliersList[i].postalCode);
		// var regionNode = postalAddressNode.addElement('region').addTextNode(customersSuppliersList[i].region);
		// var countryNode = postalAddressNode.addElement('country').addTextNode(customersSuppliersList[i].country);

		if (customersSuppliersList[i].bankAccNr) {
			checkStringLength(customersSuppliersList[i].bankAccNr, 1, 35);
	    	checkStringLength(customersSuppliersList[i].bankIdCd, 0, 35);
	    	checkStringLength(customersSuppliersList[i].bankIdCd, 0, 999);
			var bankAccountNode = customerSupplierNode.addElement('bankAccount');
			var bankAccNrNode = bankAccountNode.addElement('bankAccNr').addTextNode(customersSuppliersList[i].bankAccNr);
			var bankIdCdNode = bankAccountNode.addElement('bankIdCd').addTextNode(customersSuppliersList[i].bankIdCd);
		}
	}

	return customerSupplierNode;
}


/************************* 
	TRANSACTIONS functions
*************************/
/* Function that gets the total rows used for the transactions */
function getTotalRowsTransactions(banDoc, startDate, endDate) {
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var len = journal.rowCount;
	var rows = 0;
	var tmpGroup;
	var newTransaction = 'unknown';

	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//Transactions between the defined period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {
			
			//The row doesn't belongs to any previous transaction
			//In this case we have to create a new transaction with all the lines belonging to it
			if (tmpGroup != tRow.value('JContraAccountGroup')) {

				
				//If the current JContraAccountGroup is different from the previous, then begins a new transaction
				newTransaction = 'true';
							
				//Increase the transaction's counter every time a there is a new <transaction> element
				rows++;

				//Everytime there is a new transaction, we save the new JContraAccountGroup value.
				//We will use it to determine if the next row belongs to the same transaction or not.
				tmpGroup = tRow.value('JContraAccountGroup');
			}

			//The row belongs to the same (previous) transaction
			else if (tmpGroup == tRow.value('JContraAccountGroup')) {
				//We set the value of the variable to false, to indicate that the transaction <element> could be created:
				//this only if the JContraAccountGroup value of the next row is different from the current one
				newTransaction = 'false';
			}
		}
	}
	return rows;
}

/* Function that retrieves the total debit amount of the transactions */
function getTotalDebitTransactions(banDoc, startDate, endDate) {
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var len = journal.rowCount;
	var totDebit ='';

	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//Transactions between the defined period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {
			
            // Debit
            if (Banana.SDecimal.sign(tRow.value('JAmount')) > 0 ) {
                totDebit = Banana.SDecimal.add(totDebit, tRow.value('JDebitAmount'), {'decimals':2});
            }
		}
	}

	//var totDebit = banDoc.table("Totals").findRowByValue("Group","3").value("Balance");
	return totDebit;
}

/* Function that retrieves the total credit amount of the transactions */
function getTotalCreditTransactions(banDoc, startDate, endDate) {
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var len = journal.rowCount;
	var totCredit = '';

	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//Transactions between the defined period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {
			
            // Credit
            if (Banana.SDecimal.sign(tRow.value('JAmount')) < 0 ) {
                totCredit = Banana.SDecimal.add(totCredit, tRow.value('JCreditAmount'), {'decimals':2});
            }
		}
	}

	//var totCredit = banDoc.table("Totals").findRowByValue("Group","4").value("Balance");
	return totCredit;
}

/* Function that creates the journal xml element */
function addJournal(transactionsNode, banDoc, startDate, endDate) {
	/*
	<journal>
		<jrnID>String</jrnID>
		<desc>String</desc>
		<jrnTp>B</jrnTp>
		<offsetAccID>String</offsetAccID>
		<bankAccNr>String</bankAccNr>
		<transaction>
			<nr>String</nr>
			<desc>String</desc>
			<periodNumber>1</periodNumber>
			<trDt>1967-08-13</trDt>
			<amnt>3.14</amnt>
			<amntTp>C</amntTp>
			<trLine>
				<nr>String</nr>
				<accID>String</accID>
				<docRef>String</docRef>
				<effDate>1967-08-13</effDate>
				<desc>String</desc>
				<amnt>3.14</amnt>
				<amntTp>C</amntTp>
				<vat>
					<vatID>String</vatID>
					<vatPerc>0</vatPerc>
					<vatAmnt>3.1</vatAmnt>
					<vatAmntTp>C</vatAmntTp>
				</vat>
				<currency>
					<curCode>AED</curCode>
					<curAmnt>3.14</curAmnt>
				</currency>
			</trLine>
		</transaction>
	</journal>
	*/

	var jrnID = '1';
	var desc = 'Journal 1';
	var jrnTp = 'Z';
	//jrnTp: B=Bank; C=Cash; G=Goods (received/sent); M=Memo/Daybook; O=Opening Balance; P=Purchases; S=Sales; T=Production; Y=Payroll; Z=Other
	var offsetAccID = ''; //String
	var bankAccNr = ''; //String

	checkStringLength(jrnID, 1, 35);
	checkStringLength(desc, 1, 9999);
	checkStringLength(jrnTp, 0, 2);
	checkStringLength(offsetAccID, 0, 35);
	checkStringLength(bankAccNr, 0, 35);


	/* Create journal element */
	var journalNode = transactionsNode.addElement('journal');
	var jrnIDNode = journalNode.addElement('jrnID').addTextNode(jrnID);
	var descNode = journalNode.addElement('desc').addTextNode(desc);
	var jrnTpNode = journalNode.addElement('jrnTp').addTextNode(jrnTp);
	var offsetAccIDNode = journalNode.addElement('offsetAccID').addTextNode(offsetAccID);
	var bankAccNrNode = journalNode.addElement('bankAccNr').addTextNode(bankAccNr);

	/* Create transaction element */
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var transactionNode = '';
	var trLineNode = '';
	var tmpTransactionGroup = '';
	var len = journal.rowCount;
	var transactionCreated = false;

	//Read each row of the table
	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//From the journal we take only transactions rows between the period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {

			//The row doesn't belongs to any previous transaction
			//In this case we have to create a new transaction with all the lines belonging to it
			if (tmpTransactionGroup !== tRow.value('JContraAccountGroup')) {

				//transaction element has not been created yet, so we create it
				if (!transactionCreated) {

					var nr = ''; //string => JRowOrigin? Doc?
					var desc = ''; //string
					var periodNumber = ''; //number
					var trDt = ''; //transaction date

					//Get values
					nr = tRow.value('JRowOrigin');
					desc = tRow.value('JDescription');
					trDt = tRow.value('JDate');

					if (trDt.substring(5,7) === '01') {
						periodNumber = '1';
					} else if (trDt.substring(5,7) === '02') {
						periodNumber = '2';
					} else if (trDt.substring(5,7) === '03') {
						periodNumber = '3';
					} else if (trDt.substring(5,7) === '04') {
						periodNumber = '4';
					} else if (trDt.substring(5,7) === '05') {
						periodNumber = '5';
					} else if (trDt.substring(5,7) === '06') {
						periodNumber = '6';
					} else if (trDt.substring(5,7) === '07') {
						periodNumber = '7';
					} else if (trDt.substring(5,7) === '08') {
						periodNumber = '8';
					} else if (trDt.substring(5,7) === '09') {
						periodNumber = '9';
					} else if (trDt.substring(5,7) === '10') {
						periodNumber = '10';
					} else if (trDt.substring(5,7) === '11') {
						periodNumber = '11';
					} else if (trDt.substring(5,7) === '12') {
						periodNumber = '12';
					}

					checkStringLength(nr, 1, 35);
					checkStringLength(desc, 0, 9999);
					checkStringLength(periodNumber, 1, 3);
					checkStringLength(trDt, 1, 16);

					transactionNode = journalNode.addElement('transaction');
					var nrNode = transactionNode.addElement('nr').addTextNode(nr);
					var descNode = transactionNode.addElement('desc').addTextNode(desc);
					var periodNumberNode = transactionNode.addElement('periodNumber').addTextNode(periodNumber); 
					var trDtNode = transactionNode.addElement('trDt').addTextNode(trDt);

					//Reset value of the lines text
					trLineNode = '';

					//transaction element now has been created
					transactionCreated = true;
				}

				//Everytime there is a new transaction, we save the new JContraAccountGroup value.
				//We will use it to determine if the next row belongs to the same transaction or not.
				tmpTransactionGroup = tRow.value('JContraAccountGroup');
			}

			//The row belongs to the same (previous) transaction
			else if (tmpTransactionGroup === tRow.value('JContraAccountGroup')) {
				//We set the value of the variable to false, to indicate that the transaction <element> could be created:
				//this only if the JContraAccountGroup value of the next row is different from the current one
				transactionCreated = false;
			}

			//In every case, independently from the 'If...Else Statements', for each transactions rows we create the <trLine> element
			trLineNode = createTransactionLine(tRow, transactionNode, banDoc, startDate, endDate);
		}
	}

	//return the journal element
	return journalNode;
}

/* Function that creates the trLine xml element */
function createTransactionLine(tRow, transactionNode, banDoc, startDate, endDate) {
	
	/*
	<trLine>
		<nr>String</nr>
		<accID>String</accID>
		<docRef>String</docRef>
		<effDate>1967-08-13</effDate>
		<desc>String</desc>
		<amnt>3.14</amnt>
		<amntTp>C</amntTp>
		<vat>
			<vatID>String</vatID>
			<vatPerc>0</vatPerc>
			<vatAmnt>3.1</vatAmnt>
			<vatAmntTp>C</vatAmntTp>
		</vat>
		<currency>
			<curCode>AED</curCode>
			<curAmnt>3.14</curAmnt>
		</currency>
	</trLine>
	*/

	var nr = tRow.value('JRowOrigin'); //string
	var accID = tRow.value('JAccount'); //string
	var docRef = tRow.value('Doc'); //string
	if (!docRef) {
		docRef = "docRef";
	}
	var effDate = tRow.value('JDate'); //We use the date of the transaction
	var desc = tRow.value('JAccountDescription'); //string
	var amnt = ''; //amount
	var amntTp = ''; //string
	var vatID = '';
	var vatPerc = '';
	var vatAmnt = '';
	var vatAmntTp = '';

	amnt = tRow.value('JAmount');
    if (Banana.SDecimal.sign(amnt) >= 0) {
		amntTp = 'D';
    } else if (Banana.SDecimal.sign(amnt) < 0) {
    	amntTp = 'C';
    }

    //Get values vat element
    if (tRow.value('VatCode')) {

	    vatID = tRow.value('VatCode');

		if (tRow.value('VatRate')) {
			vatPerc = Banana.SDecimal.abs(tRow.value('VatRate')); //positive value (type xsd: Decimal8)
		} else {
			vatPerc = '0.00'; //vatPerc must be a double: if the value does not exists we have to set to 0.00
		}

		if (tRow.value('VatPosted')) {
			vatAmnt = tRow.value('VatPosted');
		} else {
			vatAmnt = '0.00'; //vatAmnt must be a decimal: if the value does not exists we have to set to 0.00
		}

		//vatAmntTp must be D/C (debit/credit): if the vatAmnt is 0, we set the value of vatAmntTp to D (debit)
		if (Banana.SDecimal.sign(vatAmnt) >= 0) {
			vatAmntTp = 'D'; //debit
		} else if (Banana.SDecimal.sign(vatAmnt) < 0) {
			vatAmntTp = 'C'; //credit
		}
	}

	// //currency element not in basic currency
	// curCode = tRow.value('JTransactionCurrency');
	// curAmnt = tRow.value('JAmountTransactionCurrency');
	

	//If the transaction line has an Amount, then we retrieve the data
	if (amnt) {
		amnt = Banana.SDecimal.abs(amnt); //amounts must always be positive (D,C for the sign)

		checkStringLength(nr, 1, 35);
		checkStringLength(accID, 1, 35);
		checkStringLength(docRef, 1, 255);
		checkStringLength(effDate, 10, 16);
		checkStringLength(desc, 0, 9999);
		checkStringLength(amnt, 0, 20);
		checkStringLength(amntTp, 0, 1);

		var trLineNode = transactionNode.addElement('trLine');
		
		var nrNode = trLineNode.addElement('nr').addTextNode(nr);
		var accIDNode = trLineNode.addElement('accID').addTextNode(accID);
		var docRefNode = trLineNode.addElement('docRef').addTextNode(docRef);
		var effDateNode = trLineNode.addElement('effDate').addTextNode(effDate);
		var descNode = trLineNode.addElement('desc').addTextNode(desc);
		var amntNode = trLineNode.addElement('amnt').addTextNode(amnt);
		var amntTpNode = trLineNode.addElement('amntTp').addTextNode(amntTp);

		//vat element only if there is a vat code (vatID) on the transaction
		if (vatID) {
			var vatNode = trLineNode.addElement('vat');
			var vatIDNode = vatNode.addElement('vatID').addTextNode(vatID);
			var vatPercNode = vatNode.addElement('vatPerc').addTextNode(vatPerc);
			var vatAmntNode = vatNode.addElement('vatAmnt').addTextNode(Banana.SDecimal.abs(vatAmnt));
			var vatAmntTpNode = vatNode.addElement('vatAmntTp').addTextNode(vatAmntTp);
		}

		// //currency element when not in basic currency
		// var currencyNode = trLineNode.addElement('currency');
		// var curCodeNode = currencyNode.addElement('curCode').addTextNode(curCode);
		// var curAmntNode = currencyNode.addElement('curAmnt').addTextNode(curAmnt);

	}
	
	//return trLine element
	return trLineNode;
}

// NOT USED
function addSubledgers(transactionsNode, banDoc, startDate, endDate) {

	/*
	<subledgers>
		<subledger>
			<sbType>CS</sbType>
			<sbDesc>String</sbDesc>
			<linesCount>1</linesCount>
			<totalDebit>3.14</totalDebit>
			<totalCredit>3.14</totalCredit>
			<sbLine>
				...
			</sbLine>
		</subledger>
	</subledgers>
	*/

	var sbType = '';
	var sbDesc = '';
	var linesCount = '';
	var totalDebit = '';
	var totalCredit = '';

	//Check functions here...


	var subledgersNode = transactionsNode.addElement('subledgers');
	var subledgerNode = subledgersNode.addElement('subledger');

	var sbTypeNode = subledgerNode.addElement('sbType').addTextNode(sbType);
	var sbDescNode = subledgerNode.addElement('sbDesc').addTextNode(sbDesc);
	var linesCountNode = subledgerNode.addElement('linesCount').addTextNode(linesCount);
	var totalDebitNode = subledgerNode.addElement('totalDebit').addTextNode(totalDebit);
	var totalCreditNode = subledgerNode.addElement('totalCredit').addTextNode(totalCredit);


	//Add <sbLine> elements here....
	//createSubledgerLine(tRow, transactionNode, banDoc, startDate, endDate);


	//return subledgers element
	return subledgersNode;
}

// NOT USED
function createSubledgerLine(tRow, transactionNode, banDoc, startDate, endDate) {

	/*
	<sbLine>
		<nr>String</nr>
		<jrnID>String</jrnID>
		<trNr>String</trNr>
		<trLineNr>String</trLineNr>
		<desc>String</desc>
		<amnt>3.14</amnt>
		<amntTp>C</amntTp>
		<docRef>String</docRef>
		<recRef>String</recRef>
		<matchKeyID>String</matchKeyID>
		<custSupID>String</custSupID>
		<invRef>String</invRef>
		<invPurSalTp>P</invPurSalTp>
		<invTp>C</invTp>
		<invDt>1967-08-13</invDt>
		<invDueDt>1967-08-13</invDueDt>
		<mutTp>I</mutTp>
		<costID>String</costID>
		<prodID>String</prodID>
		<projID>String</projID>
		<artGrpID>String</artGrpID>
		<qntityID>String</qntityID>
		<qntity>1</qntity>
		<vat>
			<vatID>String</vatID>
			<vatPerc>0</vatPerc>
			<vatAmnt>3.14</vatAmnt>
			<vatAmntTp>C</vatAmntTp>
		</vat>
		<currency>
			<curCode>AED</curCode>
			<curAmnt>3.14</curAmnt>
		</currency>
	</sbLine>
	*/


	var nr = '';
	var jrnID = '';
	var trNr = '';
	var trLineNr = '';
	var desc = '';
	var amnt = '';
	var amntTp = '';
	var docRef = '';
	var recRef = '';
	var matchKeyID = '';
	var custSupID = '';
	var invRef = '';
	var invPurSalTp = '';
	var invTp = '';
	var invDt = '';
	var invDueDt = '';
	var mutTp = '';
	var costID = '';
	var prodID = '';
	var projID = '';
	var artGrpID = '';
	var qntityID = '';
	var qntity = '';
	var vatID = '';
	var vatPerc = '';
	var vatAmnt = '';
	var vatAmntTp = '';
	var curCode = '';
	var curAmnt = '';

	var sbLineNode = transactionNode.addElement('sbLine');
	var nrNode = sbLineNode.addElement('nr').addTextNode(nr);
	var jrnIDNode = sbLineNode.addElement('jrnID').addTextNode(jrnID);
	var trNrNode = sbLineNode.addElement('trNr').addTextNode(trNr);
	var trLineNrNode = sbLineNode.addElement('trLineNr').addTextNode(trLineNr);
	var descNode = sbLineNode.addElement('desc').addTextNode(desc);
	var amntNode = sbLineNode.addElement('amnt').addTextNode(amnt);
	var amntTpNode = sbLineNode.addElement('amntTp').addTextNode(amntTp);
	var docRefNode = sbLineNode.addElement('docRef').addTextNode(docRef);
	var recRefNode = sbLineNode.addElement('recRef').addTextNode(recRef);
	var matchKeyIDNode = sbLineNode.addElement('matchKeyID').addTextNode(matchKeyID);
	var custSupIDNode = sbLineNode.addElement('custSupID').addTextNode(custSupID);
	var invRefNode = sbLineNode.addElement('invRef').addTextNode(invRef);
	var invPurSalTpNode = sbLineNode.addElement('invPurSalTp').addTextNode(invPurSalTp);
	var invTpNode = sbLineNode.addElement('invTp').addTextNode(invTp);
	var invDtNode = sbLineNode.addElement('invDt').addTextNode(invDt);
	var invDueDt = sbLineNode.addElement('invDueDt').addTextNode(invDueDt);
	var mutTpNode = sbLineNode.addElement('mutTp').addTextNode(mutTp);
	var costIDNode = sbLineNode.addElement('costID').addTextNode(costID);
	var prodIDNode = sbLineNode.addElement('prodID').addTextNode(prodID);
	var projIDNode = sbLineNode.addElement('projID').addTextNode(projID);
	var artGrpIDNode = sbLineNode.addElement('artGrpID').addTextNode(artGrpID);
	var qntityIDNode = sbLineNode.addElement('qntityID').addTextNode(qntityID);
	var qntityNode = sbLineNode.addElement('qntity').addTextNode(qntity);

	var vatNode = sbLineNode.addElement('vat');
	var vatIDNode = vatNode.addElement('vatID').addTextNode(vatID);
	var vatPercNode = vatNode.addElement('vatPerc').addTextNode(vatPerc);
	var vatAmntNode = vatNode.addElement('vatAmnt').addTextNode(vatAmnt);
	var vatAmntTpNode = vatNode.addElement('vatAmntTp').addTextNode(vatAmntTp);

	var currencyNode = sbLineNode.addElement('currency');
	var curCodeNode = currencyNode.addElement('curCode').addTextNode(curCode);
	var curAmntNode = currencyNode.addElement('curAmnt').addTextNode(curAmnt);

	// . . . minOccurs=0 => potrei lasciare via tutto
}


/************************* 
	OTHER functions
*************************/
/* This function allows to check the length of an xml elment value.
   If the value is too long or too short, the script execution is stopped and the xml document is not created. */
function checkStringLength(value, minLength, maxLength) {
   	if (value.length > maxLength) {
	    ERROR_STRING_MAX_LENGTH = true;
	    Banana.document.addMessage('<' + value + '> is too long: maximum allowed characters ' + maxLength);
	}
	if (value.length < minLength) {
		ERROR_STRING_MIN_LENGTH = true;
	    Banana.document.addMessage('<' + value + '> is too short: minimum allowed characters ' + minLength);
	}
}

/* Create the name of the xml file using startDate and endDate (ex. "auditfile_nl_20180101_20180131.xml") */
function createFileName(startDate, endDate) {
    
    var fileName = "auditfile_nl_";
    var currentDateString = "";
    var sDate = "";
    var yearStartDate = "";
    var monthStartDate = "";
    var dayStartDate = "";
    var eDate = "";
    var yearEndDate = "";
    var monthEndDate = "";
    var dayEndDate = "";

    //Start date string
    sDate = Banana.Converter.toDate(startDate.match(/\d/g).join(""));
    yearStartDate = sDate.getFullYear().toString();
    monthStartDate = (sDate.getMonth()+1).toString();
    if (monthStartDate.length < 2) {
        monthStartDate = "0"+monthStartDate;
    }
    dayStartDate = sDate.getDate().toString();
    if (dayStartDate.length < 2) {
        dayStartDate = "0"+dayStartDate;
    }

    //End date string
    eDate = Banana.Converter.toDate(endDate.match(/\d/g).join(""));
    yearEndDate = eDate.getFullYear().toString();
    monthEndDate = (eDate.getMonth()+1).toString();
    if (monthEndDate.length < 2) {
        monthEndDate = "0"+monthEndDate;
    }
    dayEndDate = eDate.getDate().toString();
    if (dayEndDate.length < 2) {
        dayEndDate = "0"+dayEndDate;
    }

    //Final date string
    currentDateString = yearStartDate+monthStartDate+dayStartDate+"_"+yearEndDate+monthEndDate+dayEndDate; 
    
    //Return the xml file name
    fileName += currentDateString;
    return fileName;
}

/* Save the xml file */
function saveData(output, startDate, endDate) {

    var fileName = createFileName(startDate, endDate);
    fileName = Banana.IO.getSaveFileName("Save as", fileName, "XML file (*.xml);;All files (*)");

    if (fileName.length) {
        var file = Banana.IO.getLocalFile(fileName);
        file.codecName = "UTF-8";
        file.write(output);
        if (file.errorString) {
            Banana.Ui.showInformation("Write error", file.errorString);
        }
        else {
        	var answer = Banana.Ui.showQuestion("XML Auditfile NL", "Het gegenereerde xml bestand bekijken?");
        	if (answer) {
        		Banana.IO.openUrl(fileName);
        	}
        }
    }
}

/* Get previously saved settings */
function getScriptSettings() {
   var data = Banana.document.getScriptSettings();
   //Check if there are previously saved settings and read them
   if (data.length > 0) {
       try {
           var readSettings = JSON.parse(data);
           //We check if "readSettings" is not null, then we fill the formeters with the values just read
           if (readSettings) {
               return readSettings;
           }
       } catch (e) {
       }
   }

   return {
      "selectionStartDate": "",
      "selectionEndDate": "",
      "selectionChecked": "false"
   }
}

/* The main purpose of this function is to allow the user to enter the accounting period desired and saving it for the next time the script is run
   Every time the user runs of the script he has the possibility to change the date of the accounting period */
function settingsDialog() {
    
    //The formeters of the period that we need
    var scriptform = getScriptSettings();
    
    //We take the accounting "starting date" and "ending date" from the document. These will be used as default dates
    var docStartDate = Banana.document.startPeriod();
    var docEndDate = Banana.document.endPeriod();   
    
    //A dialog window is opened asking the user to insert the desired period. By default is the accounting period
    var selectedDates = Banana.Ui.getPeriod("Periode voor de Auditfile", docStartDate, docEndDate, 
        scriptform.selectionStartDate, scriptform.selectionEndDate, scriptform.selectionChecked);
        
    //We take the values entered by the user and save them as "new default" values.
    //This because the next time the script will be executed, the dialog window will contains the new values.
    if (selectedDates) {
        scriptform["selectionStartDate"] = selectedDates.startDate;
        scriptform["selectionEndDate"] = selectedDates.endDate;
        scriptform["selectionChecked"] = selectedDates.hasSelection;

        //Save script settings
        var formToString = JSON.stringify(scriptform);
        var value = Banana.document.setScriptSettings(formToString);       
    } else {
        //User clicked cancel
        return null;
    }
    return scriptform;
}

