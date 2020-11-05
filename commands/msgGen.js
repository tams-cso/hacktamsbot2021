module.exports = {
    name: 'msggen',
    description: 'generate messages',
    execute(message, args) {
        if (args[0] == 'verification') {
            var msg = 'Welcome to hackTAMS! This server will be the main source of communication and information.\n' + 
                    'First you must verify invitation. You should have received a DM from Hacker Duck. ' +
                    'Follow his instructions to get verified. Remember to use the name and email you used to register for hackTAMS.\n' +
                    'Not registered? No worries, can register here: https://hacktams.org/register\n\n' + 
                    'If you have any issues or questions regarding verification, please DM <@611762884464082945>';
            console.log(msg);
            message.channel.send(msg);
        }
    }
}