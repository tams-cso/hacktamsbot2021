const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const config = require('../config.json');
const data = require('./data.json');
const verifyUser = require('./verification');

const SERVER_ID = '750894174966120558'; // hackTAMS server ID
const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } });
const mentors = getMentors();

var tokens = {}; // Object to hold auth tokens

client.once('ready', () => {
    // Log the bot login
    console.log(`hackBot Online as ${client.user.tag}!`);
    eventReminder();
    cron.schedule('* * * * *', eventReminder);
});

client.on('message', (message) => {
    // Return if bot message
    if (message.author.bot) return;

    // If the message is a dm
    if (message.channel.type === 'dm') {
        verificationDm(message);
        return;
    }

    // Return if no prefix
    if (!message.content.startsWith(data.prefix)) return;

    // If the message is a command (so everything else)
    command(message);
});

client.on('guildMemberAdd', (member) => {
    // Send out a verification message asking the user for their email when they join
    member.user.send(data.verifyMessage);
});

// Login with bot token
client.login(config.token);

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

    // If the user typed a verification dm (first last email)
    if (args.length === 3) {
        if (!isMentor(message, args)) verifyUser(message, args, tokens);
        return;
    }

    // If the user typed a auth token (len = 6)
    if (args.length === 1 && args[0].length === 6) {
        authTokenCheck(message, args);
        return;
    }

    // They sent something else lmao
    message.author.send(data.verifyMessage);
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
 * If the token valid, give them a role or
 * else send them 'token invalid' message
 *
 * @param {Discord.Message} message The Discord Message object
 * @param {string[]} args Message argument list
 */
function authTokenCheck(message, args) {
    if (Object.keys(tokens).indexOf(args[0]) !== -1) {
        // Add role
        var guild = client.guilds.cache;
        var member = guild.get(SERVER_ID).members.cache.get(tokens[args[0]]);
        member.roles.add(data.roles.hacker);

        // Delete auth key
        delete tokens[args[0]];

        // Send message to the user and log their join
        message.author.send('Welcome to the hackTAMS server!');
        console.log('Verified: ' + message.author.username);
        return;
    }
    // Invalid code message
    message.author.send('Verification Code Invalid');
}

/**
 * Runs a command, deleting the message sent
 *
 * @param {Discord.Message} message The Discord Message object
 */
function command(message) {
    // Split arguments and command out
    const args = message.content.toLowerCase().slice(data.prefix.length).split(/\s+/);
    const command = args.shift();

    // Delete the original message
    message.delete();

    // Generate a test join message
    if (command === 'msggen') generateTestMessage(message, args);
}

/**
 * Command to generate a test message
 *
 * @param {Discord.Message} message The Discord Message object
 * @param {string[]} args Message argument list
 */
function generateTestMessage(message, args) {
    if (args[0] === 'verification') {
        message.channel.send(data.joinMessage);
    }
}

/**
 * Gets a list of mentors from file
 *
 * @returns {string[][]} the list of mentor arrays [first, last, email]
 */
function getMentors() {
    var tempMentors = [];
    fs.readFile(path.join(__dirname, '..', 'mentors.txt'), 'utf8', function (error, data) {
        const lines = data.toLowerCase().split('\n');
        lines.forEach((item) => {
            tempMentors.push(item.split(' '));
        });
    });
    return tempMentors;
}

/**
 * Sends an event reminder if the next event starts within 45 mins
 * Also starts a timer so it can send a reminder 15 mins before
 */
async function eventReminder() {
    // Get current time and parse first event time
    const now = new Date();
    const eventDate = new Date(data.events[0].date);

    // Check if the difference is less than 45 mins (2,700,000 milliseconds)
    const diff = eventDate.getTime() - now.getTime();
    if (diff < 2700000) {
        // Send embed message
        await sendEventMessage(data.events[0]);

        // Set interval to send reminder message 10 mins before (35 mins = 2,100,000 ms)
        var tempEvent = data.events[0];
        setTimeout(() => {
            eventPing(tempEvent);
        }, 2100000);

        // Delete the event from list
        data.events.shift();
    }
}

/**
 *
 * @param {Event} event The event object
 */
async function sendEventMessage(event) {
    // Get the time in UTC-6 time
    var d = (new Date(Number((new Date(event.date)).getTime() - 21600000))); // UTC-6 [not good lmao]
    var timeString = `${d.getMonth() + 1}/${d.getDate()} @ ${d.getHours()}:${d.getMinutes()}`;

    // Create and send embed, then react to it with quack
    const embed = new Discord.MessageEmbed()
        .setColor('#49e7fc')
        .setTitle(event.name)
        .addField('Time', timeString)
        .addField('Location', event.location)
        .setThumbnail('https://api.michaelzhao.xyz/images/hacktams.png');
    const sentMessage = await client.channels.cache.get(data.special.eventsChannel).send(embed);
    sentMessage.react(client.guilds.cache.get(SERVER_ID).emojis.cache.get(data.special.duckEmoji));
    
    console.log(`Sent reminder for Event: ${event.name}`)
}

/**
 *
 * @param {Event} event The event object
 */
function eventPing(event) {
    var ping = '@here';
    if (event.pingAll) ping = '@everyone';

    client.channels.cache
        .get(data.special.eventsChannel)
        .send(`${ping} **${event.name}** starting in *10 minutes* at ${event.location}`);

    console.log(`Sent ping for Event: ${event.name}`)
}

/**
 * @typedef Event
 * @property {string} name Name of the event
 * @property {string} date ISO datetime string
 * @property {string} location Link or location of event
 * @property {boolean} pingAll Should we ping everyone or just here
 */
