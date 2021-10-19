const { google, GoogleApis } = require("googleapis");
const nodemailer = require("nodemailer");
const Discord = require("discord.js");
const keys = require("../config.json");
const data = require("./data.json");

const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

process.env.GOOGLE_APPLICATION_CREDENTIALS = "../config.json";

const jwt = new google.auth.JWT(
	keys.client_email,
	null,
	keys.private_key,
	SCOPES
);
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "notifications@hacktams.org",
		pass: keys.epass,
	},
});

/**
 * Verifies a user by reading from the registration spreadsheet
 * then sending them an email
 *
 * @param {Discord.Message} message The Discord Message object
 * @param {string[]} args Message arguments
 * @param {{}} tokens List of user auth tokens
 */
module.exports = (message, args, tokens) => {
	jwt.authorize(async (err, res) => {
		// Build request object
		const request = {
			spreadsheetId: "1XZ652mqsgv6lIjW7S8xi0NJ1qwm1Mdn-d4G7RP-pWjA",
			ranges: ["A2:A", "B2:B", "C2:C", "T2:T"],
			includeGridData: true,
			auth: jwt,
		};

		// Request spreadsheet data
		const sheetData = await google.sheets("v4").spreadsheets.get(request);

		// Extract columns from response
		const cols = sheetData.data.sheets[0].data;

		// Iterate through the rows and process auth tokens
		for (var i = 0; i < cols[2].rowData.length; i++) {
			// Continue if invalid first name, last name, or email
			if (
				getCellValue(cols, i, 0).toLowerCase() !== args[0].toLowerCase() ||
				getCellValue(cols, i, 1).toLowerCase() !== args[1].toLowerCase() ||
				getCellValue(cols, i, 2).toLowerCase() !== args[2].toLowerCase()
			) {
				continue;
			}

			// Extract last 6-characters as auth string
			const temp = getCellValue(cols, i, 3);
			const verCode = temp.substring(temp.length - 6);

			// Store that auth code
			tokens[verCode] = message.author.id;

			// Send the email!
			const mailOptions = {
				from: "notifications@hacktams.org",
				to: args[2],
				subject: "hackTAMS Discord Verification",
				text: `Verification code for ${message.author.username}: ${verCode}`,
				replyTo: "dylanli@hacktams.org",
			};
			transporter.sendMail(mailOptions, function (error) {
				if (error) console.log(error);
				else {
					console.log(`Mail sent to ${args[2]}`);
					console.log(`  | User: ${message.author.username}`);
					console.log(`  | Code: ${verCode}`);
				}
			});

			// Tell the user to check their email
			message.author.send("Please check your email for a verification code");
			break;
		}

		// Check if not found and send message
		if (i === cols[2].rowData.length) message.author.send(data.regNotFound);
	});
};

/**
 * Returns the cell value given row and column of a sheets column object
 * @param {object} cols The Google API column object
 * @param {number} row Row number
 * @param {number} col Column number
 * @returns {string} The cell value, as a string
 */
const getCellValue = (cols, row, col) =>
	cols[col].rowData[row].values[0].formattedValue;
