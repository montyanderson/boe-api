import { DOMParser, Element } from "deno_dom";

const getDocument = async (currencyCode: string) => {
	const query = {
		FromSeries: "1",
		ToSeries: "50",
		DAT: "RNG",
		FD: "1",
		FM: "Jan",
		FY: "1963",
		TD: "8",
		TM: "Oct",
		TY: "2022",
		FNY: "",
		CSVF: "TT",
		"html.x": "19",
		"html.y": "50",
		C: currencyCode,
		Filter: "N",
	};

	const url =
		`https://www.bankofengland.co.uk/boeapps/database/fromshowcolumns.asp?${new URLSearchParams(
			query,
		)}`;

	const response = await fetch(url);
	const html = await response.text();

	const document = new DOMParser().parseFromString(html, "text/html");

	if (document === null) {
		throw new Error("Failed to load document");
	}

	return document;
};

const parseTable = (table: Element): string[][] =>
	([...table.querySelectorAll("tbody tr")] as Element[])
		.map((el) =>
			([...el.querySelectorAll("td")] as Element[]).map((el) =>
				el.innerText.trim()
			)
		);

type DatePrice = {
	date: string;
	price: string;
};

const createDatePriceList = (rows: string[][]) =>
	rows.map(([date, price]) => {
		if (date === undefined || price === undefined) {
			throw new Error("date or price undefined");
		}

		return { date, price };
	});

const createPrettyJson = (data: any) => JSON.stringify(data, null, "\t");

const currencies = {
	"aud": "EC3",
	"cad": "ECL",
	"cny": "INB",
};

for (const file in currencies) {
	const boeCode = (currencies as any)[file];

	const document = await getDocument(boeCode);
	const table = document.querySelector("#stats-table");

	if (table === null) {
		throw new Error("Could not find table!");
	}

	const output = createPrettyJson(createDatePriceList(parseTable(table)));

	await Deno.writeTextFile(`./dist/currency/${file}.json`, output);
}
