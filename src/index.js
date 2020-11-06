const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const data = require('./data.json');
const verifyUser = require('./verification');

const SERVER_ID = '750894174966120558'; // hackTAMS server ID
const mentors = getMentors();
const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } });

var tokens = new Map(); // TODO: Change to js object

// TODO: Add the generate events function

client.once('ready', () => {
    console.log(`hackBot Online as ${client.user.tag}!`);
});

client.on('message', (message) => {
    // Return if bot message
    if (message.author.bot) return;

    // Check if the message is a dm
    if (message.channel.type == 'dm') verificationDm(message);

    if (!message.content.startsWith(data.prefix) || message.author.bot) return;
    const args = message.content.slice(data.prefix.length).split(/\s+/);
    const command = args.shift();
    message.delete();

    switch (command) {
        // TODO: Add 'help' command to list out all commands
        case 'msggen':
            generateMessage(message, args);
            break;
        case 'hello':
            message.channel.send('Hello there!');
            break;
        case 'addTesting':
            message.member.roles.add(data.roles.verification);
            message.channel.send('`testing` role added');
            break;
        case 'removeTesting':
            message.member.roles.remove(data.roles.verification);
            message.channel.send('`testing` role removed');
            break;
        case 'clear':
            break;
        case 'sendtext':
            message.author.send('test message sent from bot');
            break;
    }
});

// Send out a verification message asking the user for their email when they join
client.on('guildMemberAdd', (member) => {
    member.user.send(data.verifyMessage);
});

// Login with bot token
client.login(config.token);

/**
 * Gets a list of mentors
 * @returns {string[][]} the list of mentor arrays [first, last, email]
 */
function getMentors() {
    var tempMentors = [];
    fs.readFile(path.join(__dirname, '..', 'mentors.txt'), 'utf8', function (error, data) {
        const lines = data.toLowerCase().split('\n');
        console.log(lines);
        lines.forEach((item) => {
            tempMentors.push(item.split(' '));
        });
    });
    return tempMentors;
}

/**
 * If the bot is sent a verification dm, check if it was a
 * (first last email) tuple or a verification code and verify
 * the user, adding a role when they're verified.
 * 
 * @param {Discord.Message} message The Discord Message object
 */
function verificationDm(message) {
    // Split arguments out
    const args = message.content.toLowerCase().split(/\s+/);

    // Check if the user typed a verification dm (first last email)
    if (args.length == 3) {
        if (isMentor(message, args)) verifyUser(message, args, tokens);
        return;
    }
    
    // Check if the user typed a auth token (len = 6)
    if (args.length == 1 && args[0].length == 6) {
        if (tokens.has(args[0])) {
            client.guilds.cache
                .get(SERVER_ID)
                .members.cache.get(tokens.get(args[0]))
                .roles.add(data.roles.hacker);
            message.author.send('Welcome to the hackTAMS server');
            console.log('Verified: ' + message.author.username);
        } else message.author.send('Verification Code Invalid');
    } else
        message.author.send(
            'To verify your server invitation, please enter \nyour first and last name and email used to register for hackTAMS.\nEx: `Hacker Duck hackerduck@hacktams.org`'
        );
    return;
}

/**
 * Checks to see if the user is a mentor.
 * If true, it sends a message to the mentor that they're verified
 * and adds the mentor role to them.
 *
 * @param {Discord.Message} message The Discord Message object
 * @param {string[]} args Message argument list
 * @returns {boolean} If the argument list matches a mentor's
 */
function isMentor(message, args) {
    // Iterate through the list of mentors
    mentors.forEach((item) => {
        // Check to see if each argument is the same as the mentor list item
        if (JSON.stringify(item) === JSON.stringify(args)) {
            var guild = client.guilds.cache.get(SERVER_ID);
            var member = guild.members.cache.get(message.author.id);
            member.roles.add(data.roles.mentor);
            console.log('Mentor verified: ' + args[0] + ' ' + args[1] + ' ' + args[2]);
            message.author.send('Welcome to the hackTAMS server');
            return true;
        }
    });
    return false;
}

/**
 * Command to generate a join message
 * @param {Discord.Message} message The Discord Message object
 * @param {string[]} args Message argument list
 */
function generateMessage(message, args) {
    if (args[0] == 'verification') {
        message.channel.send(data.joinMessage);
    }
}
