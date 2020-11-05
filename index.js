const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } });
const prefix = '!';
const roles = {
    team: '750894547462127686',
    hacker: '763118079918997504'
};
const servers = {
    testing: '754426418208964610',
    hackTAMS: '750894174966120558'
};
var tokens = new Map();

const fs = require('fs');
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
client.directMessage = new Discord.Collection();
const dmFiles = fs.readdirSync('./directMessage/').filter(file => file.endsWith('.js'));
for (const file of dmFiles) {
    const dm = require(`./directMessage/${file}`);
    client.directMessage.set(dm.name, dm);
}


client.once('ready', () => {
    console.log('hackBot Online!');
});

client.on('message', message => {
    if (message.channel.type == 'dm' && !message.author.bot) {
        if (!message.content.startsWith(prefix)) {
            const args = message.content.split(/\s+/);
            if (args.length == 3 && args[2].match(/.+@.+\..+/) != -1)
                client.directMessage.get('verify').execute(message, args, tokens);
            else if (args.length == 1 && args[0].length == 6) {
                if (tokens.has(args[0])) {
                    client.guilds.cache.get(servers.hackTAMS).members.cache.get(tokens.get(args[0])).roles.add(roles.hacker);
                    message.author.send("Welcome to the hackTAMS server");
                    console.log('Verified: ' + message.author.username);
                }
                else
                    message.author.send("Verification Code Invalid");
            }
            else
                message.author.send('To verify your server invitation, please enter \nyour first and last name and email used to register for hackTAMS.\nEx: `Hacker Duck hackerduck@hacktams.org`');
        }
        // else {
        //     const args = message.content.slice(prefix.length).split(/\s+/)
        //     const command = args.shift();
            
        //     switch (command) {
        //         case 'verify':
        //             if (args.length == 1)
        //                 client.directMessage.get('verify')
        //                 .assignRole(message, args[0], roles, tokens, client.guilds.cache.get(servers.hackTAMS));
        //             break;
        //     }
        // }
        return;
    }


    if (!message.content.startsWith(prefix) || message.author.bot)
        return;
    const args = message.content.slice(prefix.length).split(/\s+/)
    const command = args.shift();
    message.delete();

    switch (command) {
        // case 'command': //give list of commands
        //     message.channel.send();
        //     break;
        case 'ping':
            message.channel.send('pong!');
            client.commands.get('ping').execute(message, args, roles);
            break;
        case 'hello':
            message.channel.send('Hello there!');
            break;
        case 'addTesting':
            message.member.roles.add(roles.verification);
            message.channel.send('`testing` role added');
            break;
        case 'removeTesting':
            message.member.roles.remove(roles.verification);
            message.channel.send('`testing` role removed');
            break;
        case 'clear':
            break;
        case 'sendtext':
            message.author.send('test message sent from bot');
            break;
    }
    
});

client.on('guildMemberAdd', member => {
    //send confirm message
    member.user.send('To verify your server invitation, please enter \nyour first and last name and email used to register for hackTAMS.\nEx: `Hacker Duck hackerduck@hacktams.org`');

});



client.login(config.token);
