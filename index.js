const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } });
const prefix = '!';
const roles = {
    team: '750894547462127686',
    hacker: '763118079918997504',
    mentor: '763118116779458590'
};
const channels = {
    events: '771118672366141530'
};
const events = {
    1: ['Opening Ceremony','Friday','11-06','18:00','<https://hacktams.org/twitch>'],
    2: ['Team Formations','Friday','11-06','18:45','event-room Voice Channel on Discord'],
    3: ['Basics to Hackathons','Friday','11-06','21:00','<https://hacktams.org/zoom>'],
    4: ['Intro to Git + Build a Portfolio Website Workshop','Friday','11-06','21:15','<https://hacktams.org/zoom>'],
    5: ['Game Night with Hackers','Friday','11-06','22:30','event-room Voice Channel on Discord'],
    6: ['Tools & Techniques for Machine Learning Workshop','Saturday','11-07','9:00','<https://hacktams.org/zoom>'],
    7: ['Stunning by Design - UI/UX Workshop','Saturday','11-07','10:00','<https://hacktams.org/zoom>'],
    8: ['Build a Clean Web App in Minutes with React - React.JS Workshop','Saturday','11-07','11:30','<https://hacktams.org/zoom>'],
    9: ['Going Deep into Deep Learning - PyTorch Workshop','Saturday','11-07','13:00','<https://hacktams.org/zoom>'],
    10: ['How to Build a Cloud-Connected AR/VR App in 15 Minutes or Less - echoAR Workshop','Saturday','11-07','14:00','<https://meet.google.com/dez-aohx-sin>'],
    11: ['Q&A with Brian Truong: Founder of 2 VC-backed startups','Saturday','11-07','15:30','<https://hacktams.org/zoom>'],
    12: ['Panel of UTD’s Society of Women Engineers Officers','Saturday','11-07','17:00','<https://hacktams.org/zoom>'],
    13: ['Graphics with OpenGL Workshop','Saturday','11-07','18:00','<https://hacktams.org/zoom>'],
    14: ['Game Night with Hackers','Saturday','11-07','20:00','event-room Voice Channel on Discord'],
    15: ['MS Painting with Bob Ross','Saturday','11-07','23:00','event-room Voice Channel on Discord'],
    16: ['Project Submission 101 Workshop','Sunday','11-08','12:00','<https://hacktams.org/zoom>'],
    17: ['Live Demos','Sunday','11-08','15:00','<https://hacktams.org/twitch>'],
    18: ['Closing Ceremony','Sunday','11-08','18:00','<https://hacktams.org/twitch>']
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
var mentors = [];
fs.readFile('./directMessage/mentors.txt', 'utf8', function(error, data) {
    const lines = data.toLowerCase().split('\n');
    lines.forEach(function(item) {
        mentors.push(item.split(/\s+/));
    });
    // console.log(mentors);
});


client.once('ready', () => {
    console.log('hackBot Online!');
});

client.on('message', message => {
    if (message.channel.type == 'dm' && !message.author.bot) {
        if (!message.content.startsWith(prefix)) {
            const args = message.content.toLowerCase().split(/\s+/);
            if (args.length == 3 && args[2].match(/.+@.+\..+/) != -1) {
                var done = false;
                mentors.forEach(function(item) {
                    // console.log(item);
                    // console.log(args);
                    if (item[0] == args[0] && item[1] == args[1] && item[2] == args[2]) {
                        client.guilds.cache.get(servers.hackTAMS).members.cache.get(message.author.id).roles.add(roles.mentor);
                        done = true;
                        console.log('Mentor verified: ' + args[0] + ' ' + args[1] + ' ' + args[2]);
                        message.author.send("Welcome to the hackTAMS server");
                    }
                });
                if (!done)
                    client.directMessage.get('verify').execute(message, args, tokens);
            }
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

    // test/debug commands
    if (message.content.startsWith('---')) {
        const args = message.content.slice(3).split(/\s+/)
        const command = args.shift();
        message.delete();

        switch (command) {
            // case 'command': //give list of commands
            //     message.channel.send();
            //     break;
            case 'msggen':
                client.commands.get('msggen').execute(message, args);
                break;
            case 'evtgen':
                for (var i = 1; i < 19; i++) {
                    let item = events[i];
                    message.channel.send(`${item[0]}\n${item[1]} ${item[2]} ${item[3]}\nLocation: ${item[4]}`).then(message.react(':thumbsup:'));
                }
                // events.forEach(function(item) {
                //     message.channel.send(`${item[0]}\n${item[1]} ${item[2]} ${item[3]}\nLocation: ${item[4]}`).then(message.react(':thumbsup:'));
                // });
                break;
        }
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
        case 'msggen':
            client.commands.get('msggen').execute(message, args);
            break;
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
