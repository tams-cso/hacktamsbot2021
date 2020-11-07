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

// Counters for event and reminder lists
var eventCount = 2; // hacky fix for production errors IRGHIUERWHGBIUREWHGURWEHG - MUST CHANGE AFTER RESTART DURING EVENT
var reminderCount = 0;
var toPingList = [];

var tokens = {}; // Object to hold auth tokens

client.once('ready', () => {
    // Log the bot in
    console.log(`hackBot Online as ${client.user.tag}!`);
    
    // Start the cron task for every minute
    createReactionRole();
    cron.schedule('* * * * *', eventReminder);
    cron.schedule('* * * * *', reminderMessages);
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

async function createReactionRole() {
    // Get the events channel
    const eventsChannel = client.channels.cache.get(data.special.eventsChannel);

    // Don't add this if there are messages in the events channel
    const oldMessages = await eventsChannel.messages.fetch({ limit: 100 });
    const reactMessage = oldMessages.find(m => m.content.indexOf('React to this message') !== -1);
    reactMessage.react(client.guilds.cache.get(SERVER_ID).emojis.cache.get(data.special.duckEmoji));
    
    // Create a message collector and add roles to users whenever someone reacts
    const collector = reactMessage.createReactionCollector(() => {return true;});
    collector.on('collect', (r) => {
        r.users.cache.forEach((user) => {
            const guild = client.guilds.cache.get(SERVER_ID);
            guild.members.cache.get(user.id).roles.add(data.special.workshopRole);
        });
    });
}

/**
 * Sends an event reminder if the next event starts within 45 mins
 * Also starts a timer so it can send a reminder 15 mins before
 */
async function eventReminder() {
    // Get current time and parse first event time
    const now = new Date();
    const eventDate = new Date(data.events[eventCount].date);

    // Check if the difference is less than 45 mins (2,700,000 milliseconds)
    const diff = eventDate.getTime() - now.getTime();
    if (diff < 2700000) {
        // Send embed message
        await sendEventMessage(data.events[eventCount]);

        // Add event to ping list
        toPingList.push(eventCount);
        
        eventCount++;
    }

    if (toPingList.length === 0) return;
    // Check for ping events
    const pingDate = new Date(data.events[toPingList[0]].date);

    const diff2 = pingDate.getTime() - now.getTime();
    if (diff2 < 600000) {
        // Send ping
        await eventPing(data.events[toPingList[0]]);
        toPingList.shift();
    }
}

/**
 * Sends an embed message with the event in it
 * 
 * @param {Event} event The event object
 */
async function sendEventMessage(event) {
    // Get the time in UTC-6 time
    var d = (new Date(Number((new Date(event.date)).getTime() - 21600000))); // UTC-6 [not good lmao]
    var timeString = `11/${d.getDate()}/20 @ ${pad(d.getHours().toString())}:${pad(d.getMinutes().toString())} CST (UTC-6:00)`;

    // Create and send embed, then react to it with quack
    const embed = new Discord.MessageEmbed()
        .setColor('#65cdf1')
        .setTitle(event.name)
        .addField('Time', timeString)
        .addField('Location', event.location)
        .setThumbnail('https://api.michaelzhao.xyz/images/hacktams.png');
    client.channels.cache.get(data.special.eventsChannel).send(embed);
    
    console.log(`Sent reminder for Event: ${event.name}`)
}

/**
 * Pings here or everyone that the event starts in 10 minutes
 * 
 * @param {Event} event The event object
 */
async function eventPing(event) {
    var ping = `<@&${data.special.workshopRole}>`;
    if (event.pingAll) ping = '@everyone';

    // Prevent auto-embed if it's a link
    var locationString = event.location.startsWith('https:') ? `<${event.location}>` : event.location;

    await client.channels.cache
        .get(data.special.eventsChannel)
        .send(`${ping} **${event.name}** starting in *10 minutes* at ${locationString}`);

    console.log(`Sent ping for Event: ${event.name}`)
}

/**
 * Send announcements reminding people of deadlines
 */
function reminderMessages() {
    // Calculate reminder time
    const now = new Date();
    const rawTime = data.reminders[0].time.split(':');
    const milliDiff = Number(rawTime[0]) * 3600000 + Number(rawTime[1]) * 60000;
    const submissionTime = new Date('2020-11-08T21:00:00Z');
    const diff = submissionTime - milliDiff;
    
    if (now.getTime() > diff) {
        // Send message and remove from list
        client.channels.cache.get(data.special.infoChannel).send(`@everyone ${data.reminders[reminderCount].msg}`);
        reminderCount++;
    }
}

function pad(str) {
	if (str.length === 1) return '0' + str;
	return str;
}

/**
 * @typedef Event
 * @property {string} name Name of the event
 * @property {string} date ISO datetime string
 * @property {string} location Link or location of event
 * @property {boolean} pingAll Should we ping everyone or just here
 */
