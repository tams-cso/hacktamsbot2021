const Discord = require('discord.js');
const config = require('../config.json');
const data = require('./data.json');

const SERVER_ID = '750894174966120558'; // hackTAMS server ID

const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } });

var tokens = new Map();

// TODO: Add the generate events function

const fs = require('fs');
client.directMessage = new Discord.Collection();
const dmFiles = fs.readdirSync('./directMessage/').filter((file) => file.endsWith('.js'));
for (const file of dmFiles) {
    const dm = require(`./directMessage/${file}`);
    client.directMessage.set(dm.name, dm);
}
var mentors = [];
fs.readFile('../mentors.txt', 'utf8', function (error, data) {
    const lines = data.toLowerCase().split('\n');
    lines.forEach(function (item) {
        mentors.push(item.split(/\s+/));
    });
    // console.log(mentors);
});

client.once('ready', () => {
    console.log('hackBot Online!');
});

client.on('message', (message) => {
    if (message.channel.type == 'dm' && !message.author.bot) {
        if (!message.content.startsWith(data.prefix)) {
            const args = message.content.toLowerCase().split(/\s+/);
            if (args.length == 3 && args[2].match(/.+@.+\..+/) != -1) {
                var done = false;
                mentors.forEach(function (item) {
                    // console.log(item);
                    // console.log(args);
                    if (item[0] == args[0] && item[1] == args[1] && item[2] == args[2]) {
                        client.guilds.cache
                            .get(SERVER_ID)
                            .members.cache.get(message.author.id)
                            .roles.add(data.roles.mentor);
                        done = true;
                        console.log('Mentor verified: ' + args[0] + ' ' + args[1] + ' ' + args[2]);
                        message.author.send('Welcome to the hackTAMS server');
                    }
                });
                if (!done) client.directMessage.get('verify').execute(message, args, tokens);
            } else if (args.length == 1 && args[0].length == 6) {
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
        }
        return;
    }

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
 * Command to generate a join message
 * @param {Discord.Message} message the Discord Message object
 * @param {string[]} args argument list
 */
function generateMessage(message, args) {
    if (args[0] == 'verification') {
        message.channel.send(data.joinMessage);
    }
}