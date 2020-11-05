module.exports = {
    name: 'ping',
    description: 'this is the ping command!',
    execute(message, args, roles) {

        if (message.member.roles.cache.has(roles.team))
            message.channel.send('pong!');
        else
            message.channel.send('You cannot use this command because you do not have the right permissions')
    }
}