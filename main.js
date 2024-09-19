const { Client, GatewayIntentBits, PermissionsBitField, Permissions } = require(`discord.js`);
const { spawn } = require('child_process');
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const User = require('./User');

const mongoose = require('mongoose');

const uri = 'mongodb+srv://dbUser:iloveasu2003@cluster0.muyjq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connect() {
    try {
        await mongoose.connect(uri)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Failed to connect to MongoDB")
    }
}

connect();

const prefix = '!';
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const {addClass, removeClass, showClasses} = require('./index')

const cron = require('node-cron');
cron.schedule('*/90 * * * * *', () => {
    checkClassAvailability(client).catch(err => console.error(err));
});


client.on("ready", () => {
    console.log("FightBot is online!");
})

//If there are errors, comment out this client on or the other one
client.on("messageCreate", (message) => {
    if(message.author.bot) return;

    if(message.content.toLowerCase().includes("test"))
        message.channel.send("It is working");
});


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;  // Ignore messages from bots

    if (message.content == "!Options") {
        const userId = message.author.id;
        const username = message.author.username;
        message.channel.send("ASU Class Tracking Bot Options:\n1. Add a class\n2. Remove a class\n3. See currently tracked classes\n4. Check if a class is open")
        const filter = response => response.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });
        collector.on('collect', async (response) => {
            const option = response.content;
            switch(option) {
                case '1':
                    await message.channel.send("Please enter the class number you would like to add: ");
                    const addClassCollector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });
                    addClassCollector.on('collect', async (classResponse) => {
                        const classNumber = classResponse.content.trim();
                        if (/^\d{5}$/.test(classNumber)) {
                            addClass(userId, classNumber)
                            await message.channel.send(`Class number ${classNumber} added for user ${username}`);
                        } else {
                            await message.channel.send("Invalid class number. Please enter a 5-digit number.");
                        }
                    });
                    break;
                case '2':
                    await message.channel.send("Please enter the class number you would like to remove");
                    const removeClassCollector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });
                    removeClassCollector.on('collect', async (classResponse) => {
                        const classNumber = classResponse.content.trim();
                        if (/^\d{5}$/.test(classNumber)) {
                            removeClass(userId, classNumber)
                            await message.channel.send(`Class number ${classNumber} has been removed for user ${username}`);
                        } else {
                            await message.channel.send("Invalid class number. Please enter a 5-digit number.");
                        }
                    });
                    break;
                case '3':
                    const classNumbers = showClasses(userId)
                    if (classNumbers.length === 0) {
                        message.channel.send("User is not tracking any classes")
                        return
                    } else {
                        const classNumbers = await showClasses(userId);
                        const classList = classNumbers.join(', ');
                        message.channel.send(`Classes: ${classList}`);
                    }
                    break;
                case '4':
                    await message.channel.send("Please enter the class number you would like to check: ");
                    const checkClassCollector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });
                    checkClassCollector.on('collect', async (classResponse) => {
                        const classNumber = classResponse.content.trim();
                        if (/^\d{5}$/.test(classNumber)) {
                            const data_to_pass_in = classNumber;
                            const python_process = spawn('python', ['./asuClassBot.py', data_to_pass_in]);
                            python_process.stdout.on('data', (data) => {
                                message.channel.send(data.toString());
                            });
                        } else {
                            message.channel.send("Please start over and enter a proper class number.")
                        }
                    });
                    break;
                default:
                    await message.channel.send("Invalid option. Please try again.");
            }
        });
    }
});



async function checkClassAvailability(client) {
    try {
        // Fetch all users from the database
        const users = await User.find({});

        // Iterate over each user
        for (const user of users) {
            const discordId = user.userId; // Assuming userId is the Discord ID
            const classNumbers = user.classes; // Array of class numbers
            
            // Check each class number for availability
            for (const classNumber of classNumbers) {
                const status = await getClassStatus(classNumber);
                const trimmedStatus = status.trim()
                console.log("Status is " + trimmedStatus)
                
                // If the class is open, notify the user
                if (trimmedStatus === 'Open') {
                    notifyUser(discordId, classNumber);
                } 
            }
        }
    } catch (error) {
        console.error('Error checking class availability:', error);
    }
}

function getClassStatus(classNumber) {
    return new Promise((resolve) => {
        const data_to_pass_in = classNumber;
        const python_process = spawn('python', ['./asuClassBot.py', data_to_pass_in]);
        python_process.stdout.on('data', (data) => {
            resolve(data.toString());
        });
    });
}

function notifyUser(discordId, classNumber) {
    client.users.fetch(discordId).then(user => {
        if (user) {
            user.send(`Class ${classNumber} is now open!`);
        } else {
            console.log(`User with ID ${discordId} not found`);
        }
    }).catch(error => {
        console.error('Error fetching user:', error);
    });
}




client.login(token);