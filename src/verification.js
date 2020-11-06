const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const Discord = require('discord.js');
const keys = require('../config.json');

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

process.env.GOOGLE_APPLICATION_CREDENTIALS = '../config.json';

const jwt = new google.auth.JWT(keys.client_email, null, keys.private_key, SCOPES);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'notifications@hacktams.org',
        pass: keys.epass,
    },
});

/**
 * Verifies a user by reading from the registration spreadsheet
 * then sending them an email
 * 
 * @param {Discord.Message} message The Discord Message object
 * @param {string[]} args Message arguments
 * @param {object} tokens List of user auth tokens 
 */
module.exports = (message, args, tokens) => {
    jwt.authorize((err, res) => {
        const request = {
            spreadsheetId: '12GnU9CE3EftyUs8Uz_AQCWXGF09FKI-lwqh7YD3EDWc',
            ranges: ['A2:A', 'B2:B', 'C2:C', 'T2:T'],
            includeGridData: true,
            auth: jwt,
        };

        google
            .sheets('v4')
            .spreadsheets.get(request)
            .then((data) => {
                const cols = data.data.sheets[0].data;
                for (var i = 0; i < cols[2].rowData.length; i++)
                    if (
                        cols[2].rowData[i].values[0].formattedValue.toLowerCase() ==
                        args[2].toLowerCase()
                    ) {
                        if (
                            cols[0].rowData[i].values[0].formattedValue.toLowerCase() ==
                                args[0].toLowerCase() &&
                            cols[1].rowData[i].values[0].formattedValue.toLowerCase() ==
                                args[1].toLowerCase()
                        ) {
                            const temp = cols[3].rowData[i].values[0].formattedValue;
                            const verCode = temp.substring(temp.length - 6);
                            tokens.set(verCode, message.author.id);
                            // console.log(temp.substring(temp.length-6));
                            // console.log(message.author.id);
                            //send eamil
                            const mes =
                                'Verification code for ' +
                                message.author.username +
                                ': ' +
                                verCode +
                                '\nDM Hacker Duck with your verification code to gain access to the hackTAMS server.\n\nIf this was not you, please contact dylanli@hacktams.org';
                            const mailOptions = {
                                // from: 'jamestheduck@hacktams.org',
                                from: 'notifications@hacktams.org',
                                to: args[2],
                                subject: 'hackTAMS Discord Verification',
                                text: mes,
                                replyTo: 'dylanli@hacktams.org',
                                // html: 'Embedded image: <img src="cid:somethingthatisunique"/>',
                                // attachments: [{
                                //     path: './directMessage/banner.png',
                                //     cid: 'somethingthatisunique'
                                // }]
                            };
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) console.log(error);
                                else
                                    console.log(
                                        'Mail sent to ' +
                                            args[2] +
                                            ' User: ' +
                                            message.author.username +
                                            ' Code: ' +
                                            verCode
                                    );
                            });
                            message.author.send('Please check your email for a verification code');
                        } else
                            message.author.send(
                                'Incorrect name or email: Please verify you have entered the correct name and email'
                            );
                        break;
                    }
                if (i == cols[2].rowData.length)
                    message.author.send(
                        'Registration not found: Please verify you have entered the correct name and email in the following format\nFirstName LastName Email\nEx: `Hacker Duck hackerduck@hacktams.org`'
                    );
            });
    });
};
